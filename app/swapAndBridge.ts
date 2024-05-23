import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import { getBytes } from "ethers";

import {
  getQuote,
  getSwapIx,
  instructionDataToTransactionInstruction,
  getAdressLookupTableAccounts,
} from "./jupiter";

import {
  SOLANA_USDC_ADDRESS,
  evmAddressToBytes32,
  getAnchorConnection,
  getSwapAndBridgePdas,
  getMessages,
  getPrograms,
} from "./utils";

const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);
const usdtAddress = new PublicKey(process.env.USDT_ADDRESS);
const wsolAddress = new PublicKey(process.env.WSOL_ADDRESS);
const sourceMint = new PublicKey(process.env.USDT_ADDRESS);
const userTokenAccount = new PublicKey(process.env.USER_TOKEN_ACCOUNT);
const jupiterProgramId = new PublicKey(process.env.JUPITER_ADDRESS);
const remoteValueRouter = new PublicKey(
  getBytes(evmAddressToBytes32(process.env.REMOTE_VALUE_ROUTER!))
);
const LOOKUP_TABLE_2_ADDRESS = new PublicKey(
  //"4eiZMuz9vSj2EGHSX3JUg3BRou1rNVG68VtsiiXXZLyp"
  "CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq"
);

const inputToken = usdtAddress;
//const inputToken = wsolAddress;

// Default to 1 USDCSOL (e.g. $0.000001)
const bridgeUsdcAmount = new anchor.BN(process.env.SELL_AMOUNT ?? 1);
const destinationDomain = Number(process.env.DEST_DOMAIN!);

// mintRecipient is a bytes32 type so pad with 0's then convert to a solana PublicKey
const mintRecipient = new PublicKey(
  getBytes(evmAddressToBytes32(process.env.MINT_RECIPIENT_HEX!))
);
const buyToken = new PublicKey(
  getBytes(evmAddressToBytes32(process.env.BUY_TOKEN!))
);
let guaranteedBuyAmount_num = new anchor.BN(process.env.BUY_AMOUNT ?? 1);
const guaranteedBuyAmount_hex = guaranteedBuyAmount_num.toString(16);
const paddedHexString: string = guaranteedBuyAmount_hex.padStart(64, "0");
const guaranteedBuyAmount: Buffer = Buffer.from(paddedHexString, "hex");

// Generate a new keypairs for the MessageSent event account.
const messageSentEventAccountKeypair1 = Keypair.generate();
const messageSentEventAccountKeypair2 = Keypair.generate();

const main = async () => {
  let txID = await sendSwapAndBridgeTx();
  await getCCTPAttestations(txID);
};

/**
 * 发起 Solana -> EVM/Noble swapAndBridge transaction
 *
 * 调用 value_router program swap_and_bridge 指令
 * 合约功能:
 * 1. 调用 Jupiter，把 SPL token 兑换为 local token (USDC)
 * 2. 调用 CCTP token messenger，发送 bridge message
 * 3. 根据 swap args 参数生成 swap message body，调用 CCTP messenger transmitter，发送 swap message
 *
 * 此脚本功能:
 * 1. 获取 Jupiter 报价
 * 2. 获取 Local swap 的指令 data 和 accounts
 * 3. 计算 context accounts
 * 4. 归集 address lookup table
 *  swapIx 中包含的多个 ALT
 *  value_router 合约专用 ALT
 * 5. 构建 swap_and_bridge instruction
 * 6. 发送交易
 */
