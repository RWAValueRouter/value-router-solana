import "dotenv/config";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
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
  //const messageHex2 = "0x000000000000000000000005000000000003ef66";
  //const attestationHex2 = "";
  const nonce1 = decodeEventNonceFromMessage(messageHex1);
  const nonce2 = decodeEventNonceFromMessage(messageHex2);

  console.log({
    usdc: usdcAddress,
    userTokenAccount: userTokenAccount,
    remoteTokenAddressHex: remoteTokenAddressHex,
    remoteDomain: remoteDomain,
    messageHex1: messageHex1,
    attestationHex1: attestationHex1,
    nonce1: nonce1,
    messageHex2: messageHex2,
    attestationHex2: attestationHex2,
    nonce2: nonce2,
  });

  /*
    {
      bridgeMessage: {
        message: Buffer.from(messageHex1.replace("0x", ""), "hex"),
        attestation: Buffer.from(attestationHex1.replace("0x", ""), "hex"),
      },
      swapMessage: {
        message: Buffer.from(messageHex2.replace("0x", ""), "hex"),
        attestation: Buffer.from(attestationHex2.replace("0x", ""), "hex"),
      },
    }
   */

  // 创建 relay data account 密钥对，可重复使用，可回收
  //const relayDataKeypair = Keypair.generate();
  //console.log("relayData: ", relayDataKeypair);
  // 导入已有的 relay data account 私钥
  const relayDataKeypair = Keypair.fromSecretKey(
    new Uint8Array([
      149, 90, 244, 153, 109, 225, 177, 191, 116, 209, 82, 55, 251, 190, 192,
      199, 107, 25, 11, 150, 20, 197, 104, 225, 159, 142, 94, 89, 30, 207, 174,
      43, 204, 40, 193, 124, 174, 126, 164, 237, 12, 117, 15, 101, 189, 198,
      239, 91, 254, 124, 168, 137, 120, 235, 248, 223, 209, 17, 253, 208, 236,
      134, 6, 106,
    ])
  );
  console.log("relayData publicKey: ", relayDataKeypair.publicKey);

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

  /// 1. Create RelayData account transaction
  /*
  const createRelayDataTx = await valueRouterProgram.methods
    .createRelayData()
    .accounts({
      relayData: relayDataKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([relayDataKeypair])
    .rpc();

  console.log("createRelayDataTx: ", createRelayDataTx);
  */

  /// 2. Post relay data transaction
  /// 2.1 Post bridge data instruction
  /*
  const postBridgeMessageIx = await valueRouterProgram.methods
    .postBridgeMessage({
      bridgeMessage: {
        message: Buffer.from(messageHex1.replace("0x", ""), "hex"),
        attestation: Buffer.from(attestationHex1.replace("0x", ""), "hex"),
      },
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
      swapMessage: {
        message: Buffer.from(messageHex2.replace("0x", ""), "hex"),
        attestation: Buffer.from(attestationHex2.replace("0x", ""), "hex"),
      },
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

  try {
    const txID = await provider.sendAndConfirm(postDataTransaction);
    console.log("post data transaction: ", { txID });
  } catch (e) {
    console.log({ e: e });
  }
  */

  /// 3. Relay transaction
  /// 3.1. Prepare address lookup table
  const LOOKUP_TABLE_ADDRESS = new PublicKey(
    "CoYBpCUivvpfmVZvcXxsVQ75KuVMLKC3XKw3AC6ECjSq"
  );

  const lookupTable = (
    await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)
  ).value;

  const addressLookupTableAccounts = [lookupTable];

  /// 3.2 Relay instruction
  /*const accountMetas: any[] = [];
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.tokenMessengerAccount.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.remoteTokenMessengerKey.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: pdas.tokenMinterAccount.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: pdas.localToken.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.tokenPair.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: userTokenAccount,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: pdas.custodyTokenAccount.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: TOKEN_PROGRAM_ID,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.tokenMessengerEventAuthority.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: tokenMessengerMinterProgram.programId,
  });*/

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
      messageTransmitterEventAuthority: eventAuthority,
      systemProgram: SystemProgram.programId,
      tokenMessengerEventAuthority: pdas.tokenMessengerEventAuthority.publicKey,
      relayParams: relayDataKeypair.publicKey,
      tokenMessenger: pdas.tokenMessengerAccount.publicKey,
      remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
      tokenMinter: pdas.tokenMinterAccount.publicKey,
      localToken: pdas.localToken.publicKey,
      tokenPair: pdas.tokenPair.publicKey,
      recipientTokenAccount: userTokenAccount,
      custodyTokenAccount: pdas.custodyTokenAccount.publicKey,
      programUsdcAccount: programUsdcAccount,
      usdcMint: usdcAddress,
      programAuthority: programAuthority,
      jupiterProgram: jupiterProgramId,
    })
    //.remainingAccounts(accountMetas)
    .instruction();

  /// 3.3 Computte budget instruction
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1200000,
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
    /*await provider.simulate(relayTransaction);*/

    const txID = await provider.sendAndConfirm(relayTransaction);
    console.log("relay transaction: ", { txID });
  } catch (e) {
    console.log({ e: e });
  }
};

main();
