declare_id!("5XoeLoER5SFFcGeFsvEa4a4QyEZXgCEWTFhESS43ExLX");

use {anchor_lang::prelude::*, message_transmitter::instructions::HandleReceiveMessageParams};

#[program]
pub mod cctp_message_receiver {
    use super::*;

    #[event_cpi]
    #[derive(Accounts)]
    #[instruction(params: HandleReceiveMessageParams)]
    pub struct HandleReceiveMessageContext<'info> {
        #[account(
            seeds = [b"message_transmitter_authority", crate::ID.as_ref()],
            bump = params.authority_bump,
            seeds::program = message_transmitter::ID
        )]
        pub authority_pda: Signer<'info>,
    }

    // Instruction handler
    pub fn handle_receive_message(
        _ctx: Context<HandleReceiveMessageContext>,
        params: HandleReceiveMessageParams,
    ) -> Result<()> {
        msg!(
            "cctp_message_receiver: receive message {:?}, {:?}, {:?}, {:?}",
            params.remote_domain,
            params.sender,
            params.message_body,
            params.authority_bump
        );

        Ok(())
    }
}
