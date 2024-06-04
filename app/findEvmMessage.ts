import "dotenv/config";
import Web3 from "web3";
const web3 = new Web3(process.env.EVM_PROVIDER_URL!);

export const findEvmMessage = async (irisUrl: string, txid: string) => {
  const transactionReceipt = await web3.eth.getTransactionReceipt(txid);
  const eventTopic = web3.utils.keccak256("MessageSent(bytes)");
  const logs = transactionReceipt.logs.filter(
    (l) => l.topics[0] === eventTopic
  );
  const promises = Array.from(logs).map(async (log) => {
    const messageBytes = web3.eth.abi.decodeParameters(["bytes"], log.data)[0];
    const messageHash = web3.utils.keccak256(messageBytes);
    let url = `${irisUrl}/${messageHash}`;
    return await fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const resp = await response.json();
      return {
        messageHash: messageHash,
        message: messageBytes,
        attestation: resp["attestation"],
      };
    });
  });
  const results = await Promise.all(promises);
  return results;
};

(async () => {
  const irisUrl = "https://iris-api.circle.com/attestations";

  findEvmMessage(
    irisUrl,
    "0x17c746b5f51249448df144a2b5d5c5d22af650adf25ec8b23d927dc23b0c8230"
  ).then(console.log);
})();
