use {crate::state::ValueRouter, anchor_lang::prelude::*};

/*
Instruction 2: set_value_router
 */
#[derive(Accounts)]
#[instruction(params: SetValueRouterParams)]
pub struct SetValueRouterContext<'info> {
    #[account(mut, has_one = admin)]
    pub value_router: Box<Account<'info, ValueRouter>>,
    pub admin: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct SetValueRouterParams {
    pub domain_ids: [u32; 10],
    pub bridge_fees: [u64; 10],
    pub swap_fees: [u64; 10],
    pub remote_value_router: [Pubkey; 10],
    pub fee_receiver: Pubkey,
	pub noble_caller: Pubkey,
}

pub fn set_value_router(
    ctx: Context<SetValueRouterContext>,
    _params: SetValueRouterParams,
) -> Result<()> {
    let value_router = ctx.accounts.value_router.as_mut();
    value_router.domain_ids = _params.domain_ids;
    value_router.bridge_fees = _params.bridge_fees;
    value_router.swap_fees = _params.swap_fees;
    value_router.remote_value_router = _params.remote_value_router;
    value_router.fee_receiver = _params.fee_receiver;
	value_router.noble_caller = _params.noble_caller;

    Ok(())
}