const sendSwapAndBridgeTx = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const {
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
  } = getPrograms(provider);

  const programUsdcAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("usdc")],
    valueRouterProgram.programId
  )[0];
  console.log("programUsdcAccount: ", programUsdcAccount);

  /// 1. 获取 Jupiter 报价
  let quote = await getQuote(
    inputToken.toBase58(),
    process.env.USDC_ADDRESS,
    100000
  );

  console.log("quote: ", JSON.stringify(quote));

  /// 2. 获取 local swap 的 data 和 accounts
  const swapIx = await getSwapIx(
    provider.wallet.publicKey,
    programUsdcAccount,
    quote
  );
  let addressLookupTableAddresses = swapIx.addressLookupTableAddresses;

  let swapInstruction = instructionDataToTransactionInstruction(
    swapIx.swapInstruction
  );

  let computeBudgetInstructions = swapIx.computeBudgetInstructions;

  /// 3. Get accounts
  const pdas = getSwapAndBridgePdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
    },
    usdcAddress,
    destinationDomain
  );

  const seed = Buffer.from("__event_authority");
  let eventAuthority = (() => {
    for (let b = 255; b > 0; b--) {
      const bump = new Uint8Array([b]);
      try {
        let eventAuthority = PublicKey.createProgramAddressSync(
          [seed, bump],
          tokenMessengerMinterProgram.programId
        );
        return eventAuthority;
      } catch (error) {
        continue;
      }
    }
  })();

  const accounts = {
    payer: provider.wallet.publicKey,
    eventRentPayer: provider.wallet.publicKey,

    messageTransmitterProgram: messageTransmitterProgram.programId,
    tokenMessengerMinterProgram: tokenMessengerMinterProgram.programId,
    valueRouterProgram: valueRouterProgram.programId,
    tokenProgram: spl.TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,

    messageTransmitter: pdas.messageTransmitterAccount.publicKey,
    tokenMessenger: pdas.tokenMessengerAccount.publicKey,
    tokenMinter: pdas.tokenMinterAccount.publicKey,
    valueRouter: pdas.valueRouterAccount.publicKey,

    senderAuthorityPda: pdas.authorityPda.publicKey,
    senderAuthorityPda2: pdas.authorityPda2.publicKey,

    payerInputAta: userTokenAccount,
    payerUsdcAta: userTokenAccount,
    remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
    localToken: pdas.localToken.publicKey,
    burnTokenMint: usdcAddress,

    messageSentEventData1: messageSentEventAccountKeypair1.publicKey,
    messageSentEventData2: messageSentEventAccountKeypair2.publicKey,
    remoteValueRouter: remoteValueRouter,

    //eventAuthority: pdas.eventAuthority.publicKey,
    eventAuthority: eventAuthority,

    //eventAuthority: messageSentEventAccountKeypair.publicKey,
    //program: valueRouterProgram.programId,

    programAuthority: PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      valueRouterProgram.programId
    )[0],

    programUsdcAccount: programUsdcAccount,

    sourceMint: sourceMint,

    jupiterProgram: jupiterProgramId,

    // other
    ownerInputAta: userTokenAccount,
  };

  console.log("remaining length: ", swapInstruction.keys.length);

  // accounts 去重处理，不用了
  /*
  const uniqueKeys = new Set(
    swapInstruction.keys.map((publicKeyInfo) => publicKeyInfo.pubkey.toString())
  );

  const dedupKeys = Array.from(uniqueKeys).map((publicKeyString) => {
    const originalObject = swapInstruction.keys.find(
      (publicKeyInfo) => publicKeyInfo.pubkey.toString() === publicKeyString
    );

    return {
      pubkey: new PublicKey(publicKeyString),
      isSigner: originalObject!.isSigner,
      isWritable: originalObject!.isWritable,
    };
  });
  console.log("dedupKeys length: ", dedupKeys.length);
  */

  /// 4. Organize accounts in address lookup tables
  /// 4.1 Jupiter ALT
  const addressLookupTableAccounts = await getAdressLookupTableAccounts(
    provider.connection,
    addressLookupTableAddresses
  );

  /// 4.2 ValueRouter ALT
  const lookupTable2 = (
    await provider.connection.getAddressLookupTable(LOOKUP_TABLE_2_ADDRESS)
  ).value;

  addressLookupTableAccounts.push(lookupTable2);

  console.log("addressLookupTableAccounts: ", addressLookupTableAccounts);

  /// 5. Call swapAndBridge
  const swapAndBridgeInstruction = await valueRouterProgram.methods
    .swapAndBridge({
      jupiterSwapData: swapInstruction.data,
      buyArgs: {
        buyToken: buyToken,
        guaranteedBuyAmount: guaranteedBuyAmount,
      },
      bridgeUsdcAmount: bridgeUsdcAmount,
      destDomain: 0,
      recipient: mintRecipient,
    })
    // eventAuthority and program accounts are implicitly added by Anchor
    .accounts(accounts)
    .remainingAccounts(swapInstruction.keys)
    //.remainingAccounts(dedupKeys)
    // messageSentEventAccountKeypair must be a signer so the MessageTransmitter program can take control of it and write to it.
    // provider.wallet is also an implicit signer
    //.signers([messageSentEventAccountKeypair1, messageSentEventAccountKeypair2])
    //.rpc();
    .instruction();

  const instructions = [
    ...computeBudgetInstructions.map(instructionDataToTransactionInstruction),
    swapAndBridgeInstruction,
  ];

  /// 6. Send transaction
  const blockhash = (await provider.connection.getLatestBlockhash()).blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: provider.wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);
  const transaction = new VersionedTransaction(messageV0);

  try {
    /*await provider.simulate(transaction, [
      messageSentEventAccountKeypair1,
      messageSentEventAccountKeypair2,
    ]);*/

    const txID = await provider.sendAndConfirm(transaction, [
      messageSentEventAccountKeypair1,
      messageSentEventAccountKeypair2,
    ]);
    console.log({ txID });
    return txID;
  } catch (e) {
    console.log({ e: e });
  }
};

