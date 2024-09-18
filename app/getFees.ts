import axios from 'axios';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

// 定义 ValueRouter 结构体
interface ValueRouter {
  admin: PublicKey;
  domain_ids: number[];  // u32 数组
  bridge_fees: bigint[]; // u64 数组
  swap_fees: bigint[];   // u64 数组
  remote_value_router: PublicKey[];
  fee_receiver: PublicKey;
  noble_caller: PublicKey;
}

// 将 Buffer 解析为 u32 (Little Endian)
function readU32LE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

// 将 Buffer 解析为 u64 (Little Endian)
function readU64LE(buffer: Buffer, offset: number): bigint {
  return buffer.readBigUInt64LE(offset);
}

// 从 Buffer 解析 PublicKey
function readPubkey(buffer: Buffer, offset: number): PublicKey {
  return new PublicKey(buffer.slice(offset, offset + 32));
}

// 解析 base64 编码的账户数据
function parseValueRouter(data: Buffer): ValueRouter {
  let offset = 0;

  // 解析 admin (Pubkey)
  const admin = readPubkey(data, offset);
  offset += 32;

  // 解析 domain_ids (10 * u32)
  const domain_ids = [];
  for (let i = 0; i < 10; i++) {
    domain_ids.push(readU32LE(data, offset));
    offset += 4;
  }

  // 解析 bridge_fees (10 * u64)
  const bridge_fees = [];
  for (let i = 0; i < 10; i++) {
    bridge_fees.push(readU64LE(data, offset));
    offset += 8;
  }

  // 解析 swap_fees (10 * u64)
  const swap_fees = [];
  for (let i = 0; i < 10; i++) {
    swap_fees.push(readU64LE(data, offset));
    offset += 8;
  }

  // 解析 remote_value_router (10 * Pubkey)
  const remote_value_router = [];
  for (let i = 0; i < 10; i++) {
    remote_value_router.push(readPubkey(data, offset));
    offset += 32;
  }

  // 解析 fee_receiver (Pubkey)
  const fee_receiver = readPubkey(data, offset);
  offset += 32;

  // 解析 noble_caller (Pubkey)
  const noble_caller = readPubkey(data, offset);

  return {
    admin,
    domain_ids,
    bridge_fees,
    swap_fees,
    remote_value_router,
    fee_receiver,
    noble_caller,
  };
}

// 获取 Solana 账户数据的函数
async function getAccountData(accountAddress: string) {
  const rpcUrl = 'https://mainnet.helius-rpc.com/?api-key=7391bccc-4df8-409b-aeea-838e927e6123';
  
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "getAccountInfo",
    params: [
      accountAddress,
      { "encoding": "base64" }
    ]
  };

  try {
    const response = await axios.post(rpcUrl, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const accountData = response.data.result.value.data[0]; // base64 数据
    return accountData;
  } catch (error) {
    console.error("Error fetching account data:", error);
    throw error;
  }
}

// 运行主程序
async function main() {
  const accountAddress = "9dhM2t66AGUKkQRTUDLUM98xn9DhdHpKJA9QYe4gzHLy";

  try {
    // 获取账户数据 (base64 编码)
    const base64Data = await getAccountData(accountAddress);

    // 解码 base64 数据
    const decodedData = Buffer.from(base64Data, 'base64');

    // 解析账户数据
    const valueRouter = parseValueRouter(decodedData.slice(8));

    // 输出 bridge_fees 和 swap_fees
    console.log("Bridge Fees:", valueRouter.bridge_fees);
    console.log("Swap Fees:", valueRouter.swap_fees);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

