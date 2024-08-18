## Noble -> Solana

client 构造一笔交易，包含3个messages
1. Bridge message
2. Swap message
3. Fee message

### Bridge message

```proto
message MsgDepositForBurnWithCaller {
  string from = 1;
  string amount = 2 [
    (gogoproto.customtype) = "cosmossdk.io/math.Int",
    (gogoproto.nullable) = false
  ];
  uint32 destination_domain = 3;
  bytes mint_recipient = 4;
  string burn_token = 5;
  bytes destination_caller = 6;
}
```

* from - 用户 noble 地址
* amount - burn usdc 数量
* destination_domain - 5
* mint_recipient - ***Solana program usdc account***
* burn_token - uusdc
* destination_caller - ***Solana VR caller***

### Swap message

```proto
message MsgSendMessageWithCaller {
  string from = 1;
  uint32 destination_domain = 2;
  bytes recipient = 3;
  bytes message_body = 4;
  bytes destination_caller = 5;
}
```

* from - 用户 noble 地址
* destination_domain - 5
* recipient - Solana VR message receiver: `0x4352e98d0dfef2a95d0a81a56c960dec102111ac0ba732ab8858a5891dfb5df0` // 固定的
* message_body - encoded swap message
* destination_caller - ***Solana VR caller***

swap message 按 EVM 方式编码

```solidity
struct SwapMessage {
    uint32 version;
    bytes32 bridgeNonceHash;
    uint256 sellAmount;
    bytes32 buyToken;
    uint256 guaranteedBuyAmount;
    bytes32 recipient;
}
```

* SwapMessage.version = 1
* SwapMessage.bridgeNonceHash = 空bytes32
* SwapMessage.recipient = 用户的 solana token account，不需要提前创建

### Fee message

Send coin to fee receiver.

## Solana -> Noble

调用 SwapAndBridge instruction，accounts 和 remaining accounts (for jupiter swap) 和 Solana->EVM 相同.

```ts
const swapAndBridgeInstruction = await valueRouterProgram.methods
    .swapAndBridge({
      jupiterSwapData: swapInstruction.data,
      buyArgs: {
        buyToken: buyToken,
        guaranteedBuyAmount: guaranteedBuyAmount,
      },
      bridgeUsdcAmount: bridgeUsdcAmount,
      destDomain: destinationDomain,
      recipient: mintRecipient,
    })
    .accounts(accounts)
    .remainingAccounts(swapInstruction.keys)
    .instruction();
```

* jupiter_swap_data - 源链 swap data
* buy_args.buy_token - 必须是 32 位全 0 数组，表示收到的 noble coin 是 usdc
* buy_args.guaranteed_buy_amount - 等于 bridge_usdc_amount
* bridge_usdc_amount - 用户要跨的 usdc 数量
* dest_domain - 4
* recipient - 用户的 noble 地址 (Bech32 -> Byte[32] -> Pubkey)
