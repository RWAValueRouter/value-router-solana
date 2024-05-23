//! Error types

use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    InvalidReturnData,
    InvalidJupiterProgram,
    IncorrectOwner,
    InsufficientLengthForU64Conversion,
}
