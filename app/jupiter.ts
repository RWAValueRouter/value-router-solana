import { createJupiterApiClient } from "@jup-ag/api";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

const config = {
  basePath: "https://quote-api.jup.ag/v6",
};

const jupiterQuoteApi = createJupiterApiClient(config); // config is optional

export const getQuote_2 = async (inputMint, outputMint, amount) => {
  let quote = await jupiterQuoteApi.quoteGet({
    inputMint: inputMint,
    outputMint: outputMint,
    amount: amount,
    // platformFeeBps: 10,
    // asLegacyTransaction: true, // legacy transaction, default is versoined transaction
  });

  return quote;
};

export const getQuote = async (
  fromMint: string,
  toMint: string,
  amount: number
) => {
  return fetch(
    `${config.basePath}/quote?outputMint=${toMint}&inputMint=${fromMint}&amount=${amount}&slippage=0.5&maxAccounts=15`
  ).then((response) => response.json());
};

export const getSwapIx = async (
  user: PublicKey,
  outputAccount: PublicKey,
  quote: any
) => {
  const data = {
    quoteResponse: quote,
    userPublicKey: user.toBase58(),
    destinationTokenAccount: outputAccount.toBase58(),
    useSharedAccounts: true,
    wrapAndUnwrapSol: true,
  };
  return fetch(config.basePath + `/swap-instructions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((response) => response.json());
};

export const instructionDataToTransactionInstruction = (
  instructionPayload: any
) => {
  if (instructionPayload === null) {
    return null;
  }

  return new TransactionInstruction({
    programId: new PublicKey(instructionPayload.programId),
    keys: instructionPayload.accounts.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instructionPayload.data, "base64"),
  });
};

export const getAdressLookupTableAccounts = async (
  connection: any,
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos =
    await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
};
