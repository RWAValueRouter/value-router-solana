use {
    crate::{constants, state::ValueRouter},
    anchor_lang::prelude::*,
    solana_program::system_program,
};

/*
Instruction 12: close_program_authority
*/
// Instruction accounts
#[derive(Accounts)]
#[instruction(params: CloseProgramAuthorityParams)]
pub struct CloseProgramAuthorityContext<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, has_one = admin)]
    pub value_router: Box<Account<'info, ValueRouter>>,

    /// CHECK:
    #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump,
            //close = admin // cannot close uncheck account with anchor annotation
        )]
    pub program_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CloseProgramAuthorityParams {}

pub fn close_program_authority(
    ctx: Context<CloseProgramAuthorityContext>,
    _params: CloseProgramAuthorityParams,
) -> Result<()> {
    let program_authority = ctx.accounts.program_authority.to_account_info();
    let admin = ctx.accounts.admin.to_account_info();

    let dest_starting_lamports = admin.lamports();
    **admin.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(program_authority.lamports())
        .unwrap();
    **program_authority.lamports.borrow_mut() = 0;

    program_authority.assign(&system_program::ID);
    Ok(program_authority.realloc(0, false)?)
}
