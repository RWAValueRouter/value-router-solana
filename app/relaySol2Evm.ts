import "dotenv/config";
import { findSolMessage } from "./findSolMessage";
import Web3 from "web3";

import * as abi from "./abi.json";
import { BN } from "bn.js";

const relaySol2Evm = async () => {
  const privateKey = "0x你的私钥";

  const txid =
    "5QEto8tcbqEx48tKs6wJPUDadjmg2FDEKZaqijiXCoMAk7zyLneB5E8a3yvXDw2Xn5oox92KuY6y3VJQEJF5K4EZ";

  const web3 = new Web3(process.env.EVM_PROVIDER_URL!);

  const contractAddress = process.env.REMOTE_VALUE_ROUTER!;
  console.log(contractAddress);

  const messages = await findSolMessage(txid);
  console.log("messages: ", messages);

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

  const sellToken = process.env.EVM_USDC;

  const sellAmount = new BN(swapMessage.message.substring(306, 370), "hex");

  const buyToken = "0x" + swapMessage.message.substring(394, 434);

  const buyAmount = new BN(swapMessage.message.substring(434, 498), "hex");

  console.log({
    sellToken: sellToken,
    sellAmount: sellAmount.toString(10),
    buyToken: buyToken,
    buyAmount: buyAmount.toString(10),
  });

  var swapdata = "0x";

  var callgas = 0;

  if (
    buyToken != "0x0000000000000000000000000000000000000000" &&
    buyToken != sellToken
  ) {
    const url = `https://sepolia.api.0x.org/swap/v1/quote?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}`;

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
    console.log(zeroExGas);

    swapdata = zeroExData;

    callgas = parseInt(zeroExGas) * 1.5;
  }

  const data = contract.methods
    .relay(bridgeMessage, swapMessage, swapdata, callgas)
    .encodeABI();

  web3.eth.accounts
    .signTransaction(
      {
        from: walletAccount.address,
        to: contractAddress,
        data: data,
        gasPrice: web3.utils.toHex(1000000000),
        value: 0,
        gas: 400000 + parseInt(callgas), // 设置 gasLimit
      },
      privateKey
    )
    .then((signedTx) => {
      console.log(signedTx);
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
