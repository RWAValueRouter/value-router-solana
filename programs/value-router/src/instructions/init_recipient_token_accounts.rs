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

    #[account(
            init_if_needed,
            payer = payer,
            //space = 8 + 165,
            token::mint = usdc_mint,
            token::authority = recipient_wallet_account,
        )]
    pub recipient_usdc_account: Box<Account<'info, TokenAccount>>,

    #[account(
            init_if_needed,
            payer = payer,
            //space = 8 + 165,
            token::mint = output_mint,
            token::authority = recipient_wallet_account,
        )]
    pub recipient_output_token_account: Box<Account<'info, TokenAccount>>,

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
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitRecipientTokenAccountsParams {}

pub fn init_recipient_token_accounts<'a>(
    _ctx: Context<'_, '_, '_, 'a, InitRecipientTokenAccountsInstruction<'a>>,
    _params: InitRecipientTokenAccountsParams,
) -> Result<()> {
    Ok(())
}
