import { PublicKey, Keypair, SystemProgram, Authorized } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const { valueRouterProgram, cctpMessageReceiverProgram } =
    getPrograms(provider);
  console.log(
    "valueRouterProgram id: ",
    valueRouterProgram.programId.toString()
  );
  console.log(
    "cctpMessageReceiverProgram id: ",
    cctpMessageReceiverProgram.programId.toString()
  );

  const pdas = getInitializePdas({
    valueRouterProgram,
  });

  console.log("pdas: ", pdas);

  const accounts = {
    payer: provider.wallet.publicKey,
    authorityPda: pdas.authorityPda.publicKey,
    valueRouter: pdas.valueRouterAccount.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    cctpMessageReceiver: cctpMessageReceiverProgram.programId,
  };

  const initializeTx = await valueRouterProgram.methods
    .initialize({})
    .accounts(accounts)
    .rpc();

  console.log("valueRouterProgram txHash:", initializeTx);
};

main();
