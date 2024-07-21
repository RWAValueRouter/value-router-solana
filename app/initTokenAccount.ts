import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getAnchorConnection } from "./utils";

async function ensureTokenAccountExists(userPublicKey, mintAddress) {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  // Get the associated token account address
  const tokenAccountAddress = await getAssociatedTokenAddress(
    mintAddress,
    userPublicKey,
    false, // allowOwnerOffCurve, set to false for standard behavior
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Check if the token account already exists
  const accountInfo = await provider.connection.getAccountInfo(
    tokenAccountAddress
  );
  if (accountInfo !== null) {
    console.log(
      "Token account already exists:",
      tokenAccountAddress.toBase58()
    );
    return tokenAccountAddress;
  }

  // If it doesn't exist, create the token account
  const transaction = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      provider.wallet.publicKey, // payer
      tokenAccountAddress, // token account (to address)
      userPublicKey, // token account owner
      mintAddress, // mint
      TOKEN_PROGRAM_ID, // Token program ID
      ASSOCIATED_TOKEN_PROGRAM_ID // Associated Token Account program ID
    )
  );

  // Sign and send the transaction
  const signature = await await provider.sendAndConfirm(transaction);

  console.log("Token account created:", tokenAccountAddress.toBase58());
  return tokenAccountAddress;
}

// Example usage
(async () => {
  const userPublicKey = new PublicKey(
    "D5wyc7W4wfnV8WQehDxsuZ6J8Zbt3aSUpKoGpZE2ngpa"
  );
  const mintAddress = new PublicKey(
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"
  );
  const payer = Keypair.generate(); // replace with actual payer

  const tokenAccountAddress = await ensureTokenAccountExists(
    userPublicKey,
    mintAddress
  );
})();
