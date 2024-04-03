mod state;

use {
    crate::state::{RelayData, ValueRouter},
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, Token, TokenAccount},
    message_transmitter::{
        cpi::accounts::{ReceiveMessageContext, SendMessageContext},
        instructions::{
            HandleReceiveMessageParams, ReceiveMessageParams, SendMessageWithCallerParams,
        },
        state::{MessageTransmitter, UsedNonces},
    },
    token_messenger_minter::{
        cpi::accounts::DepositForBurnContext,
        program::TokenMessengerMinter,
        token_messenger::{
            instructions::DepositForBurnWithCallerParams,
            state::{RemoteTokenMessenger, TokenMessenger},
        },
        token_minter::state::{LocalToken, TokenMinter},
    },
};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("97jJVm6gLtNFa6r2ocKrp8WbF7SzKvtHjWPMFhvVEo1p");

#[program]
#[feature(const_trait_impl)]
pub mod value_router {
    use super::*;

    /*
    Instruction 1: initialize
     */
    // Instruction accounts
    #[derive(Accounts)]
    #[instruction(params: InitializeParams)]
    pub struct InitializeContext<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,

        /// CHECK: empty PDA
        #[account(
        seeds = [b"sender_authority"],
        bump
    )]
        pub authority_pda: UncheckedAccount<'info>,

        #[account(
            init_if_needed,
            payer = payer,
            space = 10,
            seeds = [b"value_router"],
            bump
        )]
        pub value_router: Box<Account<'info, ValueRouter>>,

        pub system_program: Program<'info, System>,
    }

    // Instruction parameters
    #[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
    pub struct InitializeParams {}

    // Instruction handler
    pub fn initialize(ctx: Context<InitializeContext>, _params: InitializeParams) -> Result<()> {
        let value_router = ctx.accounts.value_router.as_mut();
        value_router.authority_bump = *ctx
            .bumps
            .get("authority_pda")
            .ok_or(ProgramError::InvalidSeeds)?;

        Ok(())
    }

    /*
    Instruction 2: SwapAndBridge
     */
    // Instruction accounts
    #[derive(Accounts)]
    #[instruction(params: SwapAndBridgeParams)]
    pub struct SwapAndBridgeInstruction<'info> {
        // Signers
        #[account()]
        pub payer: Signer<'info>,

        #[account(mut)]
        pub event_rent_payer: Signer<'info>,

        // Programs
        pub message_transmitter_program:
            Program<'info, message_transmitter::program::MessageTransmitter>,

        pub token_messenger_minter_program: Program<'info, TokenMessengerMinter>,

        pub token_program: Program<'info, Token>,

        pub value_router_program: Program<'info, program::ValueRouter>,

        pub system_program: Program<'info, System>,

        // Program accounts
        #[account(mut)]
        pub message_transmitter: Box<Account<'info, MessageTransmitter>>,

        #[account(mut)]
        pub token_messenger: Box<Account<'info, TokenMessenger>>,

        #[account(mut)]
        pub token_minter: Box<Account<'info, TokenMinter>>,

        #[account(mut)]
        pub value_router: Box<Account<'info, ValueRouter>>,

        // Pdas
        /// CHECK: empty PDA
        pub sender_authority_pda: UncheckedAccount<'info>,

        /// CHECK: empty PDA
        #[account(
            seeds = [b"sender_authority"],
            bump = value_router.authority_bump,
        )]
        pub sender_authority_pda_2: UncheckedAccount<'info>,

        // other
        #[account(mut)]
        pub message_sent_event_data_1: Signer<'info>,

        #[account(mut)]
        pub message_sent_event_data_2: Signer<'info>,

        #[account()]
        pub payer_input_ata: Account<'info, TokenAccount>,

        #[account(mut)]
        pub payer_usdc_ata: Account<'info, TokenAccount>,

        #[account()]
        pub remote_token_messenger: Box<Account<'info, RemoteTokenMessenger>>,

        #[account(mut)]
        pub local_token: Box<Account<'info, LocalToken>>,

        #[account(mut)]
        pub burn_token_mint: Box<Account<'info, Mint>>,

        /// CHECK:
        pub remote_value_router: UncheckedAccount<'info>,

        /// CHECK:
        #[account()]
        pub event_authority: UncheckedAccount<'info>,
    }

    #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
    pub struct BuyArgs {
        pub buy_token: Pubkey,
        pub guaranteed_buy_amount: Vec<u8>,
    }

    // Instruction parameters
    #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
    pub struct SwapAndBridgeParams {
        //pub jupiter_sell_params: Route,
        pub buy_args: BuyArgs,
        pub sell_usdc_amount: u64,
        pub dest_domain: u32,
        pub recipient: Pubkey,
    }

    #[derive(Clone, Debug)]
    pub struct SwapMessage<'a> {
        data: &'a [u8],
    }

    impl<'a> SwapMessage<'a> {
        const SWAP_MESSAGE_LEN: usize = 164;
        const VERSION_INDEX: usize = 0;
        const BRIDGE_NONCE_HASH_INDEX: usize = 4;
        const SELL_AMOUNT_INDEX: usize = 36;
        const BUY_TOKEN_INDEX: usize = 68;
        const GUARANTEED_BUY_AMOUNT_INDEX: usize = 100;
        const RECIPIENT_INDEX: usize = 132;
        const AMOUNT_OFFSET: usize = 24;

        pub fn new(_expected_version: u32, message_bytes: &'a [u8]) -> Result<Self> {
            let message = Self {
                data: message_bytes,
            };
            Ok(message)
        }

        #[allow(clippy::too_many_arguments)]
        pub fn format_message(
            version: u32,
            bridge_nonce_hash: Vec<u8>,
            sell_amount: u64,
            buy_token: &Pubkey,
            guaranteed_buy_amount: Vec<u8>, // uint256 as bytes32
            recipient: &Pubkey,
        ) -> Result<Vec<u8>> {
            let mut output = vec![0; Self::SWAP_MESSAGE_LEN];

            output[Self::VERSION_INDEX..Self::BRIDGE_NONCE_HASH_INDEX]
                .copy_from_slice(&version.to_be_bytes());

            output[Self::BRIDGE_NONCE_HASH_INDEX..Self::SELL_AMOUNT_INDEX]
                .copy_from_slice(bridge_nonce_hash.as_ref());

            output[Self::SELL_AMOUNT_INDEX + Self::AMOUNT_OFFSET..Self::BUY_TOKEN_INDEX]
                .copy_from_slice(&sell_amount.to_be_bytes());

            output[(Self::BUY_TOKEN_INDEX)..Self::GUARANTEED_BUY_AMOUNT_INDEX]
                .copy_from_slice(buy_token.as_ref());

            output[Self::GUARANTEED_BUY_AMOUNT_INDEX..Self::RECIPIENT_INDEX]
                .copy_from_slice(guaranteed_buy_amount.as_ref());

            output[Self::RECIPIENT_INDEX..Self::SWAP_MESSAGE_LEN]
                .copy_from_slice(recipient.as_ref());

            Ok(output)
        }
    }

    pub fn swap_and_bridge(
        ctx: Context<SwapAndBridgeInstruction>,
        params: SwapAndBridgeParams,
    ) -> Result<()> {
        msg!("swap_and_bridge");
        let message_transmitter = &ctx.accounts.message_transmitter;

        /*
        let swap_ix = Instruction {
            program_id: jupiter_cpi::ID,
            accounts: jupiter_cpi::cpi::accounts::Route {
                token_program: anchor_spl::token::ID,
            },
            data: params.jupiter_sell_params.data(),
        };

        program::invoke_signed(
            &swap_ix,
            &[
                &[ctx.accounts.authority_pda.to_account_info()],
                ctx.remaining_accounts,
            ]
            .concat(),
            authority_seeds,
        )?;
        */

        // cpi depositForBurnWithCaller
        let deposit_for_burn_accounts = DepositForBurnContext {
            owner: ctx.accounts.payer.clone().to_account_info(),
            event_rent_payer: ctx.accounts.event_rent_payer.clone().to_account_info(),
            sender_authority_pda: ctx.accounts.sender_authority_pda.to_account_info(),
            burn_token_account: ctx.accounts.payer_usdc_ata.to_account_info(),
            message_transmitter: message_transmitter.clone().to_account_info(),
            token_messenger: ctx.accounts.token_messenger.to_account_info(),
            remote_token_messenger: ctx.accounts.remote_token_messenger.to_account_info(),
            token_minter: ctx.accounts.token_minter.to_account_info(),
            local_token: ctx.accounts.local_token.to_account_info(),
            burn_token_mint: ctx.accounts.burn_token_mint.to_account_info(),
            message_sent_event_data: ctx
                .accounts
                .message_sent_event_data_1
                .clone()
                .to_account_info(),
            message_transmitter_program: ctx.accounts.message_transmitter_program.to_account_info(),
            token_messenger_minter_program: ctx
                .accounts
                .token_messenger_minter_program
                .clone()
                .to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            system_program: ctx.accounts.system_program.clone().to_account_info(),
            event_authority: ctx.accounts.event_authority.to_account_info(),
            program: ctx.accounts.value_router_program.to_account_info(),
        };

        let deposit_for_burn_params = DepositForBurnWithCallerParams {
            amount: params.sell_usdc_amount,
            destination_domain: params.dest_domain,
            mint_recipient: *ctx
                .accounts
                .remote_value_router
                .clone()
                .to_account_info()
                .key,
            destination_caller: *ctx
                .accounts
                .remote_value_router
                .clone()
                .to_account_info()
                .key,
        };

        let deposit_for_burn_ctx = CpiContext::new(
            ctx.accounts
                .token_messenger_minter_program
                .clone()
                .to_account_info(),
            deposit_for_burn_accounts,
        );

        msg!("swap_and_bridge: cpi deposit_for_burn_with_caller");

        let nonce = token_messenger_minter::cpi::deposit_for_burn_with_caller(
            deposit_for_burn_ctx,
            deposit_for_burn_params,
        )?
        .get();

        msg!("bridge nonce: {:?}", nonce);

        //let nonce: u64 = 6677;

        // solidity: bytes32 bridgeNonceHash = keccak256(abi.encodePacked(5, bridgeNonce))
        let localdomain: u32 = 5;
        let mut encoded_data = Vec::with_capacity(36);
        encoded_data.extend_from_slice(&localdomain.to_le_bytes());
        encoded_data.extend_from_slice(&nonce.to_le_bytes());
        let bridge_nonce_hash: [u8; 32] =
            anchor_lang::solana_program::keccak::hash(encoded_data.as_slice()).to_bytes();

        // build swap message
        msg!("swap_and_bridge: build message_body");

        let message_body = SwapMessage::format_message(
            1u32,
            bridge_nonce_hash.to_vec(),
            params.sell_usdc_amount, // TODO usdc amount
            &params.buy_args.buy_token,
            params.buy_args.guaranteed_buy_amount,
            &params.recipient,
        )?;

        msg!("swap_and_bridge: message_body: {:?}", message_body);

        msg!("swap_and_bridge: build send_message_accounts");

        // cpi sendMessageWithCaller
        let send_message_accounts = SendMessageContext {
            event_rent_payer: ctx.accounts.event_rent_payer.to_account_info(),
            sender_authority_pda: ctx.accounts.sender_authority_pda_2.to_account_info(),
            message_transmitter: message_transmitter.clone().to_account_info(),
            message_sent_event_data: ctx.accounts.message_sent_event_data_2.to_account_info(),
            sender_program: ctx.accounts.value_router_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        msg!("swap_and_bridge: build send_message_params");

        let send_message_params = SendMessageWithCallerParams {
            destination_domain: params.dest_domain,
            recipient: params.recipient,
            message_body: message_body,
            destination_caller: *ctx.accounts.remote_value_router.to_account_info().key,
        };

        let authority_seeds: &[&[&[u8]]] = &[&[
            b"sender_authority",
            &[ctx.accounts.value_router.authority_bump],
        ]];

        msg!("swap_and_bridge: build send_message_ctx");

        let send_message_ctx = CpiContext::new_with_signer(
            message_transmitter.to_account_info(),
            send_message_accounts,
            authority_seeds,
        );

        msg!("swap_and_bridge: cpi send_message_with_caller");

        let nonce2 = message_transmitter::cpi::send_message_with_caller(
            send_message_ctx,
            send_message_params,
        )?
        .get();

        msg!("send message nonce: {:?}", nonce2);

        Ok(())
    }

    /*
    Instruction 3: create_relay_data
     */
    #[derive(Accounts)]
    pub struct CreateRelayData<'info> {
        #[account(mut)]
        pub event_rent_payer: Signer<'info>,

        // TODO use pda
        #[account(
            init,
            payer = event_rent_payer,
            space = 1500,
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

    /*
    Instruction 4: post_bridge_message
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

    /*
    Instruction 5: post_swap_message
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

    // TODO reclaim

    /*
    Instruction 6: relay
     */
    // Instruction accounts
    #[derive(Accounts)]
    pub struct RelayInstruction<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,

        #[account()]
        pub caller: Signer<'info>,

        /// CHECK: empty PDA, used to check that handleReceiveMessage was called by MessageTransmitter
        #[account()]
        pub authority_pda: UncheckedAccount<'info>,

        pub message_transmitter_program:
            Program<'info, message_transmitter::program::MessageTransmitter>,

        #[account()]
        pub message_transmitter: Box<Account<'info, MessageTransmitter>>,

        // Used nonces state, see UsedNonces struct for more details
        /// CHECK:
        #[account(mut)]
        pub used_nonces: Box<Account<'info, UsedNonces>>,

        pub token_messenger_minter_program: Program<'info, TokenMessengerMinter>,

        pub value_router_program: Program<'info, program::ValueRouter>,

        pub token_program: Program<'info, Token>,

        pub system_program: Program<'info, System>,

        /// CHECK: unsafe
        #[account()]
        pub message_transmitter_event_authority: UncheckedAccount<'info>,
        // remaining accounts: additional accounts to be passed to the receiver
        #[account()]
        pub relay_params: Box<Account<'info, RelayData>>,

        #[account(mut)]
        pub usdc_vault: Account<'info, TokenAccount>,
    }

    pub fn relay(ctx: Context<RelayInstruction>) -> Result<()> {
        /// 注意
        /// relay_params 账户此时已经保存了 bridge message 和 swap message
        /// 这个函数会通过 cpi 调用 messager transmitter program 的 receive_message 指令
        /// 接受 bridge message 和 swap message.
        /// receive_message 会验证 attestation，然后回调 receiver 的 handle_receive_message 指令.
        ///
        /// bridge message 的 receiver 是 token messenger mint program.
        /// swap message 的 receiver 是 value router program.
        ///
        /// 在正式的设计中，bridge message body 中的参数 recipient 是一个受 value_router program 控制的 usdc associated token account.
        /// value router 将根据 swap message body 的内容进行后续处理.
        ///
        /// 在当前的版本中，bridge message body 中的 recipient 是用户的 usdc associated token account.
        /// receive bridge message 将导致 usdc 直接 mint 到用户的账户上.
        ///
        /// swap message 在这个版本中会被接受、验证，但不会进行处理.
        ///
        /// 这个版本的 program 要和 solana-dev 版的 evm valueRouter 合约配合使用.
        ///
        /// It is asserting the relay_params account is storing the bridge message and swap message.
        ///
        /// This function will invoke the `receive_message` instruction of the messager transmitter program through CPI.
        /// It will receive the bridge message and swap message.
        /// The `receive_message` operation will validate the attestation and then callback the `handle_receive_message` instruction of the receiver.
        ///
        /// Notice
        /// The receiver for the bridge message is the token messenger mint program.
        /// The receiver for the swap message is the value router program.
        ///
        /// According to our design, the recipient parameter in the bridge message body is a USDC associated token account controlled by the value_router program.
        /// The value router will proceed with further processing based on the content of the swap message body.
        ///
        /// BUT in this version, the recipient in the bridge message body is the user's USDC associated token account.
        /// Receiving the bridge message will result in USDC being minted directly to the user's account.
        ///
        /// The swap message will be received, validated, but not processed in this version.
        ///
        /// This version of the program is intended to be used with the solana-dev version of the EVM valueRouter contract.

        msg!("relay: {:?}", ctx.accounts.relay_params);

        let message_transmitter = ctx.accounts.message_transmitter.clone().to_account_info();

        let accounts_1 = ReceiveMessageContext {
            payer: ctx.accounts.payer.to_account_info(),
            caller: ctx.accounts.caller.to_account_info(),
            authority_pda: ctx.accounts.authority_pda.to_account_info(),
            message_transmitter: message_transmitter.clone(),
            used_nonces: ctx.accounts.used_nonces.to_account_info(),
            receiver: ctx
                .accounts
                .token_messenger_minter_program
                .to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            event_authority: ctx
                .accounts
                .message_transmitter_event_authority
                .to_account_info(),
            program: ctx.accounts.value_router_program.to_account_info(),
        };

        let cpi_ctx_1 = CpiContext::new(message_transmitter.clone(), accounts_1);

        message_transmitter::cpi::receive_message(
            cpi_ctx_1,
            ctx.accounts.relay_params.bridge_message.clone(),
        )?;
        msg!("receive bridge msg success");

        // check usdc balance change of usdc_vault;

        // check received
        let accounts_2 = ReceiveMessageContext {
            payer: ctx.accounts.payer.to_account_info(),
            caller: ctx.accounts.caller.to_account_info(),
            authority_pda: ctx.accounts.authority_pda.to_account_info(),
            message_transmitter: message_transmitter.clone(),
            used_nonces: ctx.accounts.used_nonces.to_account_info(),
            receiver: ctx.accounts.value_router_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            event_authority: ctx
                .accounts
                .message_transmitter_event_authority
                .to_account_info(),
            program: ctx.accounts.value_router_program.to_account_info(),
        };

        let cpi_ctx_2 = CpiContext::new(message_transmitter, accounts_2);

        message_transmitter::cpi::receive_message(
            cpi_ctx_2,
            ctx.accounts.relay_params.swap_message.clone(),
        )?;
        msg!("receive swap msg success");

        // do nothing
        // TODO

        // decode message

        // do swap

        // check swap result

        // send to recipient

        Ok(())
    }

    /*
    Instruction 7: HandleReceiveMessage
     */
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
        // TODO
        /*require_eq!(
            params.sender,
            remote_value_router,
            InvalidRemoteValueRouter
        );*/

        Ok(())
    }
}
