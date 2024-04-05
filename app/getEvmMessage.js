var { Web3 } = require("web3");
//var web3 = new Web3("https://optimism.llamarpc.com");
//var web3 = new Web3("https://rpc.ankr.com/eth_goerli");
//var web3 = new Web3("https://rpc.ankr.com/avalanche");
var web3 = new Web3("https://rpc.ankr.com/eth_sepolia");

(async () => {
  const transactionReceipt = await web3.eth.getTransactionReceipt(
    //"0x391effe4f96f23c05873ad25bccece3477064b9735382cc05ccf03e8a11f219e"
    //"0x0146089ee240f016e209ecf1abd05b38d27ef918aa77804ac2f13168ce052dc6"
    //"0x13b54318fc30ea523ff141b609fccdb3907ba9ba7fdd8f105747e193904af3f4"
    //"0xa82f0dc88a3c2c9138984f987b351a8d6f59b9f99d59aaf695343ad9851a5eaf"
    //"0x560fef1dff4b2f1a9c220d693adfd2660b17c470d0b928696274d90e2916b9c9"
    //"0x10771a6096dbcb76f16c68422b5b5680f115971d3ac82a25d0f940c06c9d903e"
    //"0x476d260c68086d98be24ca2cdd5e0bef3be129cc6935a1e9603bd9e765647ed4"
    //"0x50ff3f2c48b8792a3d4190dd1fa19afae2f2e64f5c6097f01600af680d2f949c"
    "0x4fbf68917e98f6cbdeadd68001809d50e57dd9f48cf1f04cf85c9e0ac50b4218"
  );
  const irisUrl = "https://iris-api-sandbox.circle.com/attestations";
  const eventTopic = web3.utils.keccak256("MessageSent(bytes)");
  const logs = transactionReceipt.logs.filter(
    (l) => l.topics[0] === eventTopic
  );
  Array.from(logs).map((log) => {
    const messageBytes = web3.eth.abi.decodeParameters(["bytes"], log.data)[0];
    console.log("messageBytes: ", messageBytes);
    const messageHash = web3.utils.keccak256(messageBytes);
    console.log("messageHash: ", messageHash);
    let url = `${irisUrl}/${messageHash}`;
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("attestation: ", data.attestation);
      });
  });
})();
