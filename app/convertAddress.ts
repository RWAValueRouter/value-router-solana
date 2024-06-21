import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { hexlify } from "ethers";

import { PublicKey } from "@solana/web3.js";

export const solanaAddressToHex = (solanaAddress) =>
  hexlify(bs58.decode(solanaAddress));

export const solanaAddressToArray = (solanaAddress) =>
  bs58.decode(solanaAddress);

let addresses = {
  tokenMessengerMinter: "CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3",
  usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  wsol: "So11111111111111111111111111111111111111112",
  wallet: "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt",
  walletUsdc: "9h2CxvWshcJaNAJ9BqrzL5Y849wQXkZdMF6nQMf6c4cY",
  valueRouter: "A22nXmDP7rtFdgsmnUTeu1csftJ6kxrpwpeioZkwnTgY",
  caller: "",
  programUsdcAccount: "",
  receiver: "5XoeLoER5SFFcGeFsvEa4a4QyEZXgCEWTFhESS43ExLX",
};

addresses.caller = PublicKey.findProgramAddressSync(
  [Buffer.from("cctp_caller")],
  new PublicKey(addresses.valueRouter)
)[0].toBase58();

addresses.programUsdcAccount = PublicKey.findProgramAddressSync(
  [Buffer.from("usdc_in")],
  new PublicKey(addresses.valueRouter)
)[0].toBase58();

console.log("bs58 addresses: \n", addresses);

let hexAddresses = Object.keys(addresses).reduce((_acc, key) => {
  _acc[key] = solanaAddressToHex((addresses as any)[key]);
  return _acc;
}, {} as any);

console.log("hex addresses: \n", hexAddresses);