/// 1. 获取 swap_and_bridge 交易中的 bridge message and swap message
/// 2. 获取对应的 attestations
const getCCTPAttestations = async (swapAndBridgeTx) => {
  // Fetch message and attestation
  console.log("valueRouterProgram txHash:", swapAndBridgeTx);
  const { bridgeMessage, swapMessage } = await (async () => {
    while (true) {
      const response = await getMessages(swapAndBridgeTx);
      console.log(
        "swapAndBridgeTx message 1 information:",
        response.messages[0]
      );
      console.log(
        "swapAndBridgeTx message 2 information:",
        response.messages[1]
      );
      console.log(
        "message and attestation can be used to receive the message on destination chain with domain",
        destinationDomain
      );
      const message1 = response.messages[0];
      const message2 = response.messages[1];
      if (
        message1.attestation !== "PENDING" &&
        message2.attestation !== "PENDING"
      ) {
        if (message1.eventNonce < message2.eventNonce) {
          return {
            bridgeMessage: message1,
            swapMessage: message2,
          };
        } else {
          return {
            bridgeMessage: message2,
            swapMessage: message1,
          };
        }
      }
      setTimeout(() => {}, 1000);
    }
  })();

  // Now, you can call receiveMessage on an EVM chain, see public quickstart for more information:
  // https://developers.circle.com/stablecoin/docs/cctp-usdc-transfer-quickstart

  // Example of reclaiming the rent from the MessageSent event account:
  const reclaimEventAccountTx1 = await messageTransmitterProgram.methods
    .reclaimEventAccount({
      attestation: Buffer.from(
        bridgeMessage.attestation.replace("0x", ""),
        "hex"
      ),
    })
    .accounts({
      payee: provider.wallet.publicKey,
      messageTransmitter: pdas.messageTransmitterAccount.publicKey,
      messageSentEventData: messageSentEventAccountKeypair1.publicKey,
    })
    .rpc();
  console.log("\n\nreclaimEventAccount txHash: ", reclaimEventAccountTx1);
  console.log(
    "Event account 1 has been reclaimed and SOL paid for rent returned to payee."
  );

  const reclaimEventAccountTx2 = await messageTransmitterProgram.methods
    .reclaimEventAccount({
      attestation: Buffer.from(
        swapMessage.attestation.replace("0x", ""),
        "hex"
      ),
    })
    .accounts({
      payee: provider.wallet.publicKey,
      messageTransmitter: pdas.messageTransmitterAccount.publicKey,
      messageSentEventData: messageSentEventAccountKeypair2.publicKey,
    })
    .rpc();
  console.log("\n\nreclaimEventAccount txHash: ", reclaimEventAccountTx2);
  console.log(
    "Event account 2 has been reclaimed and SOL paid for rent returned to payee."
  );
};

main();
