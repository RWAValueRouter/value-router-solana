mod constants;
mod errors;
mod instructions;
mod jupiter;
mod state;
mod swap_message;
mod utils;

use instructions::*;

use {anchor_lang::prelude::*, solana_program::pubkey::Pubkey};

use message_transmitter::instructions::ReclaimEventAccountParams;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("CDwHLVqT22JvamH6NkVpZqCQ6eKCGbmeMtFPvoh5KQCJ");

#[program]
pub mod value_router {
    use super::*;

    // 1 initialize
    pub fn initialize(ctx: Context<InitializeContext>, params: InitializeParams) -> Result<()> {
        initialize::initialize(ctx, params)
    }

    // 2 set_value_router
    pub fn set_value_router(
        ctx: Context<SetValueRouterContext>,
        params: SetValueRouterParams,
    ) -> Result<()> {
        set_value_router::set_value_router(ctx, params)
    }

    // 3 set_admin
    pub fn set_admin(ctx: Context<SetAdminContext>, params: SetAdminParams) -> Result<()> {
        set_admin::set_admin(ctx, params)
    }

    // 4 swap_and_bridge
    pub fn swap_and_bridge(
        ctx: Context<SwapAndBridgeInstruction>,
        params: SwapAndBridgeParams,
    ) -> Result<()> {
        swap_and_bridge::swap_and_bridge(ctx, params)
    }

    // 5 swap_and_bridge_share_event_account
    pub fn swap_and_bridge_share_event_accounts(
        ctx: Context<SwapAndBridgeShareEventAccountsInstruction>,
        params: SwapAndBridgeParams,
    ) -> Result<()> {
        swap_and_bridge_share_event_accounts::swap_and_bridge_share_event_accounts(ctx, params)
    }

    // 6 create_relay_data
    pub fn create_relay_data(ctx: Context<CreateRelayData>) -> Result<()> {
        create_relay_data::create_relay_data(ctx)
    }

    // 7 post_bridge_message
    pub fn post_bridge_message(
        ctx: Context<PostBridgeData>,
        params: PostBridgeDataParams,
    ) -> Result<()> {
        post_bridge_message::post_bridge_message(ctx, params)
    }

    // 8 post_swap_message
    pub fn post_swap_message(ctx: Context<PostSwapData>, params: PostSwapDataParams) -> Result<()> {
        post_swap_message::post_swap_message(ctx, params)
    }

    // 9 relay
    pub fn relay<'a>(
        ctx: Context<'_, '_, '_, 'a, RelayInstruction<'a>>,
        params: RelayParams,
    ) -> Result<()> {
        relay::relay(ctx, params)
    }

    // 10 relay_no_swap
    pub fn relay_no_swap<'a>(
        ctx: Context<'_, '_, '_, 'a, RelayNoSwapInstruction<'a>>,
        params: RelayNoSwapParams,
    ) -> Result<()> {
        relay_no_swap::relay_no_swap(ctx, params)
    }

    // 11 reclaim
    pub fn reclaim<'a>(
        ctx: Context<'_, '_, '_, 'a, ReclaimContext<'a>>,
        params: ReclaimEventAccountParams,
    ) -> Result<()> {
        reclaim::reclaim(ctx, params)
    }

    // 12 close_program_authority
    pub fn close_program_authority<'a>(
        ctx: Context<'_, '_, '_, 'a, CloseProgramAuthorityContext<'a>>,
        params: CloseProgramAuthorityParams,
    ) -> Result<()> {
        close_program_authority::close_program_authority(ctx, params)
    }
}
