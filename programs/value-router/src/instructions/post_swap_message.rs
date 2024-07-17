use {
    crate::state::RelayData, anchor_lang::prelude::*,
    message_transmitter::instructions::ReceiveMessageParams,
};

/*
Instruction 7: post_swap_message
 */
#[derive(Accounts)]
#[instruction(params: PostSwapDataParams)]
pub struct PostSwapData<'info> {
    #[account()]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub relay_data: Box<Account<'info, RelayData>>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PostSwapDataParams {
    swap_message: ReceiveMessageParams,
}

pub fn post_swap_message(ctx: Context<PostSwapData>, params: PostSwapDataParams) -> Result<()> {
    msg!("post_swap_message");

    ctx.accounts.relay_data.swap_message = params.swap_message;

    Ok(())
}
