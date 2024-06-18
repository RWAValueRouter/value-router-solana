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
const userTokenAccount = new PublicKey(process.env.USER_USDC_ACCOUNT);
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

const sellTokenAmount = Number(process.env.SELL_AMOUNT ?? 1);
const bridgeUsdcAmount = new anchor.BN(process.env.BUY_AMOUNT ?? 1);
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

const provider = getAnchorConnection();
provider.opts.expire = 4294967295;

const {
  messageTransmitterProgram,
  tokenMessengerMinterProgram,
  valueRouterProgram,
} = getPrograms(provider);

const main = async () => {
  // bridge usdc
  let txID = await sendBridgeTx();
  //let txID = "5fzhPwGvw4HnFpmxfY4TZuZk29DUDwyEhg4jvDAPPCoY7nPKzfd19G5fxfkmPVBVMQMW6VpT3fQkF6USLR2mgDiM";
  if (txID) {
    let { bridgeMessage, swapMessage } = await getCCTPAttestations(txID);
    /*reclaim(
        bridgeMessage,
        swapMessage,
        messageSentEventAccountKeypair1.publicKey,
        messageSentEventAccountKeypair2.publicKey
      );*/
  }
};

const sendBridgeTx = async () => {
  const programUsdcAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("usdc")],
    valueRouterProgram.programId
  )[0];
  console.log("programUsdcAccount: ", programUsdcAccount);

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

  console.log("programAuthority: ", accounts.programAuthority);

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

  /// 4.2 ValueRouter ALT
  const lookupTable2 = (
    await provider.connection.getAddressLookupTable(LOOKUP_TABLE_2_ADDRESS)
  ).value;

  const addressLookupTableAccounts = await getAdressLookupTableAccounts(
    provider.connection,
    []
  );

  addressLookupTableAccounts.push(lookupTable2);

  console.log("addressLookupTableAccounts: ", addressLookupTableAccounts);

  /// 5. Call swapAndBridge
  const swapAndBridgeInstruction = await valueRouterProgram.methods
    .swapAndBridge({
      jupiterSwapData: new Buffer(""),
      buyArgs: {
        buyToken: buyToken,
        guaranteedBuyAmount: guaranteedBuyAmount,
      },
      bridgeUsdcAmount: bridgeUsdcAmount,
      destDomain: destinationDomain,
      recipient: mintRecipient,
    })
    // eventAuthority and program accounts are implicitly added by Anchor
    .accounts(accounts)
    //.remainingAccounts(dedupKeys)
    // messageSentEventAccountKeypair must be a signer so the MessageTransmitter program can take control of it and write to it.
    // provider.wallet is also an implicit signer
    //.signers([messageSentEventAccountKeypair1, messageSentEventAccountKeypair2])
    //.rpc();
    .instruction();

  const instructions = [swapAndBridgeInstruction];

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
const getCCTPAttestations = async (swapAndBridgeTx): Promise<any> => {
  // Fetch message and attestation
  console.log("valueRouterProgram txHash:", swapAndBridgeTx);
  return await (async () => {
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
};

const reclaim = async (
  bridgeMessage,
  swapMessage,
  messageSentEventPubkey1,
  messageSentEventPubkey2
) => {
  const pdas = getSwapAndBridgePdas(
    {
      messageTransmitterProgram,
      tokenMessengerMinterProgram,
      valueRouterProgram,
    },
    usdcAddress,
    destinationDomain
  );

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
      messageSentEventData: messageSentEventPubkey1,
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
      messageSentEventData: messageSentEventPubkey2,
    })
    .rpc();
  console.log("\n\nreclaimEventAccount txHash: ", reclaimEventAccountTx2);
  console.log(
    "Event account 2 has been reclaimed and SOL paid for rent returned to payee."
  );
};

main();
