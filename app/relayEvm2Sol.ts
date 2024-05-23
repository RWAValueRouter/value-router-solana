import "dotenv/config";
import Web3 from "web3";
import { findEvmMessage } from "./findEvmMessage";
import { PublicKey } from "@solana/web3.js";
import { solReceiveMessage } from "./receiveMessage";
import {
  SOLANA_USDC_ADDRESS,
  decodeEventNonceFromMessage,
  hexToBytes,
} from "./utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

var web3 = new Web3(process.env.EVM_PROVIDER_URL!);

const irisUrl = "https://iris-api-sandbox.circle.com/attestations";

const txid =
  "0x4fbf68917e98f6cbdeadd68001809d50e57dd9f48cf1f04cf85c9e0ac50b4218";

const relayEvm2Sol = async () => {
  const message = await findEvmMessage(web3, irisUrl, txid);
  console.log("message: ", message);

  const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);

  const remoteTokenAddressHex = process.env.REMOTE_TOKEN_HEX!;
  const remoteDomain = process.env.REMOTE_DOMAIN!;
  const messageHex = message[0].message;
  const attestationHex = message[0].attestation;
  const nonce = decodeEventNonceFromMessage(messageHex);

  const userTokenAccountHex = messageHex.substring(306, 370);
  const userTokenAccount = new PublicKey(
    bs58.encode(hexToBytes(userTokenAccountHex))
  );

  console.log({
    usdcAddress,
    userTokenAccount,
    remoteTokenAddressHex,
    remoteDomain,
    messageHex,
    attestationHex,
    nonce,
  });

  return;

  await solReceiveMessage(
    usdcAddress,
    userTokenAccount,
    remoteTokenAddressHex,
    remoteDomain,
    messageHex,
    attestationHex,
    nonce
  );
};

relayEvm2Sol();
