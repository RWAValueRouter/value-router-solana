import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { hexlify } from "ethers";

const solanaAddressToHex = (solanaAddress) =>
  hexlify(bs58.decode(solanaAddress));
const solanaAddressToArray = (solanaAddress) => bs58.decode(solanaAddress);

let solanaAddress = "CRZ4sCHF4eP4fyjdPCbu15kXNmLbENvNJnb41Ga9ZJCP"; // devnet usdc ata

console.log(solanaAddressToHex(solanaAddress));
console.log(solanaAddressToArray(solanaAddress));
