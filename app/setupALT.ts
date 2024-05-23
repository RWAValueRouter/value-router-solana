import "dotenv/config";

import {
  AddressLookupTableProgram,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import * as spl from "@solana/spl-token";

import {
  getAnchorConnection,
  getPrograms,
  decodeEventNonceFromMessage,
  getRelayPdas,
  SOLANA_USDC_ADDRESS,
} from "./utils";

const provider = getAnchorConnection();
provider.opts.expire = 4294967295;

const createLookupTable = async () => {
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      recentSlot: await provider.connection.getSlot(),
    });

  console.log("lookupTableAddress: ", lookupTableAddress);

  const create_txid = await createAndSendV0Tx([lookupTableInst]);
  console.log("create_txid: ", create_txid);

  return lookupTableAddress;
};

const {
  messageTransmitterProgram,
  tokenMessengerMinterProgram,
  valueRouterProgram,
} = getPrograms(provider);

const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);

const remoteTokenAddressHex = process.env.REMOTE_TOKEN_HEX!;

const remoteDomain = process.env.REMOTE_DOMAIN!;

const messageHex1 = process.env.MESSAGE_HEX_BRIDGE!;
const messageHex2 = "0x000000000000000000000005000000000003ef66";

const nonce1 = decodeEventNonceFromMessage(messageHex1);
const nonce2 = decodeEventNonceFromMessage(messageHex2);

const populateLookupTable = async (lookupTableAddress, addresses) => {
  const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: provider.wallet.publicKey,
    authority: provider.wallet.publicKey,
    lookupTable: lookupTableAddress,
    addresses: addresses,
  });
  const populate_txid = await createAndSendV0Tx([addAddressesInstruction]);
  console.log("populate_txid: ", populate_txid);
};

const createAndSendV0Tx = async ([ints]) => {
  let latestBlockhash = await provider.connection.getLatestBlockhash(
    "confirmed"
  );

  const messageV0 = new TransactionMessage({
    payerKey: provider.wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [ints],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  const txid = await provider.sendAndConfirm(transaction);

  return txid;
};

(async () => {
  const pdas = await getRelayPdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
    },
    usdcAddress,
    remoteTokenAddressHex,
    remoteDomain,
    nonce1,
    nonce2
  );

  //const lookupTableAddress = await createLookupTable();
  const lookupTableAddress = new PublicKey(
    //"4eiZMuz9vSj2EGHSX3JUg3BRou1rNVG68VtsiiXXZLyp" // mainnet
    //"CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq" // mainnet
    "7XE9Q69NwcE58XKY3VWfnLB5WrdQeiRQYgEBj2VUkXYg" // devnet
  );

  // 每次更换合约时执行
  await populateLookupTable(lookupTableAddress, [
    messageTransmitterProgram.programId,
    tokenMessengerMinterProgram.programId,
    valueRouterProgram.programId,
    spl.TOKEN_PROGRAM_ID,
    SystemProgram.programId,
    pdas.messageTransmitterAccount.publicKey,
    pdas.tokenMessengerAccount.publicKey,
    pdas.tokenMinterAccount.publicKey,
    pdas.localToken.publicKey,
    pdas.remoteTokenMessengerKey.publicKey,
    pdas.remoteTokenKey,
    usdcAddress,
    pdas.tokenPair.publicKey,
    pdas.custodyTokenAccount.publicKey,
    pdas.tmAuthorityPda,
    pdas.vrAuthorityPda,
    pdas.tokenMessengerEventAuthority.publicKey,
  ]);
})();
