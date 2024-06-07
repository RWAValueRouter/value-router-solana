mod constants;
mod errors;
mod jupiter;
mod state;
mod swap_message;
mod utils;

use {
    crate::{
        errors::ErrorCode,
        jupiter::{swap_on_jupiter, Jupiter},
        state::{RelayData, SwapAndBridgeEvent, ValueRouter},
        swap_message::SwapMessage,
    },
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
        token_minter::state::{LocalToken, TokenMinter, TokenPair},
    },
};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("CW9pxGKBLCHwPVPhKort1aUbhawPhFDynSqu3HD8BxRw");

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

        pub token_program: Program<'info, Token>,
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
        #[account(mut)]
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
        pub remote_token_messenger: Box<Account<'info, RemoteTokenMessenger>>,

        #[account(mut)]
        pub local_token: Box<Account<'info, LocalToken>>,

        /// CHECK: usdc mint
        #[account(mut)]
        pub burn_token_mint: UncheckedAccount<'info>,

        /// CHECK:
        pub remote_value_router: UncheckedAccount<'info>,

        /// CHECK:
        #[account()]
        pub event_authority: UncheckedAccount<'info>,

        /// CHECK:
        #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump
        )]
        pub program_authority: UncheckedAccount<'info>,

        /// Program usdc token account
        /// CHECK:
        #[account(
            mut,
            seeds = [constants::USDC_SEED],
            bump
        )]
        pub program_usdc_account: UncheckedAccount<'info>,

        pub source_mint: Box<Account<'info, Mint>>,

        pub jupiter_program: Program<'info, Jupiter>,
    }

    #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
    pub struct BuyArgs {
        pub buy_token: Pubkey,
        pub guaranteed_buy_amount: Vec<u8>,
    }

    // Instruction parameters
    #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
    pub struct SwapAndBridgeParams {
        pub jupiter_swap_data: Vec<u8>,
        pub buy_args: BuyArgs,
        pub bridge_usdc_amount: u64,
        pub dest_domain: u32,
        pub recipient: Pubkey,
    }

    pub fn swap_and_bridge(
        ctx: Context<SwapAndBridgeInstruction>,
        params: SwapAndBridgeParams,
    ) -> Result<()> {
        msg!("valuerouter: swap_and_bridge");
        let message_transmitter = &ctx.accounts.message_transmitter;

        let authority_bump = ctx.bumps.get("program_authority").unwrap().to_le_bytes();
        let usdc_bump = ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes();

        let mut flagLocalSwap = false;
        let mut final_balance: u64 = 0;
        if ctx.accounts.source_mint.clone().key() != ctx.accounts.burn_token_mint.key() {
            msg!("valuerouter: handling local swap");
            flagLocalSwap = true;
            msg!(
                "valuerouter: program_authority: {:?}",
                ctx.accounts.program_authority.clone().to_account_info()
            );
            msg!(
                "valuerouter: program_usdc_account: {:?}",
                ctx.accounts.program_usdc_account.clone().to_account_info()
            );
            let out_mint: Account<Mint> = Account::try_from(&ctx.accounts.burn_token_mint)?;
            let initial_program_usdc_account = utils::create_usdc_token_idempotent(
                ctx.accounts.program_authority.clone(),
                ctx.accounts.program_usdc_account.clone(),
                Box::new(out_mint),
                ctx.accounts.token_program.clone(),
                ctx.accounts.system_program.clone(),
                &authority_bump,
                &usdc_bump,
            )?;

            msg!(
                "valuerouter: initial_program_usdc_account: {:?}",
                initial_program_usdc_account
            );

            msg!("valuerouter: swap on jupiter");
            swap_on_jupiter(
                ctx.remaining_accounts,
                ctx.accounts.jupiter_program.clone(),
                params.jupiter_swap_data,
            )?;

            //let final_token_account_data = ctx.accounts.program_usdc_account.try_borrow_data()?;
            let final_program_usdc_account = TokenAccount::try_deserialize(
                &mut ctx
                    .accounts
                    .program_usdc_account
                    .try_borrow_data()?
                    .as_ref(),
            )?;

            final_balance = final_program_usdc_account.amount;
            msg!("valuerouter: swap output {:?}", final_balance);
            assert!(
                final_program_usdc_account.amount >= params.bridge_usdc_amount,
                "value_router: no enough swap output"
            );
        } else {
            msg!("valuerouter: no local swap");
            final_balance = params.bridge_usdc_amount;
        }

        // cpi depositForBurnWithCaller
        let deposit_for_burn_accounts = DepositForBurnContext {
            owner: ctx.accounts.program_authority.to_account_info(),
            event_rent_payer: ctx.accounts.event_rent_payer.clone().to_account_info(),
            sender_authority_pda: ctx.accounts.sender_authority_pda.to_account_info(),
            burn_token_account: ctx.accounts.program_usdc_account.clone().to_account_info(),
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
            amount: final_balance,
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

        let signer_seeds: &[&[&[u8]]] = &[&[constants::AUTHORITY_SEED, authority_bump.as_ref()]];

        let deposit_for_burn_ctx = CpiContext::new_with_signer(
            ctx.accounts
                .token_messenger_minter_program
                .clone()
                .to_account_info(),
            deposit_for_burn_accounts,
            signer_seeds,
        );

        msg!("swap_and_bridge: cpi deposit_for_burn_with_caller");

        let nonce = token_messenger_minter::cpi::deposit_for_burn_with_caller(
            deposit_for_burn_ctx,
            deposit_for_burn_params,
        )?
        .get();

        msg!("bridge nonce: {:?}", nonce);

        msg!("closing program usdc account");
        if flagLocalSwap {
            utils::close_program_usdc(
                ctx.accounts.program_authority.clone(),
                ctx.accounts.program_usdc_account.clone(),
                ctx.accounts.token_program.clone(),
                &authority_bump,
            )?;
        }
        msg!("program usdc account closed");

        //let nonce: u64 = 6677;

        // solidity: bytes32 bridgeNonceHash = keccak256(abi.encodePacked(5, bridgeNonce))
        let localdomain: u32 = 5;
        let localdomain_bytes = localdomain.to_be_bytes();
        let nonce_bytes = nonce.to_be_bytes();

        let mut encoded_data = vec![0; 12];
        encoded_data[..4].copy_from_slice(&localdomain_bytes);
        encoded_data[4..].copy_from_slice(&nonce_bytes);
        msg!("encoded_data: {:?}", encoded_data);
        // 00 00 00 05 00 00 00 00 00 00 00 01
        // [00, 00, 00, 05, 00, 00, 00, 00, 00, 00, 00, 01]
        let bridge_nonce_hash: [u8; 32] =
            anchor_lang::solana_program::keccak::hash(encoded_data.as_slice()).to_bytes();
        msg!("bridge_nonce_hash: {:?}", bridge_nonce_hash);

        // build swap message
        msg!("swap_and_bridge: build message_body");

        let message_body = SwapMessage::format_message(
            1u32,
            bridge_nonce_hash.to_vec(),
            final_balance,
            &params.buy_args.buy_token,
            params.buy_args.guaranteed_buy_amount.clone(),
            &params.recipient.clone(),
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
            recipient: *ctx.accounts.remote_value_router.to_account_info().key,
            message_body: message_body,
            destination_caller: *ctx.accounts.remote_value_router.to_account_info().key,
        };

        let authority_seeds: &[&[&[u8]]] = &[&[
            b"sender_authority",
            &[ctx.accounts.value_router.authority_bump],
        ]];

        msg!("swap_and_bridge: build send_message_ctx");

        let send_message_ctx = CpiContext::new_with_signer(
            ctx.accounts.message_transmitter_program.to_account_info(),
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

        emit!(SwapAndBridgeEvent {
            bridge_usdc_amount: final_balance,
            buy_token: params.buy_args.buy_token,
            guaranteed_buy_amount: params.buy_args.guaranteed_buy_amount,
            dest_domain: params.dest_domain,
            recipient: params.recipient.clone(),
            bridge_nonce: nonce,
            swap_nonce: nonce2,
        });

        Ok(())
    }

    /*
    Instruction 3: create_relay_data
     */
    #[derive(Accounts)]
    pub struct CreateRelayData<'info> {
        #[account(mut)]
        pub event_rent_payer: Signer<'info>,

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
    Instruction 6: relay_bridge
     */
    // Instruction accounts
    #[derive(Accounts)]
    #[instruction(params: RelayBridgeParams)]
    pub struct RelayBridgeInstruction<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,

        /// CHECK:
        #[account(
            mut,
            seeds = [constants::CCTP_CALLER_SEED],
            bump
        )]
        pub caller: UncheckedAccount<'info>,

        /// CHECK: token messenger authority pda
        #[account()]
        pub tm_authority_pda: UncheckedAccount<'info>,

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

        /// CHECK: unsafe
        #[account()]
        pub token_messenger_event_authority: UncheckedAccount<'info>,
        // remaining accounts: additional accounts to be passed to the receiver
        #[account()]
        pub relay_params: Box<Account<'info, RelayData>>,

        pub token_messenger: Box<Account<'info, TokenMessenger>>,

        pub remote_token_messenger: Box<Account<'info, RemoteTokenMessenger>>,

        pub token_minter: Box<Account<'info, TokenMinter>>,

        #[account(mut)]
        pub local_token: Box<Account<'info, LocalToken>>,

        pub token_pair: Box<Account<'info, TokenPair>>,

        #[account(mut)]
        pub custody_token_account: Box<Account<'info, TokenAccount>>,

        /// Program usdc token account
        /// CHECK:
        #[account(
            mut,
            seeds = [constants::USDC_IN_SEED],
            bump
        )]
        pub program_usdc_account: UncheckedAccount<'info>,

        /// CHECK: usdc mint
        #[account(mut)]
        pub usdc_mint: UncheckedAccount<'info>,

        /// CHECK:
        #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump
        )]
        pub program_authority: UncheckedAccount<'info>,
    }

    // Instruction parameters
    #[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
    pub struct RelayBridgeParams {}

    pub fn relay_bridge<'a>(
        ctx: Context<'_, '_, '_, 'a, RelayBridgeInstruction<'a>>,
        params: RelayBridgeParams,
    ) -> Result<()> {
        msg!("relay-1");

        require!(
            ctx.accounts.program_usdc_account.data_is_empty(),
            ErrorCode::USDCInAccountNotClosed
        );

        utils::create_usdc_token_idempotent(
            ctx.accounts.program_authority.clone(),
            ctx.accounts.program_usdc_account.clone(),
            Box::new(Account::try_from(&ctx.accounts.usdc_mint)?),
            ctx.accounts.token_program.clone(),
            ctx.accounts.system_program.clone(),
            &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
            &ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes(),
        )?;

        let accounts_1 = ReceiveMessageContext {
            payer: ctx.accounts.payer.to_account_info(),
            caller: ctx.accounts.caller.to_account_info(),
            authority_pda: ctx.accounts.tm_authority_pda.to_account_info(),
            message_transmitter: ctx.accounts.message_transmitter.clone().to_account_info(),
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

        let remaining: Vec<AccountInfo> = [
            ctx.accounts.token_messenger.to_account_info(),
            ctx.accounts.remote_token_messenger.to_account_info(),
            ctx.accounts.token_minter.to_account_info(),
            ctx.accounts.local_token.to_account_info(),
            ctx.accounts.token_pair.to_account_info(),
            ctx.accounts.program_usdc_account.to_account_info(),
            ctx.accounts.custody_token_account.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts
                .token_messenger_event_authority
                .to_account_info(),
            ctx.accounts
                .token_messenger_minter_program
                .to_account_info(),
            ctx.accounts.message_transmitter_program.to_account_info(),
        ]
        .to_vec();

        let seeds: &[&[&[u8]]] = &[&[
            constants::CCTP_CALLER_SEED,
            &[*ctx.bumps.get("caller").unwrap()],
        ]];

        let cpi_ctx_1 = CpiContext::new_with_signer(
            ctx.accounts
                .message_transmitter_program
                .clone()
                .to_account_info(),
            accounts_1,
            seeds,
        )
        .with_remaining_accounts(remaining);

        message_transmitter::cpi::receive_message(
            cpi_ctx_1,
            ctx.accounts.relay_params.bridge_message.clone(),
        )?;
        msg!("receive bridge msg success");

        Ok(())
    }

    /*
    Instruction 7: relay_swap
     */
    // Instruction accounts
    #[derive(Accounts)]
    #[instruction(params: RelaySwapParams)]
    pub struct RelaySwapInstruction<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,

        /// CHECK:
        #[account(
            mut,
            seeds = [constants::CCTP_CALLER_SEED],
            bump
        )]
        pub caller: UncheckedAccount<'info>,

        /// CHECK: value router authority pda
        #[account()]
        pub vr_authority_pda: UncheckedAccount<'info>,

        pub message_transmitter_program:
            Program<'info, message_transmitter::program::MessageTransmitter>,

        #[account()]
        pub message_transmitter: Box<Account<'info, MessageTransmitter>>,

        // Used nonces state, see UsedNonces struct for more details
        /// CHECK:
        #[account(mut)]
        pub used_nonces: Box<Account<'info, UsedNonces>>,

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
        pub recipient_token_account: Box<Account<'info, TokenAccount>>,

        /// Program usdc token account
        /// CHECK:
        #[account(
            mut,
            seeds = [constants::USDC_IN_SEED],
            bump
        )]
        pub program_usdc_account: UncheckedAccount<'info>,

        /// CHECK: usdc mint
        #[account(mut)]
        pub usdc_mint: UncheckedAccount<'info>,

        /// CHECK:
        #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump
        )]
        pub program_authority: UncheckedAccount<'info>,

        pub jupiter_program: Program<'info, Jupiter>,
    }

    // Instruction parameters
    #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
    pub struct RelaySwapParams {
        pub jupiter_swap_data: Vec<u8>,
    }

    pub fn relay_swap<'a>(
        ctx: Context<'_, '_, '_, 'a, RelaySwapInstruction<'a>>,
        params: RelaySwapParams,
    ) -> Result<()> {
        msg!("relay-2");

        // check usdc balance change of usdc_vault;
        //let token_account_data = ctx.accounts.program_usdc_account.try_borrow_data()?;
        let usdc_balance = TokenAccount::try_deserialize(
            &mut ctx
                .accounts
                .program_usdc_account
                .try_borrow_data()?
                .as_ref(),
        )?
        .amount;

        let accounts_2 = ReceiveMessageContext {
            payer: ctx.accounts.payer.to_account_info(),
            caller: ctx.accounts.caller.to_account_info(),
            authority_pda: ctx.accounts.vr_authority_pda.to_account_info(),
            message_transmitter: ctx.accounts.message_transmitter.clone().to_account_info(),
            used_nonces: ctx.accounts.used_nonces.to_account_info(),
            receiver: ctx.accounts.value_router_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            event_authority: ctx
                .accounts
                .message_transmitter_event_authority
                .to_account_info(),
            program: ctx.accounts.value_router_program.to_account_info(),
        };

        let seeds: &[&[&[u8]]] = &[&[
            constants::CCTP_CALLER_SEED,
            &[*ctx.bumps.get("caller").unwrap()],
        ]];

        let cpi_ctx_2 = CpiContext::new_with_signer(
            ctx.accounts
                .message_transmitter_program
                .clone()
                .to_account_info(),
            accounts_2,
            seeds,
        );

        message_transmitter::cpi::receive_message(
            cpi_ctx_2,
            ctx.accounts.relay_params.swap_message.clone(),
        )?;
        msg!("receive swap msg success");

        // decode message
        let swap_message = SwapMessage::new(1, &ctx.accounts.relay_params.swap_message.message)?;
        let buy_token = swap_message.get_buy_token()?;
        //msg!("value_router swap: buy_token: {:?}", buy_token);
        //let recipient = swap_message.get_recipient()?;
        //msg!("value_router swap: recipient: {:?}", recipient);
        let guaranteed_buy_amount = swap_message.get_guaranteed_buy_amount()?;
        /*msg!(
            "value_router swap: guaranteed_buy_amount: {:?}",
            guaranteed_buy_amount
        );*/
        if buy_token != ctx.accounts.usdc_mint.key() {
            assert!(
                usdc_balance >= swap_message.get_sell_amount()?,
                "value_router: no enough usdc amount to swap"
            );
            // swap
            msg!("value_router: swap on jupiter");
            let token_balance_before = ctx.accounts.recipient_token_account.amount;
            swap_on_jupiter(
                ctx.remaining_accounts,
                ctx.accounts.jupiter_program.clone(),
                params.jupiter_swap_data,
            )?;
            assert!(
                ctx.accounts.recipient_token_account.amount - token_balance_before
                    >= guaranteed_buy_amount,
                "value_router: swap output not enough"
            );
        } else {
            // transfer to recipient
            let _ = utils::transfer_token(
                Account::<TokenAccount>::try_from(
                    &ctx.accounts.program_usdc_account.clone().to_account_info(),
                )?,
                Account::<TokenAccount>::try_from(
                    &ctx.accounts
                        .recipient_token_account
                        .clone()
                        .to_account_info(),
                )?,
                ctx.accounts.program_authority.clone(),
                &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
                ctx.accounts.token_program.clone(),
                usdc_balance,
            );
        }

        utils::close_program_usdc(
            ctx.accounts.program_authority.clone(),
            ctx.accounts.program_usdc_account.clone(),
            ctx.accounts.token_program.clone(),
            &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
        )?;
        //msg!("program usdc account closed");

        Ok(())
    }

    /*
    Instruction 8: HandleReceiveMessage
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
        // TODO params.sender == remote_value_router
        msg!(
            "value_router: receive message {:?}, {:?}, {:?}, {:?}",
            params.remote_domain,
            params.sender,
            params.message_body,
            params.authority_bump
        );

        Ok(())
    }
}
