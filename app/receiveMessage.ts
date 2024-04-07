/*
 * Copyright (c) 2024, Circle Internet Financial LTD All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "dotenv/config";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import {
  SOLANA_USDC_ADDRESS,
  decodeEventNonceFromMessage,
  getAnchorConnection,
  getPrograms,
  getReceiveMessagePdas,
} from "./utils";

export const solReceiveMessage = async (
  usdcAddress: PublicKey,
  userTokenAccount: PublicKey,
  remoteTokenAddressHex: string,
  remoteDomain: string,
  messageHex: string,
  attestationHex: string,
  nonce: string
) => {
  const provider = getAnchorConnection();

  const { messageTransmitterProgram, tokenMessengerMinterProgram } =
    getPrograms(provider);

  // Get PDAs
  const pdas = await getReceiveMessagePdas(
    { messageTransmitterProgram, tokenMessengerMinterProgram },
    usdcAddress,
    remoteTokenAddressHex,
    remoteDomain,
    nonce
  );

  // accountMetas list to pass to remainingAccounts
  const accountMetas: any[] = [];
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.tokenMessengerAccount.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.remoteTokenMessengerKey.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: pdas.tokenMinterAccount.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: pdas.localToken.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.tokenPair.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: userTokenAccount,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: true,
    pubkey: pdas.custodyTokenAccount.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: spl.TOKEN_PROGRAM_ID,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: pdas.tokenMessengerEventAuthority.publicKey,
  });
  accountMetas.push({
    isSigner: false,
    isWritable: false,
    pubkey: tokenMessengerMinterProgram.programId,
  });

  const receiveMessageTx = await messageTransmitterProgram.methods
    .receiveMessage({
      message: Buffer.from(messageHex.replace("0x", ""), "hex"),
      attestation: Buffer.from(attestationHex.replace("0x", ""), "hex"),
    })
    .accounts({
      payer: provider.wallet.publicKey,
      caller: provider.wallet.publicKey,
      authorityPda: pdas.authorityPda,
      messageTransmitter: pdas.messageTransmitterAccount.publicKey,
      usedNonces: pdas.usedNonces,
      receiver: tokenMessengerMinterProgram.programId,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(accountMetas)
    .rpc();

  console.log("\n\nreceiveMessage Tx: ", receiveMessageTx);
};
