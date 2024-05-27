import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { hexlify } from "ethers";

const solanaAddressToHex = (solanaAddress) =>
  hexlify(bs58.decode(solanaAddress));
const solanaAddressToArray = (solanaAddress) => bs58.decode(solanaAddress);

//let solanaAddress = "97jJVm6gLtNFa6r2ocKrp8WbF7SzKvtHjWPMFhvVEo1p"; // devnet value_router
//let solanaAddress = "CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3"; // mainnet token_messenger_minter
//let solanaAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // mainnet usdc 0xc6fa7af3bedbad3a3d65f36aabc97431b1bbe4c2d2f6e0e47ca60203452f5d61
//let solanaAddress = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // mainnet usdt 0xce010e60afedb22717bd63192f54145a3f965a33bb82d2c7029eb2ce1e208264
//let solanaAddress = "So11111111111111111111111111111111111111112"; // mainnet wsol 0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001
//let solanaAddress = "4VKGGei57gmMPxaQZfEX4rBgBN13X4wJeNj2RWkPAk22"; // mainnet value_router 0x33d3f949c1d8d5395e40cc0a86517e771269bbebce247aa75e284e863347a42f
//let solanaAddress = "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt"; // wallet address
let solanaAddress = "9h2CxvWshcJaNAJ9BqrzL5Y849wQXkZdMF6nQMf6c4cY"; // wallet usdc address 0x811e177ad2947ca149782ab052cca914658855d8b9a060046e3856f239cbcf81

console.log(solanaAddressToHex(solanaAddress));
console.log(solanaAddressToArray(solanaAddress));
