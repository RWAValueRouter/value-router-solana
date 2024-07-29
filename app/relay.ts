import "dotenv/config";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import * as fs from "fs";
import {
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  SOLANA_WSOL_ADDRESS,
  SOLANA_USDC_ADDRESS,
  decodeEventNonceFromMessage,
  getAnchorConnection,
  getPrograms,
  getRelayPdas,
  findProgramAddress,
} from "./utils";
import {
  getQuote,
  getSwapIx,
  instructionDataToTransactionInstruction,
  getAdressLookupTableAccounts,
} from "./jupiter";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

const jito_url = process.env.JITO_URL;

const wsolHex = new PublicKey(
  Buffer.from(
    "069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001",
    "hex"
  )
); // H5hM4fqRjygvCYXnp6dgFLgZ6o4uJ8Q9z7dAsTfapHmF

/**
 * EVM/Noble -> Solana relay 任务在 Solana 上执行的部分
 * 0. 获取到 value router bridge message 和 swap message 以及相应的 attestations
 *
 * 1. 创建 data account
 *  发送 create relay data 指令的交易 —— createRelayDataTx
 *
 * 2. 构建 post data 交易，包含两个指令
 *  2.1 post bridge message instruction
 *  2.2 post swap message instruction
 *  2.3 发送 postDataTransaction
 *
 * 3. 构建 relay 交易，包含3个指令
 *  3.1 准备 address lookup table
 *  3.2 构建 relay instruction
 *  3.3 构建 compute budget instruction
 *  3.4 发送 relay tx
 */
