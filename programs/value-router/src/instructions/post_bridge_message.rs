use {
    crate::state::RelayData, anchor_lang::prelude::*,
    message_transmitter::instructions::ReceiveMessageParams,
};

/*
Instruction 6: post_bridge_message
 */
#[derive(Accounts)]
#[instruction(params: PostBridgeDataParams)]
pub struct PostBridgeData<'info> {
    #[account()]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub relay_data: Box<Account<'info, RelayData>>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PostBridgeDataParams {
    bridge_message: ReceiveMessageParams,
}

pub fn post_bridge_message(
    ctx: Context<PostBridgeData>,
    params: PostBridgeDataParams,
) -> Result<()> {
    msg!("post_bridge_message");

    ctx.accounts.relay_data.bridge_message = params.bridge_message;

    Ok(())
}
