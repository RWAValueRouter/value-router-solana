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
          "isMut": true,
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
          "name": "tmAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vrAuthorityPda",
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
          "name": "usdcMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
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
            "defined": "RelayParams"
          }
        }
      ]
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
    },
    {
      "name": "RelayParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "jupiterSwapData",
            "type": "bytes"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "SwapAndBridgeEvent",
      "fields": [
        {
          "name": "bridgeUsdcAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "buyToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "guaranteedBuyAmount",
          "type": "bytes",
          "index": false
        },
        {
          "name": "destDomain",
          "type": "u32",
          "index": false
        },
        {
          "name": "recipient",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "bridgeNonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "swapNonce",
          "type": "u64",
          "index": false
        }
      ]
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
    },
    {
      "code": 6003,
      "name": "InsufficientLengthForU64Conversion"
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
          "isMut": true,
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
          "name": "tmAuthorityPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vrAuthorityPda",
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
          "name": "usdcMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
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
            "defined": "RelayParams"
          }
        }
      ]
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
    },
    {
      "name": "RelayParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "jupiterSwapData",
            "type": "bytes"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "SwapAndBridgeEvent",
      "fields": [
        {
          "name": "bridgeUsdcAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "buyToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "guaranteedBuyAmount",
          "type": "bytes",
          "index": false
        },
        {
          "name": "destDomain",
          "type": "u32",
          "index": false
        },
        {
          "name": "recipient",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "bridgeNonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "swapNonce",
          "type": "u64",
          "index": false
        }
      ]
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
    },
    {
      "code": 6003,
      "name": "InsufficientLengthForU64Conversion"
    }
  ]
};