//! SwapMessage encoding and decoding functions.

use {crate::errors::ErrorCode, anchor_lang::prelude::*};

#[derive(Clone, Debug)]
pub struct SwapMessage<'a> {
    data: &'a [u8],
}

impl<'a> SwapMessage<'a> {
    const SWAP_MESSAGE_LEN: usize = 164;
    const VERSION_INDEX: usize = 0;
    const BRIDGE_NONCE_HASH_INDEX: usize = 4;
    const SELL_AMOUNT_INDEX: usize = 36;
    const BUY_TOKEN_INDEX: usize = 68;
    const GUARANTEED_BUY_AMOUNT_INDEX: usize = 100;
    const RECIPIENT_INDEX: usize = 132;
    const AMOUNT_OFFSET: usize = 24; // byte difference in u256 and u64

    pub fn new(_expected_version: u32, message_bytes: &'a [u8]) -> Result<Self> {
        let message = Self {
            data: message_bytes,
        };
        Ok(message)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn format_message(
        version: u32,
        bridge_nonce_hash: Vec<u8>,
        sell_amount: u64,
        buy_token: &Pubkey,
        guaranteed_buy_amount: Vec<u8>, // uint256 as bytes32
        recipient: &Pubkey,
    ) -> Result<Vec<u8>> {
        let mut output = vec![0; Self::SWAP_MESSAGE_LEN];

        output[Self::VERSION_INDEX..Self::BRIDGE_NONCE_HASH_INDEX]
            .copy_from_slice(&version.to_be_bytes());

        output[Self::BRIDGE_NONCE_HASH_INDEX..Self::SELL_AMOUNT_INDEX]
            .copy_from_slice(bridge_nonce_hash.as_ref());

        output[Self::SELL_AMOUNT_INDEX + Self::AMOUNT_OFFSET..Self::BUY_TOKEN_INDEX]
            .copy_from_slice(&sell_amount.to_be_bytes());

        output[(Self::BUY_TOKEN_INDEX)..Self::GUARANTEED_BUY_AMOUNT_INDEX]
            .copy_from_slice(buy_token.as_ref());

        output[Self::GUARANTEED_BUY_AMOUNT_INDEX..Self::RECIPIENT_INDEX]
            .copy_from_slice(guaranteed_buy_amount.as_ref());

        output[Self::RECIPIENT_INDEX..Self::SWAP_MESSAGE_LEN].copy_from_slice(recipient.as_ref());

        Ok(output)
    }
    pub fn get_version(&self) -> Result<u32> {
        let mut version_bytes = [0u8; 4];
        version_bytes
            .copy_from_slice(&self.data[Self::VERSION_INDEX..Self::BRIDGE_NONCE_HASH_INDEX]);
        Ok(u32::from_be_bytes(version_bytes))
    }

    pub fn get_bridge_nonce_hash(&self) -> Result<Vec<u8>> {
        Ok(self.data[Self::BRIDGE_NONCE_HASH_INDEX..Self::SELL_AMOUNT_INDEX].to_vec())
    }

    pub fn get_sell_amount(&self) -> Result<u64> {
        let mut sell_amount_bytes = [0u8; 8];
        sell_amount_bytes.copy_from_slice(
            &self.data[Self::SELL_AMOUNT_INDEX + Self::AMOUNT_OFFSET..Self::BUY_TOKEN_INDEX],
        );
        Ok(u64::from_be_bytes(sell_amount_bytes))
    }

    pub fn get_buy_token(&self) -> Result<Pubkey> {
        let mut buy_token_bytes = [0u8; 32];
        buy_token_bytes
            .copy_from_slice(&self.data[Self::BUY_TOKEN_INDEX..Self::GUARANTEED_BUY_AMOUNT_INDEX]);
        Ok(Pubkey::new_from_array(buy_token_bytes))
    }

    pub fn get_guaranteed_buy_amount(&self) -> Result<u64> {
        // guaranteed_buy_amount is a uint256 (32 bytes)
        let guaranteed_buy_amount_bytes =
            &self.data[Self::GUARANTEED_BUY_AMOUNT_INDEX..Self::RECIPIENT_INDEX];

        if guaranteed_buy_amount_bytes.len() < 8 {
            return err!(ErrorCode::InsufficientLengthForU64Conversion);
        }

        let mut amount_bytes = [0u8; 8];
        amount_bytes
            .copy_from_slice(&guaranteed_buy_amount_bytes[guaranteed_buy_amount_bytes.len() - 8..]);
        Ok(u64::from_be_bytes(amount_bytes))
    }

    pub fn get_recipient(&self) -> Result<Pubkey> {
        let mut recipient_bytes = [0u8; 32];
        recipient_bytes.copy_from_slice(&self.data[Self::RECIPIENT_INDEX..Self::SWAP_MESSAGE_LEN]);
        Ok(Pubkey::new_from_array(recipient_bytes))
    }
}
