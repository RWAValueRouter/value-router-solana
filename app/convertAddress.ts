import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { hexlify } from "ethers";

const solanaAddressToHex = (solanaAddress) =>
  hexlify(bs58.decode(solanaAddress));
const solanaAddressToArray = (solanaAddress) => bs58.decode(solanaAddress);

let solanaAddress = "97jJVm6gLtNFa6r2ocKrp8WbF7SzKvtHjWPMFhvVEo1p"; // devnet usdc ata

console.log(solanaAddressToHex(solanaAddress));
console.log(solanaAddressToArray(solanaAddress));
