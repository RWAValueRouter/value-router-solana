declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

use {
    anchor_lang::prelude::*,
    message_transmitter::{
        cpi::accounts::ReceiveMessageContext,
        instructions::{HandleReceiveMessageParams, ReceiveMessageParams},
    },
};

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
        /*#[account(
            constraint = params.remote_domain == remote_value_router.domain
        )]
        pub remote_value_router: Box<Account<'info, RemoteTokenMessenger>>,*/
    }

    // Instruction handler
    pub fn handle_receive_message(
        _ctx: Context<HandleReceiveMessageContext>,
        params: HandleReceiveMessageParams,
    ) -> Result<()> {
        // TODO params.sender == remote_value_router
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
