import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Authorized } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const newAdmin = new PublicKey(
  "BDwT98799f43QLwwmwr4RkUPcEkCtHWz8qBgE13YRo55"
);

const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const { valueRouterProgram } = getPrograms(provider);

  const pdas = getInitializePdas({
    valueRouterProgram,
  });

  console.log("pdas: ", pdas);

  const accounts = {
    admin: provider.wallet.publicKey,
    valueRouter: pdas.valueRouterAccount.publicKey,
  };

  const setAdminTx = await valueRouterProgram.methods
    .setAdmin({
      admin: newAdmin
    })
    .accounts(accounts)
    .rpc();

  console.log("valueRouterProgram txHash:", setAdminTx);

  const accountInfo = await provider.connection.getAccountInfo(
    pdas.valueRouterAccount.publicKey
  );
  console.log(accountInfo);
};

main();
