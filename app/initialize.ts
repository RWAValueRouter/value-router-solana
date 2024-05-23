import { PublicKey, Keypair, SystemProgram, Authorized } from "@solana/web3.js";
import { getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const { valueRouterProgram } = getPrograms(provider);
  console.log(valueRouterProgram);

  const pdas = getInitializePdas({ valueRouterProgram });

  const accounts = {
    payer: provider.wallet.publicKey,
    authorityPda: pdas.authorityPda.publicKey,
    valueRouter: pdas.valueRouterAccount.publicKey,
    systemProgram: SystemProgram.programId,
  };

  const initializeTx = await valueRouterProgram.methods
    .initialize({})
    .accounts(accounts)
    .rpc();

  console.log("valueRouterProgram txHash:", initializeTx);
};

main();
