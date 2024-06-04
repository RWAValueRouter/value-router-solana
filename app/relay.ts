import "dotenv/config";
import {
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  SOLANA_USDC_ADDRESS,
  decodeEventNonceFromMessage,
  getAnchorConnection,
  getPrograms,
  getRelayPdas,
} from "./utils";

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
 * 3. 构建 relay 交易，包含两个指令
 *  3.1 准备 address lookup table
 *  3.2 构建 relay instruction
 *  3.3 构建 compute budget instruction
 *  3.4 发送 relay 交易
 */
const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;

  const {
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
  } = getPrograms(provider);

  // Init needed variables
  const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);
  const userTokenAccount = new PublicKey(process.env.USER_TOKEN_ACCOUNT);
  const remoteTokenAddressHex = process.env.REMOTE_TOKEN_HEX!;
  const remoteDomain = process.env.REMOTE_DOMAIN!;
  const messageHex1 = process.env.MESSAGE_HEX_BRIDGE!;
  const attestationHex1 = process.env.ATTESTATION_HEX_BRIDGE!;
  const messageHex2 = process.env.MESSAGE_HEX_SWAP!;
  const attestationHex2 = process.env.ATTESTATION_HEX_SWAP!;

  console.log({
    usdc: usdcAddress,
    userTokenAccount: userTokenAccount,
    remoteTokenAddressHex: remoteTokenAddressHex,
    remoteDomain: remoteDomain,
    messageHex1: messageHex1,
    attestationHex1: attestationHex1,
    messageHex2: messageHex2,
    attestationHex2: attestationHex2,
  });

  // 创建 relay data account 密钥对，可重复使用，可回收
  //const relayDataKeypair = Keypair.generate();
  //console.log("relayData: ", relayDataKeypair);

  // 导入已有的 relay data account 私钥
  const relayDataKeypair = Keypair.fromSecretKey(
    new Uint8Array([
      41, 82, 92, 121, 142, 30, 194, 221, 232, 108, 134, 157, 83, 147, 197, 65,
      106, 102, 174, 252, 204, 167, 197, 108, 145, 81, 29, 141, 78, 155, 118,
      196, 254, 231, 122, 152, 73, 143, 185, 28, 122, 96, 73, 148, 147, 116, 35,
      97, 175, 34, 167, 210, 87, 169, 250, 62, 95, 8, 150, 186, 189, 211, 237,
      37,
    ])
  );
  console.log("relayData publicKey: ", relayDataKeypair.publicKey);

  /// 1. Create RelayData account transaction
  /*await createDataAccount(
    provider,
    valueRouterProgram,
    relayDataKeypair
  );*/

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

  /// 3. Relay transaction
  await relay(
    provider,
    messageTransmitterProgram,
    tokenMessengerMinterProgram,
    valueRouterProgram,
    usdcAddress,
    remoteTokenAddressHex,
    remoteDomain,
    [messageHex1, messageHex2],
    userTokenAccount,
    relayDataKeypair
  );
};

const MAX_RETRIES = 5; // 最大重试次数
const TIMEOUT = 120000; // 等待时间（毫秒）

