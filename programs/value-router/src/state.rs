//! State

use {anchor_lang::prelude::*, message_transmitter::instructions::ReceiveMessageParams, std::fmt};

#[account]
#[derive(Debug, InitSpace)]
/// Main state of the MessageTransmitter program
pub struct ValueRouter {
    pub authority_bump: u8,
}

#[account]
pub struct RelayData {
    pub bridge_message: ReceiveMessageParams,
    pub swap_message: ReceiveMessageParams,
    // TODO Jupiter params
}

impl fmt::Debug for RelayData {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("RelayData")
            .field("bridge_message", &self.bridge_message.message)
            .field(
                "bridge_message attestation",
                &self.bridge_message.attestation,
            )
            .field("swap_message", &self.swap_message.message)
            .field("swap_message attestation", &self.swap_message.attestation)
            .finish()
    }
}
