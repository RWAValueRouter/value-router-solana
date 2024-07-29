import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js";

// Replace with your Solana RPC endpoint
const SOLANA_RPC_URL =
  "https://blue-omniscient-friday.solana-mainnet.quiknode.pro/59ccc9be093f05d398a9256ef883d0b9ad4857e2";

// Function to fetch transaction details
async function fetchTransaction(txid: TransactionSignature) {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  try {
    const transaction = await connection.getTransaction(txid, {
      maxSupportedTransactionVersion: 1,
    });

    if (!transaction) {
      console.log("Transaction not found");
      return;
    }

    console.log("Transaction details:", transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
  }
}

// Replace with the transaction ID you want to query
//const TXID =
//  "zHhVRzT5CWFZdBCRZp4jMdRBzmwccdD2wUkc9cjyYdLyAXXwYeD8Vpy5D99Q83xQM219WejucF48AibZ3eGXDEd";
const TXID =
  "43cTwFD1a9acCpQUYT3L39hyEo8mi9xCkmJN1MXMSkrmh81bkoPXgtpy41JyiLnPJsjd378ErSmX82zzFkQVAPxy";

fetchTransaction(TXID);

/*
curl -X POST https://blue-omniscient-friday.solana-mainnet.quiknode.pro/59ccc9be093f05d398a9256ef883d0b9ad4857e2 \
-H "Content-Type: application/json" \
-d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTransaction",
  "params": [
    "53fzjHAES33QN8z5tWNcobJ4Pj9J17iXVz8UPVEqA1hVPkdVQDhZEbGqptpSjvtyQs1A8eUPSxYYAk9rq22jSSU4",
    {
      "encoding": "json",
      "commitment": "finalized"
    }
  ]
}'

curl -X POST https://api.mainnet-beta.solana.com -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getRecentBlockhash"
}'
*/
