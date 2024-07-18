import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js";

// Replace with your Solana RPC endpoint
const SOLANA_RPC_URL =
  "https://blue-omniscient-friday.solana-mainnet.quiknode.pro/59ccc9be093f05d398a9256ef883d0b9ad4857e2";

// Function to fetch transaction details
async function fetchTransaction(txid: TransactionSignature) {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  try {
    const transaction = await connection.getTransaction(txid);

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
const TXID =
  "zHhVRzT5CWFZdBCRZp4jMdRBzmwccdD2wUkc9cjyYdLyAXXwYeD8Vpy5D99Q83xQM219WejucF48AibZ3eGXDEd";

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
*/

const i = {
  jsonrpc: "2.0",
  result: {
    blockTime: 1721312784,
    meta: {
      computeUnitsConsumed: 5851,
      err: null,
      fee: 5000,
      innerInstructions: [],
      loadedAddresses: { readonly: [], writable: [] },
      logMessages: [
        "Program CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj invoke [1]",
        "Program log: Instruction: PostBridgeMessage",
        "Program log: post_bridge_message",
        "Program CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj consumed 2813 of 400000 compute units",
        "Program CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj success",
        "Program CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj invoke [1]",
        "Program log: Instruction: PostSwapMessage",
        "Program log: post_swap_message",
        "Program CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj consumed 3038 of 397187 compute units",
        "Program CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj success",
      ],
      postBalances: [63133080, 11330880, 1141440],
      postTokenBalances: [],
      preBalances: [63138080, 11330880, 1141440],
      preTokenBalances: [],
      rewards: [],
      status: { Ok: null },
    },
    slot: 278265976,
    transaction: {
      message: {
        accountKeys: [
          "4bW9er8krg5og3WkVYULz4QQWr9dfLooxZoCNQ4qhvCW",
          "7teyQc3og4FS4fF51kW1vMvy8zKzAKWpyD6BtFu7o1Lr",
          "CoCTk9bJZnEGUWVLmY4igrFS4AZ4967p3wz8AYxnxUvj",
        ],
        header: {
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
          numRequiredSignatures: 1,
        },
        instructions: [
          {
            accounts: [0, 1],
            data: "2GAATRJF8vXkzbyz9cuyAn93pA54w9ygaahZYUmEgd5zX4WwJTFkpA1wvUy8nntCWs3zwaeyXLvG1RbKhKvMofwfrRT6GEvhmLZz1abXVEHqhR8xdgFNTaNYdbiAPcJW5tMotZHSRnu76RqBHASHBCHmPYM76zzhpr58AtWUFaPkbLQTYFLDMnqU2dvX9ZG6Txz8B77FGh3ugyKCLs2o9EUVjQQMn1iZraU57VJBCbXqrqYHJop8WAJyEJkXZFgaNq4FPQyxE7puNPDQbUwY9VbTAqygmwM2ifEoL8ttoHBu1N6ocwuWFMb6jx8n7aMiUPEfawUPsBW7tYdpPcGU9hjmJ6XrYaLVN2HStjM3ngQQJnyN9GP6tnajY3dj2BCDGzJM28vJFn4vRy4A4FXF9iMNnGgXarFLVhA2DjUJSTAbzGmhFScXYj4rwdsAgn2FWKHUCnUZmCYZYtEyWinF1J6CGcorsFJNWATBr8N2SDzphvA1uebQrTt9F7VNX64zd6gCh9mkQwQ767kkBWb36Rv67Ni",
            programIdIndex: 2,
            stackHeight: null,
          },
          {
            accounts: [0, 1],
            data: "5P5aQmdkDMAeWDZ18hbYKi2q8c8pMNXCy4GdHX8DttQoyXDjj2jCTUN7ZN44Q2U2dyQdqHC6QTZbfPNbkURXvm1dG88ExxJmGzM1UzNKvqjCMPRT8yekbr3Hm2xqm5VYuoiFnUHidunQB39oAtdhXE3nP8mQA8Xp25Kkh9m121pYYanX3X1P9m2Cqvegpo6AE19LtJSPuTFbpNU9JMTQMVGJBeUytXiss2yAVcCLSU5oKKLnMs5EcWoCNiLiqZtFr2zBqy7SoUdtUqfByUAjt5NDRjRYDBUVz9maChpYjCyNXFfiRzjvqWPSC7YHw2J1JKmExGA7HuAH2EpJ67tzVCVYHoNzt7Jokzy3EvnWMawwijMutz916d4rXMpRCAbgR1Fb5KnWz4xWQoW5Bk9dRqwrc64n3msanyVMCiKncF5nkgpntUH1e2GNXNZmd75C3Nz3cCaGz168rECfk98xEoFeocxUniV3QcqQvEsjDPbfBpJLrLgFdniGFZxVMXr76Dzn1YoRYzMHYhzXEDuoaG493qHqntsGTyZHQ1opNx4f24qVe2YwPsbtJdPZNrQU1M74nE",
            programIdIndex: 2,
            stackHeight: null,
          },
        ],
        recentBlockhash: "yfigCndVzLU1C3rU61GHtuLdNfySnbxx5r65hhPE7UW",
      },
      signatures: [
        "zHhVRzT5CWFZdBCRZp4jMdRBzmwccdD2wUkc9cjyYdLyAXXwYeD8Vpy5D99Q83xQM219WejucF48AibZ3eGXDEd",
      ],
    },
  },
  id: 1,
};
