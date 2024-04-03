import "dotenv/config";
import {
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import {
  SOLANA_USDC_ADDRESS,
  decodeEventNonceFromMessage,
  getAnchorConnection,
  getPrograms,
  getRelayPdas,
} from "./utils";

const main = async () => {
  const provider = getAnchorConnection();
  provider.opts.expire = 4294967295;
  console.log("provider.opts:", provider.opts);
  console.log(provider.wallet.payer._keypair.publicKey.toString("hex"));

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
  //const messageHex2 = process.env.MESSAGE_HEX_SWAP!;
  //const attestationHex2 = process.env.ATTESTATION_HEX_SWAP!;
  const messageHex2 = "0x000000000000000000000005000000000003ef66";
  const attestationHex2 = "";
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

  // 1. Create RelayData account
  const swapAndBridgeTx = await valueRouterProgram.methods
    .swapAndBridge({
      buyArgs: {
        buyToken: buyToken,
        guaranteedBuyAmount: guaranteedBuyAmount,
      },
      sellUsdcAmount: sellUSDCAmount,
      destDomain: 0,
      recipient: mintRecipient,
    })
    // eventAuthority and program accounts are implicitly added by Anchor
    .accounts(accounts)
    // messageSentEventAccountKeypair must be a signer so the MessageTransmitter program can take control of it and write to it.
    // provider.wallet is also an implicit signer
    .signers([messageSentEventAccountKeypair1, messageSentEventAccountKeypair2])
    .rpc();

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

  // accountMetas list to pass to remainingAccounts
  const accountMetas: any[] = [];
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: userTokenAccount,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: spl.TOKEN_PROGRAM_ID,
  });

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

  const receiveMessageTx = await valueRouterProgram.methods
    .relay()
    .accounts({
      payer: provider.wallet.publicKey,
      caller: provider.wallet.publicKey,
      valueRouterProgram: valueRouterProgram.programId,
      authorityPda: pdas.authorityPda,
      messageTransmitterProgram: messageTransmitterProgram.programId,
      messageTransmitter: pdas.messageTransmitterAccount.publicKey,
      usedNonces: pdas.usedNonces1,
      receiver: valueRouterProgram.programId,
      systemProgram: SystemProgram.programId,
      messageTransmitterEventAuthority: eventAuthority,
    })
    .remainingAccounts(accountMetas)
    .transaction();

  provider.sendAndConfirm(
    receiveMessageTx.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 800000,
      })
    )
  );

  console.log("\n\nreceiveMessage Tx: ", receiveMessageTx);
};

main();
