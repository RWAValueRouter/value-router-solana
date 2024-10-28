import {
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import { getAnchorConnection } from "./utils";

const wsolMint = new PublicKey("So11111111111111111111111111111111111111112");
const provider = getAnchorConnection();
provider.opts.expire = 4294967295;

export async function createWsolPda(userAddress: PublicKey, amount: bigint) {
  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    userAddress,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction().add(
    spl.createAssociatedTokenAccountInstruction(
      userAddress,
      associatedToken,
      userAddress,
      wsolMint,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );

  const txID = await provider.sendAndConfirm(transaction);

  console.log("txID: ", txID);
}

export async function depositWsolPda(userAddress: PublicKey, amount: bigint) {
  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    userAddress,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userAddress,
      toPubkey: associatedToken,
      lamports: amount,
    })
  );

  const txID = await provider.sendAndConfirm(transaction);

  console.log("txID: ", txID);
}

export async function checkWsolPdaLamport(userAddress: PublicKey): Promise<bigint> {
  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    userAddress,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accountInfo = await provider.connection.getAccountInfo(associatedToken);

  return BigInt(accountInfo.lamports);
}

export async function syncNative(userAddress: PublicKey, amount: bigint) {
  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    userAddress,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = new Transaction().add(
    spl.createSyncNativeInstruction(associatedToken, spl.TOKEN_PROGRAM_ID)
  );

  const txID = await provider.sendAndConfirm(transaction);

  console.log("txID: ", txID);
}

export async function checkWsolBalance(userAddress: PublicKey): Promise<bigint> {
  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    userAddress,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const wsolAccount = await spl.getAccount(provider.connection, associatedToken);

  return wsolAccount.amount;
}

export async function wrapSol(userAddress: PublicKey, amount: bigint) {
  const associatedToken = spl.getAssociatedTokenAddressSync(
    wsolMint,
    userAddress,
    false,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accountInfo = await provider.connection.getAccountInfo(associatedToken);
  if (!accountInfo) {
    console.log("wsol token account does not exist");
    // create and deposit and syncNative
    const transaction = new Transaction().add(
      spl.createAssociatedTokenAccountInstruction(
        userAddress,
        associatedToken,
        userAddress,
        wsolMint,
        spl.TOKEN_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      SystemProgram.transfer({
        fromPubkey: userAddress,
        toPubkey: associatedToken,
        lamports: amount,
      }),
      spl.createSyncNativeInstruction(associatedToken, spl.TOKEN_PROGRAM_ID)
    );
    return;
  }
  console.log("wsol token account exists");

  const WSOL_ACCOUNT_DATA_SIZE = 165;
  const minRent = BigInt(await provider.connection.getMinimumBalanceForRentExemption(WSOL_ACCOUNT_DATA_SIZE));
  console.log("minRent: ", minRent);

  const lamports: bigint = BigInt(accountInfo.lamports);
  console.log("lamport of wsol pda: ", lamports);

  const lamportsAvail = lamports - minRent;

  const wsolAccount = await spl.getAccount(provider.connection, associatedToken);
  const bal: bigint = wsolAccount.amount;
  console.log("wsol balance: ", bal);

  if (amount <= bal) {
    // wsol balance is enough
  } else if (amount <= lamportsAvail) {
    console.log("lamport is enough, syncing");
    const transaction = new Transaction().add(
      spl.createSyncNativeInstruction(associatedToken, spl.TOKEN_PROGRAM_ID)
    );
    const txID = await provider.sendAndConfirm(transaction);
    console.log("txID: ", txID);
  } else {
    // deposit and syncNative
    const wrapAmount = amount - lamportsAvail;
    console.log("wrapping amount: ", wrapAmount);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userAddress,
        toPubkey: associatedToken,
        lamports: wrapAmount,
      }),
      spl.createSyncNativeInstruction(associatedToken, spl.TOKEN_PROGRAM_ID)
    );
    const txID = await provider.sendAndConfirm(transaction);
    console.log("txID: ", txID);
  }
}

(async () => {
  await wrapSol(provider.wallet.publicKey, BigInt("1000000"));
})()