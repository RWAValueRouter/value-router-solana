use {
    crate::{
        constants,
    },
    anchor_lang::prelude::*,
    message_transmitter::{
        cpi::accounts::ReclaimEventAccountContext, instructions::ReclaimEventAccountParams,
        state::MessageTransmitter,
    },
};

/*
Instruction 11: reclaim
*/
// Instruction accounts
#[derive(Accounts)]
#[instruction(params: ReclaimEventAccountParams)]
pub struct ReclaimContext<'info> {
    // Programs
    pub message_transmitter_program:
        Program<'info, message_transmitter::program::MessageTransmitter>,

    // Program accounts
    #[account(mut)]
    pub message_transmitter: Box<Account<'info, MessageTransmitter>>,

    /// CHECK: cctp MessageSent
    #[account(mut)]
    pub message_sent_event_data: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump
        )]
    pub program_authority: UncheckedAccount<'info>,
}

pub fn reclaim(ctx: Context<ReclaimContext>, params: ReclaimEventAccountParams) -> Result<()> {
    let reclaim_accounts = Box::new(ReclaimEventAccountContext {
        payee: ctx.accounts.program_authority.to_account_info(),
        message_transmitter: ctx.accounts.message_transmitter.to_account_info(),
        message_sent_event_data: ctx.accounts.message_sent_event_data.to_account_info(),
    });

    let authority_bump = ctx.bumps.get("program_authority").unwrap().to_le_bytes();
    let authority_seeds: &[&[&[u8]]] = &[&[constants::AUTHORITY_SEED, authority_bump.as_ref()]];

    let reclaim_ctx = CpiContext::new_with_signer(
        ctx.accounts.message_transmitter_program.to_account_info(),
        *reclaim_accounts,
        authority_seeds,
    );

    message_transmitter::cpi::reclaim_event_account(reclaim_ctx, params)
}
