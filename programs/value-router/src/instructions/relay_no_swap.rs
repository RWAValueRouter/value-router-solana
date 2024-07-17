use {
    crate::{
        constants, program,
        state::{RelayData, ValueRouter},
        swap_message::SwapMessage,
        utils,
    },
    anchor_lang::prelude::*,
    anchor_spl::associated_token::{get_associated_token_address, AssociatedToken},
    anchor_spl::token::{Token, TokenAccount},
    message_transmitter::{
        cpi::accounts::ReceiveMessageContext,
        message::Message,
        state::{MessageTransmitter, UsedNonces},
    },
    solana_program::pubkey::Pubkey,
    token_messenger_minter::{
        program::TokenMessengerMinter,
        token_messenger::state::{RemoteTokenMessenger, TokenMessenger},
        token_minter::state::{LocalToken, TokenMinter, TokenPair},
    },
};

/*
Instruction 10: relay_no_swap
 */
// Instruction accounts
#[derive(Accounts)]
#[instruction(params: RelayNoSwapParams)]
pub struct RelayNoSwapInstruction<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:
    #[account(
            mut,
            seeds = [constants::CCTP_CALLER_SEED],
            bump
        )]
    pub caller: UncheckedAccount<'info>,

    /// CHECK:
    #[account()]
    pub tm_authority_pda: UncheckedAccount<'info>,

    /// CHECK:
    #[account()]
    pub vr_authority_pda: UncheckedAccount<'info>,

    pub message_transmitter_program:
        Program<'info, message_transmitter::program::MessageTransmitter>,

    #[account()]
    pub message_transmitter: Box<Account<'info, MessageTransmitter>>,

    // Used nonces state, see UsedNonces struct for more details
    #[account(mut)]
    pub used_nonces: Box<Account<'info, UsedNonces>>,

    pub token_messenger_minter_program: Program<'info, TokenMessengerMinter>,

    pub value_router_program: Program<'info, program::ValueRouter>,

    #[account()]
    pub value_router: Box<Account<'info, ValueRouter>>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    /// CHECK:
    #[account()]
    pub message_transmitter_event_authority: UncheckedAccount<'info>,

    /// CHECK:
    #[account()]
    pub token_messenger_event_authority: UncheckedAccount<'info>,

    /// CHECK:
    #[account()]
    pub cctp_receiver_event_authority: UncheckedAccount<'info>,

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
    pub recipient_usdc_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: recipient wallet account
    #[account(mut)]
    pub recipient_wallet_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub custody_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Program usdc token account
    #[account(
            mut,
            seeds = [constants::USDC_IN_SEED],
            bump
        )]
    pub program_usdc_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
            mut,
            constraint = usdc_mint.key() == solana_program::pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        )]
    pub usdc_mint: UncheckedAccount<'info>,

    /// CHECK:
    pub output_mint: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump
        )]
    pub program_authority: UncheckedAccount<'info>,

    #[account()]
    pub cctp_message_receiver: Program<'info, cctp_message_receiver::program::CctpMessageReceiver>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RelayNoSwapParams {}

