//! Error types

use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("invalid return data")]
    InvalidReturnData,
    #[msg("invalid jupiter program")]
    InvalidJupiterProgram,
    #[msg("incorrect owner")]
    IncorrectOwner,
    #[msg("insufficient length for u64 conversion")]
    InsufficientLengthForU64Conversion,
    #[msg("USDC in account not closed")]
    USDCInAccountNotClosed,
    #[msg("CCTP receiver mismatch")]
    CctpReceiverMismatch,
    #[msg("invalid bump seed provided")]
    InvalidBump,
}
