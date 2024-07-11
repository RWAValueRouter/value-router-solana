import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import { getAnchorConnection } from "./utils";

const wsolMint = new PublicKey("So11111111111111111111111111111111111111112");

export async function createWsolAccountAndConvertSolToWsol(amount: number) {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    provider.wallet.publicKey,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction().add(
    spl.createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      associatedToken,
      provider.wallet.publicKey,
      wsolMint,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: associatedToken,
      lamports: amount,
    }),
    spl.createSyncNativeInstruction(associatedToken, spl.TOKEN_PROGRAM_ID)
  );

  const txID = await provider.sendAndConfirm(transaction);

  console.log("txID: ", txID);
}

export async function convertSolToWsol(amount: number) {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    provider.wallet.publicKey,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: associatedToken,
      lamports: amount,
    }),
    spl.createSyncNativeInstruction(associatedToken, spl.TOKEN_PROGRAM_ID)
  );

  const txID = await provider.sendAndConfirm(transaction);

  console.log("txID: ", txID);
}

convertSolToWsol(444);