const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const {
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
    cctpMessageReceiverProgram,
  } = getPrograms(provider);

  // Init needed variables
  const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);
  const wsolAddress = new PublicKey(SOLANA_WSOL_ADDRESS);
  const remoteTokenAddressHex = process.env.REMOTE_TOKEN_HEX!;
  const messageHex1 = process.env.MESSAGE_HEX_BRIDGE!;
  const attestationHex1 = process.env.ATTESTATION_HEX_BRIDGE!;
  const messageHex2 = process.env.MESSAGE_HEX_SWAP!;
  const attestationHex2 = process.env.ATTESTATION_HEX_SWAP!;

  let recipientWalletAddress = new PublicKey(
    Buffer.from(messageHex2.slice(2), "hex").subarray(248)
  );
  /*let recipientWalletAddress = new PublicKey(
    "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt"
  );*/

  let outputTokenAddress = new PublicKey(
    Buffer.from(messageHex2.slice(2), "hex").subarray(184, 184 + 32)
  );

  let sellTokenAmount = BigInt(
    "0x" +
      Buffer.from(messageHex2.slice(2), "hex")
        .subarray(152, 184)
        .toString("hex")
  );

  let guaranteedBuyAmount = BigInt(
    "0x" +
      Buffer.from(messageHex2.slice(2), "hex")
        .subarray(216, 248)
        .toString("hex")
  );

  const sourceDomain = Buffer.from(messageHex2.slice(2), "hex")
    .subarray(4, 8)
    .readUIntBE(0, 4)
    .toString();

  // 计算 recipient 的 usdc 账户
  // swap 失败或 usdc 有剩余时会收到 usdc
  const [userUsdcAccount] = await PublicKey.findProgramAddressSync(
    [
      recipientWalletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      usdcAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // 计算 recipient 的 output token 账户
  const [userOutputTokenAccount] = await PublicKey.findProgramAddressSync(
    [
      recipientWalletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      outputTokenAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const bridgeNonce = decodeEventNonceFromMessage(messageHex1);
  const swapNonce = decodeEventNonceFromMessage(messageHex2);

  console.log({
    sourceDomain: sourceDomain,
    usdc: usdcAddress,
    sellTokenAmount: sellTokenAmount,
    outputTokenAddress: outputTokenAddress,
    guaranteedBuyAmount: guaranteedBuyAmount,
    recipientWalletAddress: recipientWalletAddress,
    userOutputTokenAccount: userOutputTokenAccount,
    userUsdcAccount: userUsdcAccount,
    remoteTokenAddressHex: remoteTokenAddressHex,
    bridgeNonce: bridgeNonce,
    swapNonce: swapNonce,
    messageHex1: messageHex1,
    attestationHex1: attestationHex1,
    messageHex2: messageHex2,
    attestationHex2: attestationHex2,
  });

  // relay data account 私钥文件，可重复使用
  const keyFile = "./relayDataAccount.json";

  const relayDataKeypair = await (async () => {
    if (fs.existsSync(keyFile)) {
      const data = await fs.readFileSync(keyFile);
      return Keypair.fromSecretKey(new Uint8Array(JSON.parse(data.toString())));
    } else {
      const relayDataKeypair = Keypair.generate();
      fs.writeFile(
        keyFile,
        JSON.stringify(Array.from(relayDataKeypair.secretKey)),
        (err) => {
          if (err) {
            console.error("Error writing file:", err);
          } else {
            console.log("File written successfully");
          }
        }
      );
      return relayDataKeypair;
    }
  })();

  console.log("relay data account: ", relayDataKeypair.publicKey);

  const valueRouter = PublicKey.findProgramAddressSync(
    [Buffer.from("value_router")],
    valueRouterProgram.programId
  )[0];

  const accountInfo = await provider.connection.getAccountInfo(valueRouter);

  const receiver = new PublicKey(accountInfo.data.slice(9, 41));

  console.log("valueRouter: ", valueRouter);
  console.log("receiver: ", receiver);

  /// 1. Create RelayData account transaction
  await createDataAccount(provider, valueRouterProgram, relayDataKeypair);

  /// 2. Post relay data transaction
  await postMessages(provider, valueRouterProgram, relayDataKeypair, [
    {
      message: messageHex1,
      attestation: attestationHex1,
    },
    {
      message: messageHex2,
      attestation: attestationHex2,
    },
  ]);

  /// 3. Relay 1 transaction
  await relay(
    provider,
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
    cctpMessageReceiverProgram,
    usdcAddress,
    wsolAddress,
    remoteTokenAddressHex,
    sourceDomain,
    bridgeNonce,
    swapNonce,
    userOutputTokenAccount,
    userUsdcAccount,
    recipientWalletAddress,
    outputTokenAddress,
    sellTokenAmount,
    relayDataKeypair
  );
};

const MAX_RETRIES = 10; // 最大重试次数
const TIMEOUT = 120000; // 等待时间（毫秒）

export const createDataAccount = async (
  provider,
  valueRouterProgram,
  relayDataKeypair
) => {
  console.log("\n\n1. Create data account\n");

  const accountInfo = await provider.connection.getAccountInfo(
    relayDataKeypair.publicKey
  );
  if (accountInfo) {
    console.log("relay data account exists:", accountInfo);

    return;
  }

  const createRelayDataTx = await valueRouterProgram.methods
    .createRelayData()
    .accounts({
      relayData: relayDataKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([relayDataKeypair])
    .transaction();

  let txID;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    console.log("Retry: ", retryCount);
    try {
      txID = await provider.sendAndConfirm(
        createRelayDataTx,
        [relayDataKeypair],
        TIMEOUT
      );
      console.log("create relay data account transaction: ", { txID });

      // 查询relayDataKeypair的pubkey对应的account是否存在
      const accountInfo = await provider.connection.getAccountInfo(
        relayDataKeypair.publicKey
      );
      if (accountInfo) {
        console.log("relay data account exists:", accountInfo);

        console.log(
          "relay data account data:",
          accountInfo.data.toString("hex")
        );
      } else {
        console.log("relay data account does not exist");
      }

      break; // 交易成功，跳出循环
    } catch (e) {
      console.log({ e: e });
      retryCount++;

      // 每次尝试不论成功或失败都要查询relayDataKeypair的pubkey对应的account是否存在
      const accountInfo = await provider.connection.getAccountInfo(
        relayDataKeypair.publicKey
      );
      if (accountInfo) {
        console.log("relay data account exists:", accountInfo);

        console.log(
          "relay data account data:",
          accountInfo.data.toString("hex")
        );

        break;
      } else {
        console.log("relay data account does not exist");
      }
    }
  }

  if (retryCount === MAX_RETRIES) {
    console.error(
      "Failed to create relay data account transaction after",
      MAX_RETRIES,
      "retries"
    );
    throw new Error("create relay data account failed");
  }
};

export const postMessages = async (
  provider,
  valueRouterProgram,
  relayDataKeypair,
  messages
) => {
  console.log("\n\n2. Post relay data\n");

  const bridgeMessage = {
    message: Buffer.from(messages[0].message.replace("0x", ""), "hex"),
    attestation: Buffer.from(messages[0].attestation.replace("0x", ""), "hex"),
  };

  const swapMessage = {
    message: Buffer.from(messages[1].message.replace("0x", ""), "hex"),
    attestation: Buffer.from(messages[1].attestation.replace("0x", ""), "hex"),
  };

  const accountInfo = await provider.connection.getAccountInfo(
    relayDataKeypair.publicKey
  );
  if (accountInfo) {
    console.log("relay data account exists:", accountInfo);

    // sendAndConfirm 结果失败，但交易可能已经上链
    // 检查 account data 是否已经更新
    // 对比开头一部分就够了
    const accountDataSlice = accountInfo.data.subarray(12, 212);
    const messageSlice = bridgeMessage.message.subarray(0, 200);

    if (accountDataSlice.toString("hex") === messageSlice.toString("hex")) {
      console.log("post relay data already updated");
      return;
    } else {
      // account 存在，但 data 未更新
    }
  } else {
    // account 不存在
    console.error("account does not exist");
    return;
  }

  /// 2.1 Post bridge data instruction
  const postBridgeMessageIx = await valueRouterProgram.methods
    .postBridgeMessage({
      bridgeMessage,
    })
    .accounts({
      owner: provider.wallet.publicKey,
      relayData: relayDataKeypair.publicKey,
    })
    .signers([])
    .instruction();

  /// 2.2 Post swap data instruction
  const postSwapMessageIx = await valueRouterProgram.methods
    .postSwapMessage({
      swapMessage,
    })
    .accounts({
      owner: provider.wallet.publicKey,
      relayData: relayDataKeypair.publicKey,
    })
    .signers([])
    .instruction();

  /// 2.3 Send post transaction
  const postDataInstructions = [postBridgeMessageIx, postSwapMessageIx];

  const blockhash = (await provider.connection.getLatestBlockhash()).blockhash;

  const postDataMessageV0 = new TransactionMessage({
    payerKey: provider.wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: postDataInstructions,
  }).compileToV0Message();

  const postDataTransaction = new VersionedTransaction(postDataMessageV0);

  let txID;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      txID = await provider.sendAndConfirm(postDataTransaction, null, TIMEOUT);
      // 成功
      console.log("post data transaction: ", { txID });

      // 等待 5 秒
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 查看 account 是否更新成功
      const accountInfo = await provider.connection.getAccountInfo(
        relayDataKeypair.publicKey
      );
      if (accountInfo) {
        // sendAndConfirm 结果成功
        // 检查 account data 是否已经更新
        // 对比开头一部分就够了
        const accountDataSlice = accountInfo.data.subarray(12, 212);
        const messageSlice = bridgeMessage.message.subarray(0, 200);

        if (accountDataSlice.toString("hex") === messageSlice.toString("hex")) {
          console.log("post relay data success");
          break;
        }
      }

      console.error("relay data is wrong");
      break; // 交易成功，跳出循环
    } catch (e) {
      console.log({ e: e });
      retryCount++;

      // 每次尝试不论成功或失败都要查询relayDataKeypair的pubkey对应的account是否存在
      const accountInfo = await provider.connection.getAccountInfo(
        relayDataKeypair.publicKey
      );
      if (accountInfo) {
        console.log("relay data account exists:", accountInfo);

        // sendAndConfirm 结果失败，但交易可能已经上链
        // 检查 account data 是否已经更新
        // 对比开头一部分就够了
        const accountDataSlice = accountInfo.data.subarray(12, 212);
        const messageSlice = bridgeMessage.message.subarray(0, 200);

        if (accountDataSlice.toString("hex") === messageSlice.toString("hex")) {
          console.log("post relay data already success");
          break;
        }
      } else {
        // Unreachable
        console.log("relay data account does not exist");

        break;
      }
    }
  }

  if (retryCount === MAX_RETRIES) {
    console.error(
      "Failed to post relay data transaction after",
      MAX_RETRIES,
      "retries"
    );
    throw new Error("post message failed");
  }
};

/**
 *
 * @param provider
 * @param messageTransmitterProgram
 * @param tokenMessengerMinterProgram
 * @param valueRouterProgram
 * @param cctpMessageReceiverProgram
 * @param usdcAddress
 * @param wsolAddress
 * @param remoteTokenAddressHex
 * @param sourceDomain
 * @param bridgeNonce
 * @param swapNonce
 * @param recipientOutputTokenAccount recipient 的 output token 账户，要和 swap message 指定的 recipient 匹配
 * @param recipientUsdcAccount recipient 的 usdc 账户，要和 swap message 指定的 recipient 匹配
 * @param recipientWalletAddress
 * @param outputToken
 * @param sellTokenAmount
 * @param relayDataKeypair
 */
export const relay = async (
  provider,
  messageTransmitterProgram,
  tokenMessengerMinterProgram,
  valueRouterProgram,
  cctpMessageReceiverProgram,
  usdcAddress,
  wsolAddress,
  remoteTokenAddressHex,
  sourceDomain,
  bridgeNonce,
  swapNonce,
  recipientOutputTokenAccount,
  recipientUsdcAccount,
  recipientWalletAddress,
  outputToken,
  sellTokenAmount,
  relayDataKeypair
) => {
  console.log("\n\n3. Relay\n");

  const LOOKUP_TABLE_ADDRESS = new PublicKey(
    "CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq"
  );

  // value router 专用的 lookup table 列表
  // 用于缩减交易长度
  // 包含常用的固定的账户
  const vrLookupTable = (
    await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)
  ).value;

  // Get PDAs
  const pdas = await getRelayPdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
      cctpMessageReceiverProgram,
    },
    usdcAddress,
    remoteTokenAddressHex,
    sourceDomain,
    bridgeNonce,
    swapNonce
  );

  const [cctpCaller, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("cctp_caller")],
    valueRouterProgram.programId
  );

  console.log("cctpCaller: ", cctpCaller);
  console.log("bump: ", bump);

  /// 3.2 Relay instruction
  const seed = Buffer.from("__event_authority");
  let eventAuthority = (() => {
    for (let b = 255; b > 0; b--) {
      const bump = new Uint8Array([b]);
      try {
        let eventAuthority = PublicKey.createProgramAddressSync(
          [seed, bump],
          messageTransmitterProgram.programId
        );
        return eventAuthority;
      } catch (error) {
        continue;
      }
    }
  })();

  const programUsdcAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("usdc_in")],
    valueRouterProgram.programId
  )[0];

  console.log("programUsdcAccount: ", programUsdcAccount);

  const programWsolAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("wsol_in")],
    valueRouterProgram.programId
  )[0];

  console.log("programWsolAccount: ", programWsolAccount);

  const programAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    valueRouterProgram.programId
  )[0];

  console.log("programAuthority: ", programAuthority);

  const jupiterProgramId = new PublicKey(process.env.JUPITER_ADDRESS);

  let remainingAccounts = [];
  let jupiterSwapData = new Buffer("");
  let addressLookupTableAccounts = [];

  let jupiterReceiver = recipientOutputTokenAccount;
  let jupiterOutput = outputToken;

  if (!usdcAddress.equals(outputToken)) {
    console.log("Build jupiter swap instruction");

    if (outputToken.equals(wsolHex)) {
      jupiterOutput = wsolAddress;
      //jupiterReceiver = "";
    }

    // 构建 jupiter swap 参数
    // 1. 获取 quote
    let quote = await getQuote(
      process.env.USDC_ADDRESS, // USDC Mint account (USDC 代币地址)
      jupiterOutput, // Output token Mint account (输出代币地址)
      sellTokenAmount
    );

    console.log("quote: ", quote);

    // 2. 通过 api 获取 swap instruction
    const swapIx = await getSwapIx(
      provider.wallet.publicKey,
      jupiterReceiver,
      quote
    );
    console.log(JSON.stringify(swapIx));

    let swapInstruction = instructionDataToTransactionInstruction(
      swapIx.swapInstruction
    );

    remainingAccounts = swapInstruction.keys;
    jupiterSwapData = swapInstruction.data;
    console.log(jupiterSwapData.toString("hex"));

    // 3. 获取 swap instruction 中的 lookup table 列表
    // 由 jupiter api 提供，可能有多个
    addressLookupTableAccounts = await getAdressLookupTableAccounts(
      provider.connection,
      swapIx.addressLookupTableAddresses
    );
  }

  // 把 vr lookup table 也加入 lookup table 列表
  addressLookupTableAccounts.push(vrLookupTable);

  console.log("jupiterReceiver: ", jupiterReceiver);

  // 4. relay
  let accounts = {
    payer: provider.wallet.publicKey,
    caller: cctpCaller,
    tmAuthorityPda: pdas.tmAuthorityPda,
    vrAuthorityPda: pdas.vrAuthorityPda,
    messageTransmitterProgram: messageTransmitterProgram.programId,
    messageTransmitter: pdas.messageTransmitterAccount.publicKey,
    usedNonces1: pdas.usedNonces1,
    usedNonces2: pdas.usedNonces2,
    tokenMessengerMinterProgram: tokenMessengerMinterProgram.programId,
    valueRouterProgram: valueRouterProgram.programId,
    valueRouter: pdas.valueRouter.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    messageTransmitterEventAuthority: eventAuthority,
    tokenMessengerEventAuthority: pdas.tokenMessengerEventAuthority.publicKey,
    cctpReceiverEventAuthority: pdas.cctpReceiverEventAuthority.publicKey,
    relayParams: relayDataKeypair.publicKey,
    tokenMessenger: pdas.tokenMessengerAccount.publicKey,
    remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
    tokenMinter: pdas.tokenMinterAccount.publicKey,
    localToken: pdas.localToken.publicKey,
    tokenPair: pdas.tokenPair.publicKey,
    recipientUsdcAccount: recipientUsdcAccount,
    recipientOutputTokenAccount: jupiterReceiver,
    recipientWalletAccount: recipientWalletAddress,
    custodyTokenAccount: pdas.custodyTokenAccount.publicKey,
    programUsdcAccount: programUsdcAccount,
    usdcMint: usdcAddress,
    outputMint: jupiterOutput,
    programAuthority: programAuthority,
    jupiterProgram: jupiterProgramId,
    cctpMessageReceiver: cctpMessageReceiverProgram.programId,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY,
  };
  console.log("usedNonces1: ", accounts.usedNonces1);
  console.log("usedNonces2: ", accounts.usedNonces2);

  const relayIx = await valueRouterProgram.methods
    .relay({
      jupiterSwapData: jupiterSwapData,
    })
    .accounts(accounts)
    .remainingAccounts(remainingAccounts)
    .instruction();

  const computeBudgetIx2 = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2000000,
  });

  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 150000,
  });

  const relayInstructions = [computeUnitPriceIx, computeBudgetIx2, relayIx];

  console.log("send relay tx");
  await sendTx(provider, relayInstructions, addressLookupTableAccounts);
};

/// function send transaction
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
      console.log(simulationResult.value.logs);

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
