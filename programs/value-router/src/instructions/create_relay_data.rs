use {crate::state::RelayData, anchor_lang::prelude::*};

/*
Instruction 6: create_relay_data
 */
#[derive(Accounts)]
pub struct CreateRelayData<'info> {
    #[account(mut)]
    pub event_rent_payer: Signer<'info>,

    /// 新增：用于创建 PDA 的 swap message nonce
    pub swap_message: AccountInfo<'info>,

    #[account(
        init,
        payer = event_rent_payer,
        space = 1500,
        seeds = [
            b"relay_data",
            event_rent_payer.key().as_ref(),
            swap_message.key().as_ref(),  // 使用 swap message 账户地址作为额外种子
        ],
        bump
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
