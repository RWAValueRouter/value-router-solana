import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SOLANA_USDC_ADDRESS, getAnchorConnection, getPrograms, getInitializePdas } from "./utils";

const jito_url = process.env.JITO_URL;

const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const { valueRouterProgram } = getPrograms(provider);

  const pdas = getInitializePdas({
    valueRouterProgram,
  });

  console.log("pdas: ", pdas);

  const accounts = {
    payer: provider.wallet.publicKey,
    valueRouter: pdas.valueRouterAccount.publicKey,
    programAuthority: PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      valueRouterProgram.programId
    )[0],
    usdcMint: new PublicKey(SOLANA_USDC_ADDRESS),
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    programUsdcAccount: PublicKey.findProgramAddressSync(
      [Buffer.from("usdc")],
      valueRouterProgram.programId
    )[0],
    programUsdcInAccount: PublicKey.findProgramAddressSync(
      [Buffer.from("usdc_in")],
      valueRouterProgram.programId
    )[0],
  };

  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 500000,
  });

  const initializeIx = await valueRouterProgram.methods
    .initialize({})
    .accounts(accounts)
    .instruction();

  const initializeIxs = [
    computeUnitPriceIx,
    initializeIx,
  ];

  await sendTx(provider, initializeIxs);
};

const MAX_RETRIES = 10; // 最大重试次数
const TIMEOUT = 120000; // 等待时间（毫秒）

const sendTx = async (provider, instructions, addressLookupTableAccounts) => {
  let txID = null;
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    attempts++;

    const blockhash = (await provider.connection.getLatestBlockhash())
      .blockhash;

    const messageV0 = new TransactionMessage({
      payerKey: provider.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: instructions,
    }).compileToV0Message(addressLookupTableAccounts);

    const tx = new VersionedTransaction(messageV0);

    try {
      const simulationResult = await provider.connection.simulateTransaction(
        tx
      );
      console.log("simulate logs: ", simulationResult.value.logs);

      /*txID = await provider.sendAndConfirm(tx, null, TIMEOUT);
      console.log(
        `Relay transaction: ${attempts}/${MAX_RETRIES} - Success, TX ID: ${txID}`
      );
      break; // Exit the loop if successful*/

      await provider.wallet.signTransaction(tx);

      const serializedTx = bs58.encode(tx.serialize());

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
        txID = result["result"];
        break;
      }
    } catch (error) {
      console.error(`Relay transaction: ${attempts}/${MAX_RETRIES} - Failed`);
      console.log({ e: error });

      // Check if transaction ID is already on-chain using connection
      if (error.txId) {
        console.log(`Checking TX ID: ${error.txId} on-chain...`);
        try {
          const transactionInfo = await provider.connection.getTransaction(
            error.txId
          );
          if (transactionInfo) {
            console.log(
              `Transaction ID: ${error.txId} found on-chain. Skipping to next attempt.`
            );
            continue;
          }
        } catch (error) {
          console.error(`Error checking transaction: ${error.message}`);
        }
      }

      // If not on-chain, continue with next attempt
      console.error("Transaction not yet on-chain. Retrying...");
      // 等 2 秒重试
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!txID) {
    console.error(`Failed to relay transaction after ${MAX_RETRIES} attempts.`);
    throw new Error("relay failed");
  }
};

main();
