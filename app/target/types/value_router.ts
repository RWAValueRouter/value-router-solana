export type ValueRouter = {
  "version": "0.1.0",
  "name": "value_router",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "InitializeParams"
          }
        }
      ]
    },
    {
      "name": "swapAndBridge",
      "accounts": [
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "eventRentPayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "messageTransmitterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMessengerMinterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "valueRouterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMessenger",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMinter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "senderAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "senderAuthorityPda2",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageSentEventData1",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "messageSentEventData2",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "remoteTokenMessenger",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "localToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "remoteValueRouter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programUsdcAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Program usdc token account"
          ]
        },
        {
          "name": "sourceMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "jupiterProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "SwapAndBridgeParams"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "valueRouter",
      "docs": [
        "Main state of the MessageTransmitter program"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authorityBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "relayData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          },
          {
            "name": "swapMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "BuyArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyToken",
            "type": "publicKey"
          },
          {
            "name": "guaranteedBuyAmount",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "SwapAndBridgeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "jupiterSwapData",
            "type": "bytes"
          },
          {
            "name": "buyArgs",
            "type": {
              "defined": "BuyArgs"
            }
          },
          {
            "name": "bridgeUsdcAmount",
            "type": "u64"
          },
          {
            "name": "destDomain",
            "type": "u32"
          },
          {
            "name": "recipient",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidReturnData"
    },
    {
      "code": 6001,
      "name": "InvalidJupiterProgram"
    },
    {
      "code": 6002,
      "name": "IncorrectOwner"
    }
  ]
};

export const IDL: ValueRouter = {
  "version": "0.1.0",
  "name": "value_router",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "InitializeParams"
          }
        }
      ]
    },
    {
      "name": "swapAndBridge",
      "accounts": [
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "eventRentPayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "messageTransmitterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMessengerMinterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "valueRouterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMessenger",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMinter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "senderAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "senderAuthorityPda2",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageSentEventData1",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "messageSentEventData2",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "remoteTokenMessenger",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "localToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "remoteValueRouter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programUsdcAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Program usdc token account"
          ]
        },
        {
          "name": "sourceMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "jupiterProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "SwapAndBridgeParams"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "valueRouter",
      "docs": [
        "Main state of the MessageTransmitter program"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authorityBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "relayData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          },
          {
            "name": "swapMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "BuyArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyToken",
            "type": "publicKey"
          },
          {
            "name": "guaranteedBuyAmount",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "SwapAndBridgeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "jupiterSwapData",
            "type": "bytes"
          },
          {
            "name": "buyArgs",
            "type": {
              "defined": "BuyArgs"
            }
          },
          {
            "name": "sellUsdcAmount",
            "type": "u64"
          },
          {
            "name": "destDomain",
            "type": "u32"
          },
          {
            "name": "recipient",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidReturnData"
    },
    {
      "code": 6001,
      "name": "InvalidJupiterProgram"
    },
    {
      "code": 6002,
      "name": "IncorrectOwner"
    }
  ]
};
