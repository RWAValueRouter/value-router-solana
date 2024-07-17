use {crate::state::ValueRouter, anchor_lang::prelude::*};

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
            space = 600,
            seeds = [b"value_router"],
            bump
        )]
    pub value_router: Box<Account<'info, ValueRouter>>,

    pub system_program: Program<'info, System>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct InitializeParams {}

// Instruction handler
pub fn initialize(ctx: Context<InitializeContext>, _params: InitializeParams) -> Result<()> {
    let value_router = ctx.accounts.value_router.as_mut();

    value_router.admin = ctx.accounts.payer.key();
    Ok(())
}