export const createDataAccount = async (
  provider,
  valueRouterProgram,
  relayDataKeypair
) => {
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
  const accountInfo = await provider.connection.getAccountInfo(
    relayDataKeypair.publicKey
  );
  if (accountInfo) {
  } else {
    console.error("relay data account does not exist");
    throw new Error("post message failed");
  }

  /// 2.1 Post bridge data instruction
  const bridgeMessage = {
    message: Buffer.from(messages[0].message.replace("0x", ""), "hex"),
    attestation: Buffer.from(messages[0].attestation.replace("0x", ""), "hex"),
  };
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
  const swapMessage = {
    message: Buffer.from(messages[1].message.replace("0x", ""), "hex"),
    attestation: Buffer.from(messages[1].attestation.replace("0x", ""), "hex"),
  };
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
      console.log("post data transaction: ", { txID });

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

export const relay = async (
  provider,
  messageTransmitterProgram,
  tokenMessengerMinterProgram,
  valueRouterProgram,
  usdcAddress,
  remoteTokenAddressHex,
  remoteDomain,
  messages,
  recipientTokenAccount,
  relayDataKeypair
) => {
  const LOOKUP_TABLE_ADDRESS = new PublicKey(
    "CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq"
  );

  const lookupTable = (
    await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)
  ).value;

  const addressLookupTableAccounts = [lookupTable];

  const nonce1 = decodeEventNonceFromMessage(messages[0]);
  const nonce2 = decodeEventNonceFromMessage(messages[1]);

  // Get PDAs
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

  console.log("pdas: ", pdas);

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
    [Buffer.from("usdc")],
    valueRouterProgram.programId
  )[0];
  console.log("programUsdcAccount: ", programUsdcAccount);

  const programAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    valueRouterProgram.programId
  )[0];
  console.log("programAuthority: ", programAuthority);

  const jupiterProgramId = new PublicKey(process.env.JUPITER_ADDRESS);

  const relayIx = await valueRouterProgram.methods
    .relay({
      jupiterSwapData: new Buffer(""),
    })
    .accounts({
      payer: provider.wallet.publicKey,
      caller: cctpCaller,
      tmAuthorityPda: pdas.tmAuthorityPda,
      vrAuthorityPda: pdas.vrAuthorityPda,
      messageTransmitterProgram: messageTransmitterProgram.programId,
      messageTransmitter: pdas.messageTransmitterAccount.publicKey,
      usedNonces: pdas.usedNonces1,
      tokenMessengerMinterProgram: tokenMessengerMinterProgram.programId,
      valueRouterProgram: valueRouterProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      messageTransmitterEventAuthority: eventAuthority,
      tokenMessengerEventAuthority: pdas.tokenMessengerEventAuthority.publicKey,
      relayParams: relayDataKeypair.publicKey,
      tokenMessenger: pdas.tokenMessengerAccount.publicKey,
      remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
      tokenMinter: pdas.tokenMinterAccount.publicKey,
      localToken: pdas.localToken.publicKey,
      tokenPair: pdas.tokenPair.publicKey,
      recipientTokenAccount: recipientTokenAccount,
      custodyTokenAccount: pdas.custodyTokenAccount.publicKey,
      programUsdcAccount: programUsdcAccount,
      usdcMint: usdcAddress,
      programAuthority: programAuthority,
      jupiterProgram: jupiterProgramId,
    })
    .instruction();

  /// 3.3 Computte budget instruction
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1800000,
  });

  const relayInstructions = [computeBudgetIx, relayIx];

  /// 3.4 Send relay transaction
  const blockhash2 = (await provider.connection.getLatestBlockhash()).blockhash;

  const relayMessageV0 = new TransactionMessage({
    payerKey: provider.wallet.publicKey,
    recentBlockhash: blockhash2,
    instructions: relayInstructions,
  }).compileToV0Message(addressLookupTableAccounts);

  const relayTransaction = new VersionedTransaction(relayMessageV0);

  try {
    const txID = await provider.sendAndConfirm(relayTransaction, null, TIMEOUT);
    console.log("relay transaction: ", { txID });
  } catch (e) {
    console.log({ e: e });
  }

  let txID = null;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    attempts++;

    try {
      txID = await provider.sendAndConfirm(relayTransaction, null, TIMEOUT);
      console.log(
        `Relay transaction: ${attempts}/${MAX_RETRIES} - Success, TX ID: ${txID}`
      );
      break; // Exit the loop if successful
    } catch (error) {
      console.error(
        `Relay transaction: ${attempts}/${MAX_RETRIES} - Failed: ${error.message}`
      );

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
    }
  }

  if (!txID) {
    console.error(`Failed to relay transaction after ${MAX_RETRIES} attempts.`);
    throw new Error("relay failed");
  }
};

main();
