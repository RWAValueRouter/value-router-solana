use {
    crate::{
        constants,
        jupiter::{swap_on_jupiter, Jupiter},
        program,
        state::{SwapAndBridgeEvent, ValueRouter},
        swap_message::SwapMessage,
        utils,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer},
    message_transmitter::{
        cpi::accounts::SendMessageContext, instructions::SendMessageWithCallerParams,
        state::MessageTransmitter,
    },
    solana_program::{pubkey::Pubkey, system_instruction},
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

/*
Instruction 4: swap_and_bridge
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

    #[account(
        seeds = [constants::VALUE_ROUTER],
        bump
    )]
    pub value_router: Box<Account<'info, ValueRouter>>,

    // Pdas
    /// CHECK: empty PDA
    pub sender_authority_pda: UncheckedAccount<'info>,

    /// CHECK: empty PDA
    #[account(
            seeds = [b"sender_authority"],
            bump,
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

    #[account(mut)]
    pub sender_usdc_account: Account<'info, TokenAccount>,

    pub source_mint: Box<Account<'info, Mint>>,

    pub jupiter_program: Program<'info, Jupiter>,

    /// CHECK:
    #[account(mut)]
    pub fee_receiver: UncheckedAccount<'info>,
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
    pub memo: Vec<u8>,
}

pub fn swap_and_bridge(
    ctx: Context<SwapAndBridgeInstruction>,
    params: SwapAndBridgeParams,
) -> Result<()> {
    assert!(
        ctx.accounts.value_router.fee_receiver.key() == ctx.accounts.fee_receiver.key(),
        "wrong fee receiver"
    );

    let message_transmitter = &ctx.accounts.message_transmitter;

    let authority_bump = ctx.bumps.get("program_authority").unwrap().to_le_bytes();
    let usdc_bump = ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes();

    let increased_usdc_amount: u64;
    {
        let initial_program_usdc_account = utils::create_usdc_token_idempotent(
            &ctx.accounts.program_authority,
            &ctx.accounts.program_usdc_account,
            &Box::new(Account::try_from(&ctx.accounts.burn_token_mint)?),
            &ctx.accounts.token_program,
            &ctx.accounts.system_program,
            &authority_bump,
            &constants::USDC_SEED,
            &usdc_bump,
        )?;

        let initial_balance: u64 = initial_program_usdc_account.amount;
        if ctx.accounts.source_mint.clone().key() != ctx.accounts.burn_token_mint.key() {
            msg!("valuerouter: handling local swap");

            swap_on_jupiter(
                ctx.remaining_accounts,
                ctx.accounts.jupiter_program.clone(),
                params.jupiter_swap_data,
            )?;
        } else {
            msg!("valuerouter: no local swap");
            let cpi_accounts = Transfer {
                from: ctx.accounts.sender_usdc_account.to_account_info(),
                to: ctx.accounts.program_usdc_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

            transfer(cpi_ctx, params.bridge_usdc_amount)?;
        }
        //let final_token_account_data = ctx.accounts.program_usdc_account.try_borrow_data()?;
        let final_balance = TokenAccount::try_deserialize(
            &mut ctx
                .accounts
                .program_usdc_account
                .try_borrow_data()?
                .as_ref(),
        )?
        .amount;

        msg!("valuerouter: swap output {:?}", final_balance);
        increased_usdc_amount = final_balance - initial_balance;
        assert!(
            increased_usdc_amount >= params.bridge_usdc_amount,
            "value_router: no enough swap output"
        );
    }

    {
        let mut fee_amount: u64 = 0;
        if params.buy_args.buy_token == Pubkey::new_from_array([0; 32]) {
            // no dest swap
            fee_amount += ctx
                .accounts
                .value_router
                .get_bridge_fee_for_domain(params.dest_domain)
                .unwrap();
        } else {
            // need dest swap
            fee_amount += ctx
                .accounts
                .value_router
                .get_swap_fee_for_domain(params.dest_domain)
                .unwrap();
        }

        let fee_ix = system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.value_router.fee_receiver.key(),
            fee_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &fee_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.fee_receiver.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    // cpi depositForBurnWithCaller
    let deposit_for_burn_accounts = Box::new(DepositForBurnContext {
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
    });

    let mut deposit_for_burn_params = DepositForBurnWithCallerParams {
        amount: increased_usdc_amount,
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

    // if dest domain is noble
    if params.dest_domain == 4 {
        deposit_for_burn_params.mint_recipient = params.recipient.clone();
        deposit_for_burn_params.destination_caller = ctx.accounts.value_router.noble_caller.key();
    }

    let signer_seeds: &[&[&[u8]]] = &[&[constants::AUTHORITY_SEED, authority_bump.as_ref()]];

    let deposit_for_burn_ctx = CpiContext::new_with_signer(
        ctx.accounts
            .token_messenger_minter_program
            .clone()
            .to_account_info(),
        *deposit_for_burn_accounts,
        signer_seeds,
    );

    msg!("swap_and_bridge: cpi deposit_for_burn_with_caller");

    let nonce = token_messenger_minter::cpi::deposit_for_burn_with_caller(
        deposit_for_burn_ctx,
        deposit_for_burn_params,
    )?
    .get();

    msg!("bridge nonce: {:?}", nonce);

    // if dest domain is noble
    if params.dest_domain == 4 {
        emit!(SwapAndBridgeEvent {
            bridge_usdc_amount: increased_usdc_amount,
            buy_token: params.buy_args.buy_token,
            guaranteed_buy_amount: params.buy_args.guaranteed_buy_amount,
            dest_domain: params.dest_domain,
            recipient: params.recipient.clone(),
            bridge_nonce: nonce,
            swap_nonce: 0,
            memo: params.memo,
        });

        return Ok(());
    }

    /*msg!("closing program usdc account");
    utils::close_program_usdc(
        &ctx.accounts.program_authority,
        &ctx.accounts.program_usdc_account,
        &ctx.accounts.token_program,
        &authority_bump,
    )?;
    msg!("program usdc account closed");*/

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

    let message_body = Box::new(SwapMessage::format_message(
        1u32,
        bridge_nonce_hash.to_vec(),
        increased_usdc_amount,
        &params.buy_args.buy_token,
        params.buy_args.guaranteed_buy_amount.clone(),
        &params.recipient.clone(),
    )?);

    msg!("swap_and_bridge: message_body: {:?}", *message_body);

    msg!("swap_and_bridge: build send_message_accounts");

    // cpi sendMessageWithCaller
    let send_message_accounts = Box::new(SendMessageContext {
        event_rent_payer: ctx.accounts.event_rent_payer.to_account_info(),
        sender_authority_pda: ctx.accounts.sender_authority_pda_2.to_account_info(),
        message_transmitter: message_transmitter.clone().to_account_info(),
        message_sent_event_data: ctx.accounts.message_sent_event_data_2.to_account_info(),
        sender_program: ctx.accounts.value_router_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    });

    msg!("swap_and_bridge: build send_message_params");

    let send_message_params = SendMessageWithCallerParams {
        destination_domain: params.dest_domain,
        recipient: *ctx.accounts.remote_value_router.to_account_info().key,
        message_body: *message_body,
        destination_caller: *ctx.accounts.remote_value_router.to_account_info().key,
    };

    let authority_seeds: &[&[&[u8]]] = &[
        &[constants::AUTHORITY_SEED, authority_bump.as_ref()],
        &[
            b"sender_authority",
            &ctx.bumps
                .get("sender_authority_pda_2")
                .unwrap()
                .to_le_bytes(),
        ],
    ];

    msg!("swap_and_bridge: build send_message_ctx");

    let send_message_ctx = CpiContext::new_with_signer(
        ctx.accounts.message_transmitter_program.to_account_info(),
        *send_message_accounts,
        authority_seeds,
    );

    msg!("swap_and_bridge: cpi send_message_with_caller");

    let nonce2 =
        message_transmitter::cpi::send_message_with_caller(send_message_ctx, send_message_params)?
            .get();

    msg!("send message nonce: {:?}", nonce2);

    emit!(SwapAndBridgeEvent {
        bridge_usdc_amount: increased_usdc_amount,
        buy_token: params.buy_args.buy_token,
        guaranteed_buy_amount: params.buy_args.guaranteed_buy_amount,
        dest_domain: params.dest_domain,
        recipient: params.recipient,
        bridge_nonce: nonce,
        swap_nonce: nonce2,
        memo: params.memo,
    });

    Ok(())
}
