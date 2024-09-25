import "dotenv/config";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import {
  PublicKey,
  TransactionMessage,
  SystemProgram,
  ComputeBudgetProgram,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  SOLANA_USDC_ADDRESS,
  getAnchorConnection,
  getSwapAndBridgePdas,
  getPrograms,
} from "./utils";

const jito_url = process.env.JITO_URL;

const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);

const provider = getAnchorConnection();
provider.opts.expire = 4294967295;

const {
  messageTransmitterProgram,
  tokenMessengerMinterProgram,
  valueRouterProgram,
} = getPrograms(provider);

const closeProgramAuthority = async () => {
  const pdas = getSwapAndBridgePdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
    },
    usdcAddress,
    0
  );

  const accounts = {
    admin: provider.wallet.publicKey,
    valueRouter: pdas.valueRouterAccount.publicKey,
    systemProgram: SystemProgram.programId,
    programAuthority: PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      valueRouterProgram.programId
    )[0],
  };

  const closeInstruction = await valueRouterProgram.methods
    .closeProgramAuthority({
    })
    .accounts(accounts)
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
    closeInstruction,
  ];

  const blockhash = (await provider.connection.getLatestBlockhash()).blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: provider.wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);

  try {
    transaction.sign([]);

    await provider.wallet.signTransaction(transaction);

    const serializedTx = bs58.encode(transaction.serialize());

    const simulationResult = await provider.connection.simulateTransaction(
      transaction
    );
    console.log("simulate logs: ", simulationResult.value.logs);

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

closeProgramAuthority();
