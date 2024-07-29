// Import the Solana web3.js library
import { LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { getAnchorConnection } from "./utils";
import * as anchor from "@coral-xyz/anchor";

async function sendTransaction() {
  const provider = getAnchorConnection();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: provider.wallet.publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    })
  );

  // Sign the transaction with the sender's keypair
  const signature = await provider.sendAndConfirm(transaction, [], {
    commitment: "confirmed",
  });

  console.log("Transaction signature", signature);
  var tryTime = 0;

  provider.opts.commitment = "confirmed";
  anchor.setProvider(provider);

  const intervalId = setInterval(async () => {
    console.log("Try: ", tryTime);
    tryTime++;
    try {
      const transaction = await provider.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 1,
      });

      if (!transaction) {
        console.log("Transaction not found");
      } else {
        console.log("Transaction details:", transaction);
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
    }
  }, 3000);
}

// Execute the sendTransaction function
sendTransaction().catch((err) => {
  console.error(err);
});
