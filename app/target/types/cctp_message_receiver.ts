export type CctpMessageReceiver = {
  "version": "0.1.0",
  "name": "cctp_message_receiver",
  "instructions": [
    {
      "name": "handleReceiveMessage",
      "accounts": [
        {
          "name": "authorityPda",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "HandleReceiveMessageParams"
          }
        }
      ]
    }
  ]
};

export const IDL: CctpMessageReceiver = {
  "version": "0.1.0",
  "name": "cctp_message_receiver",
  "instructions": [
    {
      "name": "handleReceiveMessage",
      "accounts": [
        {
          "name": "authorityPda",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "HandleReceiveMessageParams"
          }
        }
      ]
    }
  ]
};
