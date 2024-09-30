use {
    crate::{
        constants,
        jupiter::{swap_on_jupiter, Jupiter},
        program,
        state::RelayData,
        swap_message::SwapMessage,
        utils,
    },
    anchor_lang::prelude::*,
    anchor_spl::associated_token::{get_associated_token_address, AssociatedToken},
    anchor_spl::token::{self, CloseAccount, Token, TokenAccount},
    message_transmitter::{
        cpi::accounts::ReceiveMessageContext,
        message::Message,
        state::{MessageTransmitter, UsedNonces},
    },
    solana_program::{pubkey, pubkey::Pubkey},
    token_messenger_minter::{
        program::TokenMessengerMinter,
        token_messenger::state::{RemoteTokenMessenger, TokenMessenger},
        token_minter::state::{LocalToken, TokenMinter, TokenPair},
    },
};

/*
Instruction 9: relay
 */
// Instruction accounts
#[derive(Accounts)]
#[instruction(params: RelayParams)]
pub struct RelayInstruction<'info> {
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
    pub used_nonces_1: Box<Account<'info, UsedNonces>>,

    #[account(mut)]
    pub used_nonces_2: Box<Account<'info, UsedNonces>>,

    pub token_messenger_minter_program: Program<'info, TokenMessengerMinter>,

    pub value_router_program: Program<'info, program::ValueRouter>,

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

    /// CHECK: jupiter swap recipient output token account
    #[account(mut)]
    pub recipient_output_token_account: AccountInfo<'info>,

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
    #[account()]
    pub output_mint: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
            mut,
            seeds = [constants::AUTHORITY_SEED],
            bump
        )]
    pub program_authority: UncheckedAccount<'info>,

    pub jupiter_program: Program<'info, Jupiter>,

    #[account()]
    pub cctp_message_receiver: Program<'info, cctp_message_receiver::program::CctpMessageReceiver>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>,
}

// Instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RelayParams {
    pub jupiter_swap_data: Vec<u8>,
}

