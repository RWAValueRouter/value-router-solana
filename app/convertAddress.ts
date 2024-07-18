import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { hexlify } from "ethers";

import { PublicKey } from "@solana/web3.js";

import { getPrograms, getAnchorConnection } from "./utils";

export const solanaAddressToHex = (solanaAddress) =>
  hexlify(bs58.decode(solanaAddress));

export const solanaAddressToArray = (solanaAddress) =>
  bs58.decode(solanaAddress);

const provider = getAnchorConnection();

const { valueRouterProgram, cctpMessageReceiverProgram } =
  getPrograms(provider);

let addresses = {
  tokenMessengerMinter: "CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3",
  usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  billy: "3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump",
  mobile: "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6",
  wsol: "So11111111111111111111111111111111111111112",
  wallet: "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt",
  wallet2: "GcYJDjmMF5VaZmYk347Nrz8fJzT81suWfqGDguQtPB3U",
  wallet3: "D5wyc7W4wfnV8WQehDxsuZ6J8Zbt3aSUpKoGpZE2ngpa",
  wallet4: "ELHzkAeAoAxrmRxcoEfYPr6AydVVaAnYuRLVovdoye4e",
  walletUsdc: "9h2CxvWshcJaNAJ9BqrzL5Y849wQXkZdMF6nQMf6c4cY",
  valueRouter: valueRouterProgram.programId.toBase58(),
  caller: "",
  programUsdcAccount: "",
  programAuthority: "",
  receiver: cctpMessageReceiverProgram.programId.toBase58(),
};

addresses.programAuthority = PublicKey.findProgramAddressSync(
  [Buffer.from("authority")],
  valueRouterProgram.programId
)[0].toBase58();

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
