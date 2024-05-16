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
} = getPrograms(provider);

const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);

const jupiterProgramId = new PublicKey(process.env.JUPITER_ADDRESS);

const pdas = getSwapAndBridgePdas(
  {
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
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
    //"4eiZMuz9vSj2EGHSX3JUg3BRou1rNVG68VtsiiXXZLyp"
    "CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq"
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
    pdas.valueRouterAccount.publicKey,
    pdas.localToken.publicKey,
    usdcAddress,
    jupiterProgramId,
    pdas.authorityPda.publicKey,
    pdas.authorityPda2.publicKey,
  ]);

  
  /*await populateLookupTable(lookupTableAddress, [
    //new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"), // USDT
    //new PublicKey("So11111111111111111111111111111111111111112"), // WSOL
    //new PublicKey("FwewVm8u6tFPGewAyHmWAqad9hmF7mvqxK4mJ7iNqqGC"), // amm
    //new PublicKey("D2ze4v7YYmBPfrDzA3XrFm4rvsmtDqoVJ4twdHS7QB98"), // amm
    //new PublicKey("3kyVVxbnEASKjLQB3wyPUc55VEGJWNeWZKf6Uv79YeuD"), // amm
    //new PublicKey("Fr5cEmpTCTGAmb2yPqSojCt6XSq42nriT8dohT2azGGF"), // amm
    //new PublicKey("8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj"), // amm
    //new PublicKey("55TucCMtiDs2k4bXcNssMRNCX7LxYPb42cauJAhpXdoQ"), // amm
    //new PublicKey("Gpa1yXcU1K9w5ag6TbSojcMLdP3CumB1goYkWuN96S7n"), // amm
    //new PublicKey("3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"), // wbtc
    //new PublicKey("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"), // dogwifhat
    //new PublicKey("CGBt4EAiBqPz57b2FCpMXs3RHS7ZWrky1usiyNZkEVAY"), // amm
    //new PublicKey("CGBt4EAiBqPz57b2FCpMXs3RHS7ZWrky1usiyNZkEVAY"), // amm
    //new PublicKey("AhhoxZDmsg2snm85vPjqzYzEYESoKfb4KmTj4HrBBNwY"), // amm
    //new PublicKey("4mMDQ5kG9fFrBSQeedErsUoTBhY5KKnsKWGvenXRTwSy"), // amm
    //new PublicKey("6ojSigXF7nDPyhFRgmn3V9ywhYseKF9J32ZrranMGVSX"), // amm
    //new PublicKey("Cx8eWxJAaCQAFVmv1mP7B2cVie2BnkR7opP8vUh23Wcr"), // amm
  ]);
  */
})();
