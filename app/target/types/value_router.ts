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
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
      "name": "setValueRouter",
      "accounts": [
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "SetValueRouterParams"
          }
        }
      ]
    },
    {
      "name": "setAdmin",
      "accounts": [
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "SetAdminParams"
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
        },
        {
          "name": "feeReceiver",
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
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "bridgeFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "swapFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "feeReceiver",
            "type": "publicKey"
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
      "name": "SetValueRouterParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "swapFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "feeReceiver",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "SetAdminParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          }
        ]
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
      "name": "InvalidReturnData",
      "msg": "invalid return data"
    },
    {
      "code": 6001,
      "name": "InvalidJupiterProgram",
      "msg": "invalid jupiter program"
    },
    {
      "code": 6002,
      "name": "IncorrectOwner",
      "msg": "incorrect owner"
    },
    {
      "code": 6003,
      "name": "InsufficientLengthForU64Conversion",
      "msg": "insufficient length for u64 conversion"
    },
    {
      "code": 6004,
      "name": "USDCInAccountNotClosed",
      "msg": "USDC in account not closed"
    },
    {
      "code": 6005,
      "name": "CctpReceiverMismatch",
      "msg": "CCTP receiver mismatch"
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
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
      "name": "setValueRouter",
      "accounts": [
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "SetValueRouterParams"
          }
        }
      ]
    },
    {
      "name": "setAdmin",
      "accounts": [
        {
          "name": "valueRouter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "SetAdminParams"
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
        },
        {
          "name": "feeReceiver",
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
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "bridgeFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "swapFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "feeReceiver",
            "type": "publicKey"
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
      "name": "SetValueRouterParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "swapFees",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "feeReceiver",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "SetAdminParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          }
        ]
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
      "name": "InvalidReturnData",
      "msg": "invalid return data"
    },
    {
      "code": 6001,
      "name": "InvalidJupiterProgram",
      "msg": "invalid jupiter program"
    },
    {
      "code": 6002,
      "name": "IncorrectOwner",
      "msg": "incorrect owner"
    },
    {
      "code": 6003,
      "name": "InsufficientLengthForU64Conversion",
      "msg": "insufficient length for u64 conversion"
    },
    {
      "code": 6004,
      "name": "USDCInAccountNotClosed",
      "msg": "USDC in account not closed"
    },
    {
      "code": 6005,
      "name": "CctpReceiverMismatch",
      "msg": "CCTP receiver mismatch"
    }
  ]
};
