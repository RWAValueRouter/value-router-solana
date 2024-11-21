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
    #[msg("Wrong Fee Receiver")]
    WrongFeeReceiver,
    #[msg("insufficient balance to swap")]
    NotEnoughBalance,
    #[msg("invalid swap version")]
    WrongSwapVersion,
    #[msg("mismatch source domain")]
    WrongSourceDomain,
    #[msg("mismatch nonce")]
    WrongNonce,
    #[msg("mismatch recipient's wallet account")]
    WrongRecipientWallet,
    #[msg("mismatch recipient's output token account")]
    WrongRecipientTokenAccount,
    #[msg("mismatch recipient's usdc account")],
    WrongRecipientUSDCAccount,

}
