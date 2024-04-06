import {PublicKey} from "@solana/web3.js";

const OWNER = new PublicKey('A8yusEmKLQHmGw8fyfDByHpLSnEFi2kJ3FXqPbMJbcGL'); // e.g., E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk
const MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');    // e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const [address] = PublicKey.findProgramAddressSync(
    [OWNER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
);

console.log('ATA: ', address.toBase58());
