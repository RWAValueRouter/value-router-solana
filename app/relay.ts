import "dotenv/config";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import {
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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

  const relayDataKeypair = Keypair.generate();
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

  console.log(pdas);

  // 1. Create RelayData account
  const createRelayDataTx = await valueRouterProgram.methods
    .createRelayData()
    // eventAuthority and program accounts are implicitly added by Anchor
    .accounts({
      relayData: relayDataKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([relayDataKeypair])
    // messageSentEventAccountKeypair must be a signer so the MessageTransmitter program can take control of it and write to it.
    // provider.wallet is also an implicit signer
    .rpc();

  console.log("createRelayDataTx: ", createRelayDataTx);

  // 2. Post bridge data
  const postBridgeMessageTx = await valueRouterProgram.methods
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
    .rpc();

  console.log("postBridgeMessageTx: ", postBridgeMessageTx);

  // 3. Post swap data
  const postSwapMessageTx = await valueRouterProgram.methods
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
    .rpc();

  console.log("postSwapMessageTx: ", postSwapMessageTx);

  // accountMetas list to pass to remainingAccounts
  const accountMetas: any[] = [];
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

  console.log(
    "messageTransmitterProgram.programId: ",
    messageTransmitterProgram.programId
  );

  const relayTx = await valueRouterProgram.methods
    .relay()
    .accounts({
      payer: provider.wallet.publicKey,
      caller: provider.wallet.publicKey,
      valueRouterProgram: valueRouterProgram.programId,
      authorityPda: pdas.authorityPda,
      messageTransmitterProgram: messageTransmitterProgram.programId,
      messageTransmitter: pdas.messageTransmitterAccount.publicKey,
      usedNonces: pdas.usedNonces1,
      systemProgram: SystemProgram.programId,
      messageTransmitterEventAuthority: eventAuthority,
      relayParams: relayDataKeypair.publicKey,
      /*relayParams: new PublicKey(
        "Ee7jv9pPPWWzKRnqf5Kw1d1Lp7vtApTGmcbTu4WnDYVP"
      ),*/
      tokenMessengerMinterProgram: tokenMessengerMinterProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      usdcVault: userTokenAccount,
      tokenMessenger: pdas.tokenMessengerAccount.publicKey,
      remoteTokenMessenger: pdas.remoteTokenMessengerKey.publicKey,
      tokenMinter: pdas.tokenMinterAccount.publicKey,
      localToken: pdas.localToken.publicKey,
      tokenPair: pdas.tokenPair.publicKey,
      recipientTokenAccount: userTokenAccount,
      custodyTokenAccount: pdas.custodyTokenAccount.publicKey,
      payerInputAta: userTokenAccount,
      tokenMessengerEventAuthority: pdas.tokenMessengerEventAuthority.publicKey,
    })
    .remainingAccounts(accountMetas)
    .transaction();

  provider.sendAndConfirm(
    relayTx.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 800000,
      })
    )
  );

  console.log("\n\nrelay Tx: ", relayTx);
};

main();
