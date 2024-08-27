import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { hexlify } from "ethers";

import { PublicKey } from "@solana/web3.js";

import { getPrograms, getAnchorConnection } from "./utils";

import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export const solanaAddressToHex = (solanaAddress) =>
  hexlify(bs58.decode(solanaAddress));

export const solanaAddressToArray = (solanaAddress) =>
  bs58.decode(solanaAddress);

(async () => {
  const provider = getAnchorConnection();

  const { valueRouterProgram, cctpMessageReceiverProgram } =
    getPrograms(provider);

  let addresses = {
    tokenMessengerMinter: "CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3",
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    billy: "3B5wuUrMEi5yATD7on46hKfej3pfmd7t1RKgrsN3pump",
    mobile: "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6",
    paypal: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo", // 2022
    jup: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    wsol: "So11111111111111111111111111111111111111112",
    relayerWallet: "HfdkJ3LwKtUU56RJMjkXepGww4ZvhQ1bcKJG47w2UZUS",
    relayerWsol: "",
    wallet: "By3mwon52HE68c9mAAwqxXEE9Wo1DnhzMzME8vMmecBt",
    wallet2: "GcYJDjmMF5VaZmYk347Nrz8fJzT81suWfqGDguQtPB3U",
    wallet4: "D5wyc7W4wfnV8WQehDxsuZ6J8Zbt3aSUpKoGpZE2ngpa",
    wallet5: "ELHzkAeAoAxrmRxcoEfYPr6AydVVaAnYuRLVovdoye4e",
    wallet6: "RdxGWo5AfTuG8TyCHNDpj6VSNhEM4KQJj4xSdj8DKNN",
    wallet7: "2BZvFhhqTVwkHL3wbAYJs2piLgMbUpmCBrmBGCVmHyVx",
    wallet7Usdt: "",
    wallet6Usdc: "",
    wallet6Paypal: "",
    walletUsdc: "9h2CxvWshcJaNAJ9BqrzL5Y849wQXkZdMF6nQMf6c4cY",
    valueRouter: valueRouterProgram.programId.toBase58(),
    caller: "",
    programUsdcAccount: "",
    programUsdcInAccount: "",
    programAuthority: "",
    receiver: cctpMessageReceiverProgram.programId.toBase58(),
  };

  const wallet6Paypal = await getAssociatedTokenAddress(
    new PublicKey(addresses.paypal), // The mint address of the token
    new PublicKey(addresses.wallet6), // The owner's wallet address
    true, // AllowOwnerOffCurve: If the owner's address is off the curve
    TOKEN_2022_PROGRAM_ID, // Token program id
    ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program id
  );
  addresses.wallet6Paypal = wallet6Paypal.toString();

  const wallet6Usdc = await getAssociatedTokenAddress(
    new PublicKey(addresses.usdc), // The mint address of the token
    new PublicKey(addresses.wallet6), // The owner's wallet address
    true, // AllowOwnerOffCurve: If the owner's address is off the curve
    TOKEN_PROGRAM_ID, // Token program id
    ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program id
  );
  addresses.wallet6Usdc = wallet6Usdc.toString();

  const wallet7Usdt = await getAssociatedTokenAddress(
    new PublicKey(addresses.usdt), // The mint address of the token
    new PublicKey(addresses.wallet7), // The owner's wallet address
    true, // AllowOwnerOffCurve: If the owner's address is off the curve
    TOKEN_PROGRAM_ID, // Token program id
    ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program id
  );
  addresses.wallet7Usdt = wallet7Usdt.toString();

  const relayerWsol = await getAssociatedTokenAddress(
    new PublicKey(addresses.wsol), // The mint address of the token
    new PublicKey(addresses.relayerWallet), // The owner's wallet address
    true, // AllowOwnerOffCurve: If the owner's address is off the curve
    TOKEN_PROGRAM_ID, // Token program id
    ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program id
  );
  addresses.relayerWsol = relayerWsol.toString();

  addresses.programAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    valueRouterProgram.programId
  )[0].toBase58();

  addresses.caller = PublicKey.findProgramAddressSync(
    [Buffer.from("cctp_caller")],
    new PublicKey(addresses.valueRouter)
  )[0].toBase58();

  addresses.programUsdcInAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("usdc_in")],
    new PublicKey(addresses.valueRouter)
  )[0].toBase58();

  addresses.programUsdcAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("usdc")],
    new PublicKey(addresses.valueRouter)
  )[0].toBase58();

  console.log("bs58 addresses: \n", addresses);

  let hexAddresses = Object.keys(addresses).reduce((_acc, key) => {
    _acc[key] = solanaAddressToHex((addresses as any)[key]);
    return _acc;
  }, {} as any);

  console.log("hex addresses: \n", hexAddresses);
})();
