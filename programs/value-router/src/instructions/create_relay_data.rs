use {crate::state::RelayData, anchor_lang::prelude::*};

/*
Instruction 6: create_relay_data
 */
#[derive(Accounts)]
pub struct CreateRelayData<'info> {
    #[account(mut)]
    pub event_rent_payer: Signer<'info>,

    #[account(
            init,
            payer = event_rent_payer,
            space = 1500,
        )]
    pub relay_data: Box<Account<'info, RelayData>>,

    pub system_program: Program<'info, System>,
}

pub fn create_relay_data(ctx: Context<CreateRelayData>) -> Result<()> {
    msg!(
        "create relay data account: {:?}",
        ctx.accounts.relay_data.to_account_info()
    );
    Ok(())
}
