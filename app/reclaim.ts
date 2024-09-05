import "dotenv/config";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import {
  PublicKey,
  TransactionMessage,
  ComputeBudgetProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import { getBytes } from "ethers";

import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  SOLANA_USDC_ADDRESS,
  evmAddressToBytes32,
  getAnchorConnection,
  getSwapAndBridgePdas,
  getPrograms,
} from "./utils";

const jito_url = process.env.JITO_URL;

const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);

const destinationDomain = Number(process.env.DEST_DOMAIN!);

// Reclaim event accounts created in this transaction : 23sSLE5R4GbwUCQWbGhz5sfxqkUiNkWv55SNYdknyDXxo4JzV2TrXKcATXjCyMQtpUEv3VKh7YqiGMqjBq1Se4QE

// Get event accounts from the swapAndBridgeShareEventAccounts tx
const messageSentEventAccountKeypair1 = new PublicKey(
  "Abt8EtmmDiPMkFPP81y9B8zi125Fo2phUGXiJTvBkbVU"
);
const messageSentEventAccountKeypair2 = new PublicKey(
  "HT7jdNVBBgE8aHQEVnr237gikSVDwui3vyYADGPvwiik"
);

// Get bridge and swap attestations
const attestation1 =
  "0xe133092d1263277d2671b60ff367e3ea566ef137af297f02b05f2bb86b3d37121c99cf2c73e8c0134377869d9a79a25676894bd3ca104010c6d893517ae749a71c68681f49973ba3c8955c4dda0336978f92a8cb5082eabbf1088b4e149e43d21a1f1f27779da3561047464859d0e7a3b09435984d15a0596371ed029d8a86640d1b";

const attestation2 =
  "0x46de205c80f4834ae9ccf36d7fb89f9f9b551fc57545e0e0ccd99c6475baf95d300d55d311be9eb7cae1c17c9fedab1ec0da2296dd290a1f7016ec1a3e597e141b50ec1f3b7fb6209193dc631275f9c02ed3a4dca5782b137297fbee1737d777bd64a8eed7d0e0977afca28a11f05f58b0bf1e39facfb8e03143d500da5f5d89381c";

const provider = getAnchorConnection();
provider.opts.expire = 4294967295;

const {
  messageTransmitterProgram,
  tokenMessengerMinterProgram,
  valueRouterProgram,
} = getPrograms(provider);

const reclaim = async () => {
  const programUsdcAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("usdc")],
    valueRouterProgram.programId
  )[0];
  console.log("programUsdcAccount: ", programUsdcAccount);

  const [userUsdcAccount] = await PublicKey.findProgramAddressSync(
    [
      provider.wallet.publicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      usdcAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  console.log("userUsdcAccount: ", userUsdcAccount);

  /// 3. Get accounts
  const pdas = getSwapAndBridgePdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
    },
    usdcAddress,
    destinationDomain
  );

  const accounts_1 = {
    messageTransmitterProgram: messageTransmitterProgram.programId,
    messageTransmitter: pdas.messageTransmitterAccount.publicKey,

    senderAuthorityPda: pdas.authorityPda.publicKey,
    senderAuthorityPda2: pdas.authorityPda2.publicKey,

    remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
    localToken: pdas.localToken.publicKey,
    burnTokenMint: usdcAddress,

    messageSentEventData: messageSentEventAccountKeypair1,

    programAuthority: PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      valueRouterProgram.programId
    )[0],
  };

  const accounts_2 = {
    messageTransmitterProgram: messageTransmitterProgram.programId,
    messageTransmitter: pdas.messageTransmitterAccount.publicKey,

    senderAuthorityPda: pdas.authorityPda.publicKey,
    senderAuthorityPda2: pdas.authorityPda2.publicKey,

    remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
    localToken: pdas.localToken.publicKey,
    burnTokenMint: usdcAddress,

    messageSentEventData: messageSentEventAccountKeypair2,

    programAuthority: PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      valueRouterProgram.programId
    )[0],
  };

  /// 5. Build reclaim instruction
  const reclaimInstruction_1 = await valueRouterProgram.methods
    .reclaim({
      attestation: Buffer.from(attestation1.replace("0x", ""), "hex"),
    })
    .accounts(accounts_1)
    .instruction();

  const reclaimInstruction_2 = await valueRouterProgram.methods
    .reclaim({
      attestation: Buffer.from(attestation2.replace("0x", ""), "hex"),
    })
    .accounts(accounts_2)
    .instruction();

  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 500000,
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 100000,
  });

  const instructions = [
    computeBudgetIx,
    addPriorityFee,
    reclaimInstruction_1,
    reclaimInstruction_2,
  ];

  /// 6. Send transaction
  const blockhash = (await provider.connection.getLatestBlockhash()).blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: provider.wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);

  try {
    /*const txID = await provider.sendAndConfirm(transaction, []);
    console.log({ txID });
    return txID;*/

    transaction.sign([]);

    await provider.wallet.signTransaction(transaction);

    const serializedTx = bs58.encode(transaction.serialize());

    const response = await fetch(jito_url + "transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sendTransaction",
        params: [serializedTx],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error sending transaction:", error);
    } else {
      const result = await response.json();
      console.log("Transaction result:", result);
      return result["result"];
    }
  } catch (e) {
    console.log({ e: e });
  }
};

reclaim();
