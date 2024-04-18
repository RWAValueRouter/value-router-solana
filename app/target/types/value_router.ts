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
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
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
          "name": "payerInputAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerUsdcAta",
          "isMut": true,
          "isSigner": false
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
    },
    {
      "name": "createRelayData",
      "accounts": [
        {
          "name": "eventRentPayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "relayData",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "postBridgeMessage",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "relayData",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "PostBridgeDataParams"
          }
        }
      ]
    },
    {
      "name": "postSwapMessage",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "relayData",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "PostSwapDataParams"
          }
        }
      ]
    },
    {
      "name": "relay",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "caller",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usedNonces",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMessengerMinterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "valueRouterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitterEventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMessengerEventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "relayParams",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMessenger",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "remoteTokenMessenger",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMinter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "localToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerInputAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recipientTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "custodyTokenAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
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
    },
    {
      "name": "PostBridgeDataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          }
        ]
      }
    },
    {
      "name": "PostSwapDataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          }
        ]
      }
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
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
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
          "name": "payerInputAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerUsdcAta",
          "isMut": true,
          "isSigner": false
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
    },
    {
      "name": "createRelayData",
      "accounts": [
        {
          "name": "eventRentPayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "relayData",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "postBridgeMessage",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "relayData",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "PostBridgeDataParams"
          }
        }
      ]
    },
    {
      "name": "postSwapMessage",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "relayData",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "PostSwapDataParams"
          }
        }
      ]
    },
    {
      "name": "relay",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "caller",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usedNonces",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMessengerMinterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "valueRouterProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "messageTransmitterEventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMessengerEventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "relayParams",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMessenger",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "remoteTokenMessenger",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMinter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "localToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerInputAta",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recipientTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "custodyTokenAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
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
    },
    {
      "name": "PostBridgeDataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          }
        ]
      }
    },
    {
      "name": "PostSwapDataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapMessage",
            "type": {
              "defined": "ReceiveMessageParams"
            }
          }
        ]
      }
    }
  ]
};
