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
  getSwapAndBridgePdas,
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
  cctpMessageReceiverProgram,
} = getPrograms(provider);

const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);

const remoteTokenAddressHex = process.env.REMOTE_TOKEN_HEX!;

const remoteDomain = process.env.REMOTE_DOMAIN!;

const messageHex1 = process.env.MESSAGE_HEX_BRIDGE!;
const messageHex2 = "0x000000000000000000000005000000000003ef66";

const nonce1 = decodeEventNonceFromMessage(messageHex1);
const nonce2 = decodeEventNonceFromMessage(messageHex2);
const jupiterProgramId = new PublicKey(process.env.JUPITER_ADDRESS);

const swapAndBridgePdas = getSwapAndBridgePdas(
  {
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
    cctpMessageReceiverProgram,
  },
  usdcAddress,
  0 // not used here
);

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
  //const lookupTableAddress = await createLookupTable();
  const lookupTableAddress = new PublicKey(
    //"4eiZMuz9vSj2EGHSX3JUg3BRou1rNVG68VtsiiXXZLyp" // mainnet
    //"7XE9Q69NwcE58XKY3VWfnLB5WrdQeiRQYgEBj2VUkXYg" // devnet
    //"CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq" // mainnet
    //"J5y2dSuVbGd5yQpTN1wcfC97LXWkRpqK3dXYXupEZtXZ"
    //"47cYDtFWHLqF6pGSdcTibrfsoGV5SKcMZ429vn1D9vGb"
    "G6XcDmLhLDBDxeYpCiumt1KCRiNEDoFh3JEdTXu5H4kf"
  );
  console.log("lookupTableAddress: ", lookupTableAddress);

  const relayPdas = await getRelayPdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
      cctpMessageReceiverProgram,
    },
    usdcAddress,
    remoteTokenAddressHex,
    remoteDomain,
    nonce1,
    nonce2
  );

  // 每次更换合约时执行
  await populateLookupTable(lookupTableAddress, [
    messageTransmitterProgram.programId,
    tokenMessengerMinterProgram.programId,
    valueRouterProgram.programId,
    spl.TOKEN_PROGRAM_ID,
    SystemProgram.programId,
    swapAndBridgePdas.messageTransmitterAccount.publicKey,
    swapAndBridgePdas.tokenMessengerAccount.publicKey,
    swapAndBridgePdas.tokenMinterAccount.publicKey,
    swapAndBridgePdas.localToken.publicKey,
    swapAndBridgePdas.remoteTokenMessengerKey.publicKey,
    relayPdas.remoteTokenKey,
    usdcAddress,
    relayPdas.tokenPair.publicKey,
    relayPdas.custodyTokenAccount.publicKey,
    relayPdas.tmAuthorityPda,
    relayPdas.vrAuthorityPda,
    relayPdas.tokenMessengerEventAuthority.publicKey,
    swapAndBridgePdas.valueRouterAccount.publicKey,
    swapAndBridgePdas.localToken.publicKey,
    usdcAddress,
    jupiterProgramId,
    swapAndBridgePdas.authorityPda.publicKey,
    swapAndBridgePdas.authorityPda2.publicKey,
  ]);
})();
