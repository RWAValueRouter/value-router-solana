use solana_program::program::invoke;
use spl_associated_token_account::{create_associated_token_account, get_associated_token_address};
use {
    anchor_lang::prelude::*,
    anchor_spl::token::{Token, TokenAccount},
};

/*
Instruction 8: init_recipient_token_accounts
 */
#[derive(Accounts)]
#[instruction(params: InitRecipientTokenAccountsParams)]
pub struct InitRecipientTokenAccountsInstruction<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: recipient wallet account
    #[account(mut)]
    pub recipient_wallet_account: UncheckedAccount<'info>,

    //#[account()]
    //pub recipient_usdc_account: Box<Account<'info, TokenAccount>>,

    //#[account()]
    //pub recipient_output_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    /// CHECK:
    #[account(
            mut,
            constraint = usdc_mint.key() == solana_program::pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        )]
    pub usdc_mint: UncheckedAccount<'info>,

    /// CHECK:
    pub output_mint: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitRecipientTokenAccountsParams {}

pub fn init_recipient_token_accounts<'a>(
    ctx: Context<'_, '_, '_, 'a, InitRecipientTokenAccountsInstruction<'a>>,
    _params: InitRecipientTokenAccountsParams,
) -> Result<()> {
    let associated_token_account_1 = get_associated_token_address(
        &ctx.accounts.recipient_wallet_account.key(),
        &ctx.accounts.usdc_mint.key(),
    );

    let account_info_1 = ctx
        .remaining_accounts
        .iter()
        .find(|account| account.key == &associated_token_account_1);

    // Check if the associated token account already exists
    if account_info_1.is_none() {
        msg!("Associated token account does not exist. Creating...");
        let ix = create_associated_token_account(
            &ctx.accounts.payer.key(),
            &ctx.accounts.recipient_wallet_account.key(),
            &ctx.accounts.usdc_mint.key(),
        );

        invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.recipient_wallet_account.to_account_info(),
                ctx.accounts.usdc_mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;
    } else {
        msg!("Associated token account already exists.");
    }

    let associated_token_account_2 = get_associated_token_address(
        &ctx.accounts.recipient_wallet_account.key(),
        &ctx.accounts.output_mint.key(),
    );

    let account_info_2 = ctx
        .remaining_accounts
        .iter()
        .find(|account| account.key == &associated_token_account_2);

    // Check if the associated token account already exists
    if account_info_2.is_none() {
        msg!("Associated token account does not exist. Creating...");
        let ix2 = create_associated_token_account(
            &ctx.accounts.payer.key(),
            &ctx.accounts.recipient_wallet_account.key(),
            &ctx.accounts.output_mint.key(),
        );

        invoke(
            &ix2,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.recipient_wallet_account.to_account_info(),
                ctx.accounts.output_mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;
    } else {
        msg!("Associated token account already exists.");
    }
    Ok(())
}
