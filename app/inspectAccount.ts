import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Function to get account information
async function getAccountInfo(publicKeyString: string) {
  const SOLANA_RPC_URL =
    "https://mainnet.helius-rpc.com/?api-key=7391bccc-4df8-409b-aeea-838e927e6123";
  // Connect to the Solana cluster
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  // Convert the public key string to a PublicKey object
  const publicKey = new PublicKey(publicKeyString);

  // Fetch account information
  const accountInfo = await connection.getAccountInfo(publicKey);

  if (accountInfo === null) {
    console.log("Account not found");
    return;
  }

  // Display account information
  console.log("Account Info:", {
    executable: accountInfo.executable,
    owner: accountInfo.owner.toBase58(),
    lamports: accountInfo.lamports,
    dataLength: accountInfo.data.length,
  });

  // Fetch raw account data
  const accountData = accountInfo.data;

  // Display account data as a hex string (or process it as needed)
  console.log("Account Data (Hex):", accountData.toString("hex"));
}

// Replace with the public key of the account you want to query
//const publicKeyString = "CVo3cWWdQF8Lfc7ECV2fChFgPcza1nHvRzjiHMYY7UkU";
//const publicKeyString = "AdufTJ7BbuWRx5679UdY4YmYNApdLV1MDqJJ91tLE8m2";
const publicKeyString = "9nnXjZ2wsPdDsf9P4ehvftYMk2s5RHubhitssCARCWh7";
//const publicKeyString = "2Tv4PGKfd2utRuCbHeNJ6WjzwrMvZUwcm3xrE2hJqJnx";

// Call the function
getAccountInfo(publicKeyString).catch((err) => {
  console.error(err);
});
