use {crate::state::ValueRouter, anchor_lang::prelude::*};

/*
Instruction 3: set_admin
*/
#[derive(Accounts)]
#[instruction(params: SetAdminParams)]
pub struct SetAdminContext<'info> {
    #[account(mut, has_one = admin)]
    pub value_router: Box<Account<'info, ValueRouter>>,
    pub admin: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct SetAdminParams {
    pub admin: Pubkey,
}

pub fn set_admin(ctx: Context<SetAdminContext>, _params: SetAdminParams) -> Result<()> {
    let value_router = ctx.accounts.value_router.as_mut();
    value_router.admin = _params.admin;

    Ok(())
}
