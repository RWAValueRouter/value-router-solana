import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Authorized } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const feeReceiver = new PublicKey(
  "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt"
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

  let domainIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let bridgeFees = Array.from({ length: 10 }, () => new anchor.BN(0));
  let swapFees = Array.from({ length: 10 }, () => new anchor.BN(0));
  let remoteValueRouter = Array.from(
    { length: 10 },
    () =>
      new PublicKey(
        Buffer.from(
          "0000000000000000000000000000000000000000000000000000000000000000",
          "hex"
        )
      )
  );

  bridgeFees[1] = new anchor.BN(100); // domain = 1, bridge fee = 0.000100

  swapFees[1] = new anchor.BN(100); // domain = 1, swap fee = 0.000100

  remoteValueRouter[1] = new PublicKey(
    Buffer.from(
      //"0000000000000000000000002fc343EBBf550d17ddd7C7A4b4De1a57609A00F9",
      "000000000000000000000000c36D05Fa1e5649bd3e29CA521da39FD4660914BF",
      "hex"
    )
  ); // domain = 1, value router contract = 0x2fc343EBBf550d17ddd7C7A4b4De1a57609A00F9

  const setValueRouterTx = await valueRouterProgram.methods
    .setValueRouter({
      domainIds: domainIds,
      bridgeFees: bridgeFees,
      swapFees: swapFees,
      remoteValueRouter: remoteValueRouter,
      feeReceiver: feeReceiver,
    })
    .accounts(accounts)
    .rpc();

  console.log("valueRouterProgram txHash:", setValueRouterTx);

  const accountInfo = await provider.connection.getAccountInfo(
    pdas.valueRouterAccount.publicKey
  );
  console.log(accountInfo);
};

main();
