use {
    crate::{constants, state::ValueRouter, utils},
    anchor_lang::prelude::*,
    anchor_spl::token::Token,
};

/*
Instruction 1: initialize
 */
// Instruction accounts
#[derive(Accounts)]
#[instruction(params: InitializeParams)]
pub struct InitializeContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
            init_if_needed,
            payer = payer,
            space = 640,
            seeds = [constants::VALUE_ROUTER],
            bump,
            constraint = value_router.admin == Pubkey::default() @ InitializeErrorCode::AccountAlreadyInitialized
        )]
    pub value_router: Box<Account<'info, ValueRouter>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [constants::AUTHORITY_SEED],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        constraint = usdc_mint.key() == constants::USDC_MINT_ADDRESS
    )]
    pub usdc_mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    /// CHECK:
    #[account(
        mut,
        seeds = [constants::USDC_SEED],
        bump
    )]
    pub program_usdc_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [constants::USDC_IN_SEED],
        bump
    )]
    pub program_usdc_in_account: UncheckedAccount<'info>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct InitializeParams {}

// Instruction handler
pub fn initialize(ctx: Context<InitializeContext>, _params: InitializeParams) -> Result<()> {
    let value_router = ctx.accounts.value_router.as_mut();

    value_router.admin = ctx.accounts.payer.key();

    let _ = utils::create_usdc_token_idempotent(
        &ctx.accounts.program_authority,
        &ctx.accounts.program_usdc_account,
        &Box::new(Account::try_from(&ctx.accounts.usdc_mint)?),
        &ctx.accounts.token_program,
        &ctx.accounts.system_program,
        &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
        &constants::USDC_SEED,
        &ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes(),
    )?;

    let _ = utils::create_usdc_token_idempotent(
        &ctx.accounts.program_authority,
        &ctx.accounts.program_usdc_in_account,
        &Box::new(Account::try_from(&ctx.accounts.usdc_mint)?),
        &ctx.accounts.token_program,
        &ctx.accounts.system_program,
        &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
        &constants::USDC_IN_SEED,
        &ctx.bumps
            .get("program_usdc_in_account")
            .unwrap()
            .to_le_bytes(),
    )?;

    Ok(())
}

// Define a custom error code
#[error_code]
pub enum InitializeErrorCode {
    #[msg("The account has already been initialized")]
    AccountAlreadyInitialized,
}
