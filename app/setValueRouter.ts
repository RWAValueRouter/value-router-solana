import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Authorized } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const feeReceiver = new PublicKey(
  "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt"
);

function parseHexString(str) { 
    var result = [];
    while (str.length >= 2) { 
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }

    return result;
}

const nobleUsdc = new PublicKey(
  bs58.encode(parseHexString("487039debedbf32d260137b0a6f66b90962bec777250910d253781de326a716d"))
);
console.log("nobleUsdc: ", nobleUsdc);

const nobleCaller = new PublicKey(
  bs58.encode(parseHexString("000000000000000000000000bbc905eb987498003c94d64bba25ee5efe84b51e"))
);
console.log("nobleCaller: ", nobleCaller);

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

  bridgeFees[0] = new anchor.BN(68027211); // domain = 0, bridge fee = 0.000100
  bridgeFees[1] = new anchor.BN(3401361); // domain = 1, bridge fee = 0.000100
  bridgeFees[2] = new anchor.BN(3401361); // domain = 2, bridge fee = 0.000100
  bridgeFees[3] = new anchor.BN(3401361); // domain = 3, bridge fee = 0.000100
  bridgeFees[6] = new anchor.BN(3401361); // domain = 6, bridge fee = 0.000100
  bridgeFees[7] = new anchor.BN(3401361); // domain = 7, bridge fee = 0.000100

  swapFees[0] = new anchor.BN(102040816); // domain = 0, swap fee = 0.000100
  swapFees[1] = new anchor.BN(5102041); // domain = 1, swap fee = 0.000100
  swapFees[2] = new anchor.BN(5102041); // domain = 2, swap fee = 0.000100
  swapFees[3] = new anchor.BN(5102041); // domain = 3, swap fee = 0.000100
  swapFees[6] = new anchor.BN(5102041); // domain = 6, swap fee = 0.000100
  swapFees[7] = new anchor.BN(5102041); // domain = 7, swap fee = 0.000100

  remoteValueRouter[0] = new PublicKey(
    Buffer.from(
      "00000000000000000000000006bCcac1D96Ec89c1Dd62F715e0487b8c6B9FC92",
	  "hex"
	)
  );
  remoteValueRouter[1] = new PublicKey(
    Buffer.from(
      "000000000000000000000000c36D05Fa1e5649bd3e29CA521da39FD4660914BF",
      "hex"
    )
  );
  remoteValueRouter[2] = new PublicKey(
    Buffer.from(
      "00000000000000000000000006bCcac1D96Ec89c1Dd62F715e0487b8c6B9FC92",
      "hex"
    )
  );
  remoteValueRouter[3] = new PublicKey(
    Buffer.from(
      "00000000000000000000000006bCcac1D96Ec89c1Dd62F715e0487b8c6B9FC92",
      "hex"
    )
  );
  remoteValueRouter[6] = new PublicKey(
    Buffer.from(
      "00000000000000000000000006bCcac1D96Ec89c1Dd62F715e0487b8c6B9FC92",
      "hex"
    )
  );
  remoteValueRouter[7] = new PublicKey(
    Buffer.from(
      "000000000000000000000000D845c64c7196B96bB384e11361b2DeeE0D83921a",
      "hex"
    )
  );
  const setValueRouterTx = await valueRouterProgram.methods
    .setValueRouter({
      domainIds: domainIds,
      bridgeFees: bridgeFees,
      swapFees: swapFees,
      remoteValueRouter: remoteValueRouter,
      feeReceiver: feeReceiver,
	  nobleCaller: nobleCaller,
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
