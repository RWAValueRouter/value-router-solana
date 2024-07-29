import { PublicKey } from "@solana/web3.js";
import { getQuote, getSwapIx } from "./jupiter";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

(async () => {
  let quote = await getQuote(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6",
    321
  );

  const swapIx = await getSwapIx(
    new PublicKey("BzLs66xS5fz5t97sbfgvLkmSnKYacuZTZNjhEvZH35P5"),
    new PublicKey("RdxGWo5AfTuG8TyCHNDpj6VSNhEM4KQJj4xSdj8DKNN"),
    quote
  );
  console.log(JSON.stringify(swapIx));
  console.log("setupInstructions: ", JSON.stringify(swapIx.setupInstructions));
  console.log("swapInstruction: ", swapIx.swapInstruction);

  const [userUsdcAccount] = await PublicKey.findProgramAddressSync(
    [
      new PublicKey("BzLs66xS5fz5t97sbfgvLkmSnKYacuZTZNjhEvZH35P5").toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log("userUsdcAccount: ", userUsdcAccount);
})();
