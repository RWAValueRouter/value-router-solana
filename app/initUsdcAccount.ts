import {
    PublicKey,
    Transaction,
} from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import { getAnchorConnection } from "./utils";

const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export async function initUsdcAccount() {
    const provider = getAnchorConnection();
    provider.opts.expire = 4294967295;

    const associatedToken = spl.getAssociatedTokenAddressSync(
        usdcMint,
        //provider.wallet.publicKey,
        new PublicKey("HfdkJ3LwKtUU56RJMjkXepGww4ZvhQ1bcKJG47w2UZUS"),
        false,
        spl.TOKEN_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction().add(
        spl.createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            associatedToken,
            //provider.wallet.publicKey,
            new PublicKey("HfdkJ3LwKtUU56RJMjkXepGww4ZvhQ1bcKJG47w2UZUS"),
            usdcMint,
            spl.TOKEN_PROGRAM_ID,
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        )
    );

    const txID = await provider.sendAndConfirm(transaction);

    console.log("txID: ", txID);
}

initUsdcAccount();
