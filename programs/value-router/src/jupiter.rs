//! Jupiter

use {
    crate::constants,
    anchor_lang::{
        prelude::*,
        solana_program::{
            entrypoint::ProgramResult, instruction::Instruction, program::invoke_signed,
        },
        system_program,
    },
    anchor_spl::token::{self, Mint, Token, TokenAccount},
};

mod jupiter {
    use anchor_lang::declare_id;
    declare_id!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
}

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        jupiter::id()
    }
}

pub fn swap_on_jupiter<'info>(
    remaining_accounts: &[AccountInfo],
    jupiter_program: Program<'info, Jupiter>,
    data: Vec<u8>,
) -> ProgramResult {
    let accounts: Vec<AccountMeta> = remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        })
        .collect();

    let accounts_infos: Vec<AccountInfo> = remaining_accounts
        .iter()
        .map(|acc| AccountInfo { ..acc.clone() })
        .collect();

    // TODO: Check the first 8 bytes. Only Jupiter Route CPI allowed.

    invoke_signed(
        &Instruction {
            program_id: *jupiter_program.key,
            accounts,
            data,
        },
        &accounts_infos,
        &[],
    )
}

#[derive(Accounts)]
pub struct SwapToUSDC<'info> {
    #[account(mut, seeds = [constants::AUTHORITY_SEED], bump)]
    /// CHECK:
    pub program_authority: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut, seeds = [constants::USDC_SEED], bump)]
    pub program_usdc_account: UncheckedAccount<'info>,
    pub user_account: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct USDCToSwap<'info> {
    #[account(mut, seeds = [constants::AUTHORITY_SEED], bump)]
    pub program_authority: SystemAccount<'info>,
    /// CHECK: This may not be initialized yet.
    #[account(mut, seeds = [constants::USDC_SEED], bump)]
    pub program_usdc_account: UncheckedAccount<'info>,
    pub user_account: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
