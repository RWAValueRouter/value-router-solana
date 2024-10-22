import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Authorized } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const feeReceiver = new PublicKey(
  "6m9RuGeKMYcJwY7YPCFecQECwfy3JKfDbN4HgR91sFpZ"
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

  //[[32051282,64102564],[1923077,2564103],[1923077,2564103],[1923077,2564103],[1923077,2564103],[0,0],[1923077,2564103],[1923077,2564103]]

  bridgeFees[0] = new anchor.BN(32051282); // domain = 0, bridge fee = 0.000100
  bridgeFees[1] = new anchor.BN(1923077); // domain = 1, bridge fee = 0.000100
  bridgeFees[2] = new anchor.BN(1923077); // domain = 2, bridge fee = 0.000100
  bridgeFees[3] = new anchor.BN(1923077); // domain = 3, bridge fee = 0.000100
  bridgeFees[4] = new anchor.BN(1923077); // domain = 3, bridge fee = 0.000100
  bridgeFees[6] = new anchor.BN(1923077); // domain = 6, bridge fee = 0.000100
  bridgeFees[7] = new anchor.BN(1923077); // domain = 7, bridge fee = 0.000100

  swapFees[0] = new anchor.BN(64102564); // domain = 0, swap fee = 0.000100
  swapFees[1] = new anchor.BN(2564103); // domain = 1, swap fee = 0.000100
  swapFees[2] = new anchor.BN(2564103); // domain = 2, swap fee = 0.000100
  swapFees[3] = new anchor.BN(2564103); // domain = 3, swap fee = 0.000100
  swapFees[4] = new anchor.BN(2564103); // domain = 3, swap fee = 0.000100
  swapFees[6] = new anchor.BN(2564103); // domain = 6, swap fee = 0.000100
  swapFees[7] = new anchor.BN(2564103); // domain = 7, swap fee = 0.000100

  remoteValueRouter[0] = new PublicKey(
    Buffer.from(
      "00000000000000000000000066F011F9F4ab937b47f51a8da5542c897D12E3Cb",
	  "hex"
	)
  );
  remoteValueRouter[1] = new PublicKey(
    Buffer.from(
      "00000000000000000000000043Dc3A0abc0148b2Cc9E76699Aa9e8f5edf69B36",
      "hex"
    )
  );
  remoteValueRouter[2] = new PublicKey(
    Buffer.from(
      "000000000000000000000000c17cffDaA599A759d06EE2Eae88866055622d937",
      "hex"
    )
  );
  remoteValueRouter[3] = new PublicKey(
    Buffer.from(
      "000000000000000000000000E438AADd3C34e444FF775F7d376ffE54d197673A",
      "hex"
    )
  );
  remoteValueRouter[6] = new PublicKey(
    Buffer.from(
      "0000000000000000000000007C5d3CF79f213F691637AB28b414eBCB41F4FfbB",
      "hex"
    )
  );
  remoteValueRouter[7] = new PublicKey(
    Buffer.from(
      "0000000000000000000000007C5d3CF79f213F691637AB28b414eBCB41F4FfbB",
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