pub fn relay_no_swap<'a>(
    ctx: Context<'_, '_, '_, 'a, RelayNoSwapInstruction<'a>>,
    _params: RelayNoSwapParams,
) -> Result<()> {
    utils::create_usdc_token_idempotent(
        ctx.accounts.program_authority.clone(),
        ctx.accounts.program_usdc_account.clone(),
        Box::new(Account::try_from(&ctx.accounts.usdc_mint)?),
        ctx.accounts.token_program.clone(),
        ctx.accounts.system_program.clone(),
        &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
        &constants::USDC_IN_SEED,
        &ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes(),
    )?;

    let accounts_1 = Box::new(ReceiveMessageContext {
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
    });

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
        *accounts_1,
        seeds,
    )
    .with_remaining_accounts(remaining);

    message_transmitter::cpi::receive_message(
        cpi_ctx_1,
        ctx.accounts.relay_params.bridge_message.clone(),
    )?;

    let accounts_2 = Box::new(ReceiveMessageContext {
        payer: ctx.accounts.payer.to_account_info(),
        caller: ctx.accounts.caller.to_account_info(),
        authority_pda: ctx.accounts.vr_authority_pda.to_account_info(),
        message_transmitter: ctx.accounts.message_transmitter.clone().to_account_info(),
        used_nonces: ctx.accounts.used_nonces.to_account_info(),
        receiver: ctx.accounts.cctp_message_receiver.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        event_authority: ctx
            .accounts
            .message_transmitter_event_authority
            .to_account_info(),
        program: ctx.accounts.value_router_program.to_account_info(),
    });

    let remaining_2: Vec<AccountInfo> = [
        ctx.accounts.cctp_receiver_event_authority.to_account_info(),
        ctx.accounts.message_transmitter_program.to_account_info(),
    ]
    .to_vec();

    let cpi_ctx_2 = CpiContext::new_with_signer(
        ctx.accounts
            .message_transmitter_program
            .clone()
            .to_account_info(),
        *accounts_2,
        seeds,
    )
    .with_remaining_accounts(remaining_2);

    message_transmitter::cpi::receive_message(
        cpi_ctx_2,
        ctx.accounts.relay_params.swap_message.clone(),
    )?;

    // decode message
    let swap_message = Box::new(SwapMessage::new(
        1,
        &ctx.accounts.relay_params.swap_message.message[116..], //.message_body,
    )?);

    // check version
    assert!(
        swap_message.get_version()? == 1,
        "wrong swap message version"
    );

    // check sender
    let bridge_message = &Message::new(
        ctx.accounts.message_transmitter.as_ref().version,
        &ctx.accounts.relay_params.bridge_message.message,
    )?;
    assert!(
        bridge_message.sender()?
            == ctx
                .accounts
                .value_router
                .get_remote_value_router_for_domain(bridge_message.source_domain()?)
                .unwrap(),
        "value_router: message sender is incorrect"
    );

    // check nonce
    let mut encoded_data = vec![0; 12];
    encoded_data[..4].copy_from_slice(&bridge_message.source_domain()?.to_be_bytes()); // source domain id
    encoded_data[4..].copy_from_slice(&bridge_message.nonce()?.to_be_bytes());
    let bridge_nonce_hash = anchor_lang::solana_program::keccak::hash(encoded_data.as_slice())
        .to_bytes()
        .to_vec();
    assert!(
        swap_message.get_bridge_nonce_hash()? == bridge_nonce_hash,
        "value_router: nonce binding incorrect"
    );

    assert!(
        ctx.accounts.recipient_usdc_account.key()
            == get_associated_token_address(
                &swap_message.get_recipient()?,
                ctx.accounts.usdc_mint.key,
            ),
        "value_router: incorrect recipient's usdc account"
    );

    let usdc_balance = Box::new(
        TokenAccount::try_deserialize(
            &mut ctx
                .accounts
                .program_usdc_account
                .try_borrow_data()?
                .as_ref(),
        )?
        .amount,
    );

    // transfer usdc to recipient
    let _ = utils::transfer_token(
        Account::<TokenAccount>::try_from(
            &ctx.accounts.program_usdc_account.clone().to_account_info(),
        )?,
        Account::<TokenAccount>::try_from(
            &ctx.accounts
                .recipient_usdc_account
                .clone()
                .to_account_info(),
        )?,
        ctx.accounts.program_authority.clone(),
        &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
        ctx.accounts.token_program.clone(),
        *usdc_balance,
    );

    utils::close_program_usdc(
        ctx.accounts.program_authority.clone(),
        ctx.accounts.program_usdc_account.clone(),
        ctx.accounts.token_program.clone(),
        &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
    )?;

    Ok(())
}
