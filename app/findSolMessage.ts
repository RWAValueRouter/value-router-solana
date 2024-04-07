import { getMessages } from "./utils";

export const findSolMessage = async (txid) => {
  while (true) {
    const response = await getMessages(txid);
    console.log("swapAndBridgeTx message 1 information:", response.messages[0]);
    console.log("swapAndBridgeTx message 2 information:", response.messages[1]);
    console.log(
      "message and attestation can be used to receive the message on destination chain with domain"
    );
    const message1 = response.messages[0];
    const message2 = response.messages[1];
    if (
      message1.attestation !== "PENDING" &&
      message2.attestation !== "PENDING"
    ) {
      if (message1.eventNonce < message2.eventNonce) {
        return {
          bridgeMessage: message1,
          swapMessage: message2,
        };
      } else {
        return {
          bridgeMessage: message2,
          swapMessage: message1,
        };
      }
    }
    setTimeout(() => {}, 1000);
  }
};
