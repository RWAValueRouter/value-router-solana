### Install
```shell
npm i
```

### Relay EVM -> Solana
Set private key file in Anchor.toml
```toml
ANCHOR_WALLET=/home/justin/solflare/key.json
```

Set EVM source tx id in relayEvm2Sol.ts

```ts
const txid =
  "0x4fbf68917e98f6cbdeadd68001809d50e57dd9f48cf1f04cf85c9e0ac50b4218";
```

Run
```shell
npm run relayEvm2Sol
```

### Relay Solana -> EVM
Set private in relaySol2Evm.ts
```ts
const privateKey = "0x你的私钥";
```

Set Solana source tx id in relaySol2Evm.ts

```ts
const txid =
    "5LHa3HMx3jFN1qA8NGYtjsnzSusBmjTgzy13Pk17VcDLp9VyXg2sJs9egR8nS5bbKizHBzsB9Xwuwihn8jKduFsQ";
```

Run
```shell
npm run relaySol2Evm
```