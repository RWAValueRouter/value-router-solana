mod constants;
mod errors;
mod instructions;
mod jupiter;
mod state;
mod swap_message;
mod utils;

use instructions::*;

use {anchor_lang::prelude::*, solana_program::pubkey::Pubkey};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("YqDq3S2nEWMmMVSJX4NwcFyRjVMjH8wk2GMfcnGBiyd");

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

    // 5 create_relay_data
    pub fn create_relay_data(ctx: Context<CreateRelayData>) -> Result<()> {
        create_relay_data::create_relay_data(ctx)
    }

    // 6 post_bridge_message
    pub fn post_bridge_message(
        ctx: Context<PostBridgeData>,
        params: PostBridgeDataParams,
    ) -> Result<()> {
        post_bridge_message::post_bridge_message(ctx, params)
    }

    // 7 post_swap_message
    pub fn post_swap_message(ctx: Context<PostSwapData>, params: PostSwapDataParams) -> Result<()> {
        post_swap_message::post_swap_message(ctx, params)
    }

    // 8 relay
    pub fn relay<'a>(
        ctx: Context<'_, '_, '_, 'a, RelayInstruction<'a>>,
        params: RelayParams,
    ) -> Result<()> {
        relay::relay(ctx, params)
    }

    // 9 relay10_no_swap
    pub fn relay_no_swap<'a>(
        ctx: Context<'_, '_, '_, 'a, RelayNoSwapInstruction<'a>>,
        params: RelayNoSwapParams,
    ) -> Result<()> {
        relay_no_swap::relay_no_swap(ctx, params)
    }
}
