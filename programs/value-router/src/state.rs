//! State

use hex::encode;
use {anchor_lang::prelude::*, message_transmitter::instructions::ReceiveMessageParams, std::fmt};

#[account]
#[derive(Debug, InitSpace)]
/// Main state of the MessageTransmitter program
pub struct ValueRouter {
    pub admin: Pubkey,
    pub bridge_fees: [u64; 10],
    pub swap_fees: [u64; 10],
    pub fee_receiver: Pubkey,
}

#[account]
pub struct RelayData {
    pub bridge_message: ReceiveMessageParams,
    pub swap_message: ReceiveMessageParams,
}

impl fmt::Debug for RelayData {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("RelayData")
            .field("bridge_message", &encode(&self.bridge_message.message))
            .field(
                "bridge_message attestation",
                &encode(&self.bridge_message.attestation),
            )
            .field("swap_message", &encode(&self.swap_message.message))
            .field(
                "swap_message attestation",
                &encode(&self.swap_message.attestation),
            )
            .finish()
    }
}

#[event]
pub struct SwapAndBridgeEvent {
    pub bridge_usdc_amount: u64,
    pub buy_token: Pubkey,
    pub guaranteed_buy_amount: Vec<u8>,
    pub dest_domain: u32,
    pub recipient: Pubkey,
    pub bridge_nonce: u64,
    pub swap_nonce: u64,
}
