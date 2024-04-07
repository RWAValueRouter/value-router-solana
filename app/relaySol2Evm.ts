import "dotenv/config";
import { findSolMessage } from "./findSolMessage";
import Web3 from "web3";

import * as abi from "./abi.json";
import { BN } from "bn.js";

const relaySol2Evm = async () => {
  const web3 = new Web3(process.env.EVM_PROVIDER_URL!);

  const contractAddress = process.env.REMOTE_VALUE_ROUTER!;
  console.log(contractAddress);

  const messages = await findSolMessage(
    "5LHa3HMx3jFN1qA8NGYtjsnzSusBmjTgzy13Pk17VcDLp9VyXg2sJs9egR8nS5bbKizHBzsB9Xwuwihn8jKduFsQ"
  );
  console.log("messages: ", messages);

  const privateKey = "0x你的私钥";

  const walletAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

  const contract = new web3.eth.Contract(abi, contractAddress);

  const bridgeMessage = {
    message: messages.bridgeMessage.message,
    attestation: messages.bridgeMessage.attestation,
  };

  const swapMessage = {
    message: messages.swapMessage.message,
    attestation: messages.swapMessage.attestation,
  };

  const sellToken = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
  const buyToken = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";

  //const sellToken = process.env.EVM_USDC;

  const sellAmount = new BN(swapMessage.message.substring(306, 370), "hex");

  //const buyToken = "0x" + swapMessage.message.substring(394, 434);

  const buyAmount = new BN(swapMessage.message.substring(434, 498), "hex");

  console.log({
    sellToken: sellToken,
    sellAmount: sellAmount.toString(10),
    buyToken: buyToken,
    buyAmount: buyAmount.toString(10),
  });

  const url = `https://arbitrum.api.0x.org/swap/v1/quote?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}`;

  const headers = {
    "0x-api-key": "9f49e2cb-69fe-4192-8afa-c92130f8aaa6",
  };

  // 发送 GET 请求
  const { data: zeroExData, gas: zeroExGas } = await fetch(url, { headers })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  console.log(zeroExData);

  const swapdata = zeroExData;

  const callgas = zeroExGas;

  const data = contract.methods
    .relay(bridgeMessage, swapMessage, swapdata, callgas)
    .encodeABI();

  web3.eth.accounts
    .signTransaction(
      {
        from: walletAccount.address,
        to: contractAddress,
        data: data,
        gasPrice: web3.utils.toHex(web3.utils.toWei("2", "gwei")),
        value: 0,
        gas: 600000 + zeroExGas, // 设置 gasLimit
      },
      privateKey
    )
    .then((signedTx) => {
      // 发送已签名交易
      web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        function (err, txHash) {
          if (!err) {
            console.log("Transaction hash:", txHash);
          } else {
            console.error("Error:", err);
          }
        }
      );
    })
    .catch((err) => {
      console.error("Error:", err);
    });
};

relaySol2Evm();