pub fn relay<'a>(
    ctx: Context<'_, '_, '_, 'a, RelayInstruction<'a>>,
    params: RelayParams,
) -> Result<()> {
    utils::create_usdc_token_idempotent(
        &ctx.accounts.program_authority,
        &ctx.accounts.program_usdc_account,
        &Box::new(Account::try_from(&ctx.accounts.usdc_mint)?),
        &ctx.accounts.token_program,
        &ctx.accounts.system_program,
        &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
        &constants::USDC_IN_SEED,
        &ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes(),
    )?;

    {
        let accounts_1 = Box::new(ReceiveMessageContext {
            payer: ctx.accounts.payer.to_account_info(),
            caller: ctx.accounts.caller.to_account_info(),
            authority_pda: ctx.accounts.tm_authority_pda.to_account_info(),
            message_transmitter: ctx.accounts.message_transmitter.clone().to_account_info(),
            used_nonces: ctx.accounts.used_nonces_1.to_account_info(),
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

        let remaining = Box::new(
            [
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
            .to_vec(),
        );

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
        .with_remaining_accounts(*remaining);

        message_transmitter::cpi::receive_message(
            cpi_ctx_1,
            ctx.accounts.relay_params.bridge_message.clone(),
        )?;

        let accounts_2 = Box::new(ReceiveMessageContext {
            payer: ctx.accounts.payer.to_account_info(),
            caller: ctx.accounts.caller.to_account_info(),
            authority_pda: ctx.accounts.vr_authority_pda.to_account_info(),
            message_transmitter: ctx.accounts.message_transmitter.clone().to_account_info(),
            used_nonces: ctx.accounts.used_nonces_2.to_account_info(),
            receiver: ctx.accounts.cctp_message_receiver.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            event_authority: ctx
                .accounts
                .message_transmitter_event_authority
                .to_account_info(),
            program: ctx.accounts.value_router_program.to_account_info(),
        });

        let remaining_2 = Box::new(
            [
                ctx.accounts.cctp_receiver_event_authority.to_account_info(),
                ctx.accounts.message_transmitter_program.to_account_info(),
            ]
            .to_vec(),
        );

        let cpi_ctx_2 = CpiContext::new_with_signer(
            ctx.accounts
                .message_transmitter_program
                .clone()
                .to_account_info(),
            *accounts_2,
            seeds,
        )
        .with_remaining_accounts(*remaining_2);

        message_transmitter::cpi::receive_message(
            cpi_ctx_2,
            ctx.accounts.relay_params.swap_message.clone(),
        )?;
    }

    let swap_message = &Message::new(
        ctx.accounts.message_transmitter.as_ref().version,
        &ctx.accounts.relay_params.swap_message.message,
    )?;

    // decode message
    let swap_message_body = Box::new(SwapMessage::new(
        1,
        &ctx.accounts.relay_params.swap_message.message[116..], //.message_body,
    )?);

    // check version
    assert!(
        swap_message_body.get_version()? == 1,
        "wrong swap message version"
    );

    let bridge_message = &Message::new(
        ctx.accounts.message_transmitter.as_ref().version,
        &ctx.accounts.relay_params.bridge_message.message,
    )?;

    // check nonce
    assert!(
        bridge_message.nonce()? + 1 == swap_message.nonce()?,
        "valueRouter: nonce not match"
    );
    if bridge_message.source_domain()? != 4 {
        assert!(
            bridge_message.sender()? == swap_message.sender()?,
            "valueRouter: message sender not match"
        );
    }

    // swap_message.get_recipient() is recipient's wallet address
    assert!(
        *ctx.accounts.recipient_wallet_account.to_account_info().key
            == swap_message_body.get_recipient()?,
        "value_router: incorrect recipient's wallet account"
    );
    if swap_message_body.get_buy_token()? != pubkey!("So11111111111111111111111111111111111111112")
    {
        assert!(
            parse_owner(
                &ctx.accounts
                    .recipient_output_token_account
                    .try_borrow_data()?,
            ) == swap_message_body.get_recipient()?,
            "value_router: incorrect recipient's output token account"
        );
    } else {
        assert!(
            parse_owner(
                &ctx.accounts
                    .recipient_output_token_account
                    .try_borrow_data()?,
            ) == *ctx.accounts.payer.to_account_info().key,
            "value_router: incorrect recipient's output token account"
        );
    }

    assert!(
        ctx.accounts.recipient_usdc_account.key()
            == get_associated_token_address(
                &swap_message_body.get_recipient()?,
                ctx.accounts.usdc_mint.key,
            ),
        "value_router: incorrect recipient's usdc account"
    );

    // check usdc balance change of usdc_vault;
    let usdc_bridge_amount = TokenAccount::try_deserialize(
        &mut ctx
            .accounts
            .program_usdc_account
            .try_borrow_data()?
            .as_ref(),
    )?
    .amount;

    let mut output_amount: u64 = 0;

    if swap_message_body.get_buy_token()? != ctx.accounts.usdc_mint.key() {
        assert!(
            usdc_bridge_amount >= swap_message_body.get_sell_amount()?,
            "value_router: no enough usdc amount to swap"
        );
        let token_balance_before = parse_amount(
            &ctx.accounts
                .recipient_output_token_account
                .try_borrow_data()?,
        );

        // found payer's usdc account
        let mut payer_usdc_account_index = 0;

        let payer_usdc_key = Box::new(get_associated_token_address(
            &ctx.accounts.payer.clone().to_account_info().key,
            &ctx.accounts.usdc_mint.key(),
        ));

        for (i, account_info) in ctx.remaining_accounts.iter().enumerate() {
            if *account_info.key == *payer_usdc_key {
                payer_usdc_account_index = i;
                break;
            }
        }

        {
            let payer_usdc_account = Box::new(Account::<TokenAccount>::try_from(
                &ctx.remaining_accounts[payer_usdc_account_index],
            )?);

            // send usdc to payer
            let _ = utils::transfer_token_program(
                Account::<TokenAccount>::try_from(
                    &ctx.accounts.program_usdc_account.clone().to_account_info(),
                )?,
                *(payer_usdc_account),
                ctx.accounts.program_authority.clone(),
                &ctx.bumps.get("program_authority").unwrap().to_le_bytes(),
                ctx.accounts.token_program.clone(),
                usdc_bridge_amount,
            );
        }

        // check payer's usdc balance
        let payer_usdc_balance_before = TokenAccount::try_deserialize(
            &mut ctx.remaining_accounts[payer_usdc_account_index]
                .try_borrow_data()?
                .as_ref(),
        )?
        .amount;

        // swap
        swap_on_jupiter(
            ctx.remaining_accounts,
            ctx.accounts.jupiter_program.clone(),
            params.jupiter_swap_data,
        )?;

        output_amount = parse_amount(
            &ctx.accounts
                .recipient_output_token_account
                .try_borrow_data()?,
        ) - token_balance_before;
        if swap_message_body.get_buy_token()?
            == pubkey!("So11111111111111111111111111111111111111112")
        {
            assert!(
                output_amount >= swap_message_body.get_guaranteed_buy_amount()?,
                "value_router: swap output not enough, have {:?}, expect {:?}",
                output_amount,
                swap_message_body.get_guaranteed_buy_amount()?
            );
            // unwrap
            {
                let close_wsol_cpi_ctx = Box::new(CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    CloseAccount {
                        account: ctx
                            .accounts
                            .recipient_output_token_account
                            .to_account_info(),
                        destination: ctx.accounts.payer.to_account_info(),
                        authority: ctx.accounts.payer.to_account_info(),
                    },
                ));
                token::close_account(*close_wsol_cpi_ctx)?;
            }

            let _ = utils::transfer_sol(
                &ctx.accounts.payer,
                &ctx.accounts.recipient_wallet_account,
                &ctx.accounts.system_program.to_account_info(),
                output_amount,
            );
        } else {
            assert!(
                output_amount >= swap_message_body.get_guaranteed_buy_amount()?,
                "value_router: swap output not enough, have {:?}, expect {:?}",
                output_amount,
                swap_message_body.get_guaranteed_buy_amount()?
            );
        }

        // check payer's usdc balance change
        let payer_usdc_balance_after = TokenAccount::try_deserialize(
            &mut ctx.remaining_accounts[payer_usdc_account_index]
                .try_borrow_data()?
                .as_ref(),
        )?
        .amount;
        msg!(
            "remaining usdc: {:?}",
            usdc_bridge_amount - (payer_usdc_balance_before - payer_usdc_balance_after)
        );
    } else {
        // no swap
        // transfer usdc to recipient
        let _ = utils::transfer_token_program(
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
            usdc_bridge_amount,
        );
    }

    msg!("Relay success\nsource_domain: {:?}, bridge_amount: {:?}, buy_token: {:?}, buy_amount: {:?}", swap_message.source_domain()?, usdc_bridge_amount, swap_message_body.get_buy_token()?, output_amount);

    Ok(())
}

pub fn parse_owner(data: &[u8]) -> Pubkey {
    Pubkey::new(&data[32..64])
}

pub fn parse_amount(data: &[u8]) -> u64 {
    let amount_bytes: [u8; 8] = data[64..72]
        .try_into()
        .expect("slice with incorrect length");
    u64::from_le_bytes(amount_bytes)
}
