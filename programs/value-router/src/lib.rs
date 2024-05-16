mod state;

use {
    crate::state::{RelayData, SwapAndBridgeEvent, ValueRouter},
    anchor_lang::{
        prelude::*,
        solana_program::{
            entrypoint::ProgramResult, instruction::Instruction, program::invoke_signed,
        },
        system_program,
    },
    anchor_spl::token::{self, Mint, Token, TokenAccount},
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
declare_id!("2vL3mbzQyFMK3caqAJ7KUon8xDiRLQRJ5Gnfu9T78PJe");

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
            seeds = [AUTHORITY_SEED],
            bump
        )]
        pub program_authority: UncheckedAccount<'info>,

        /// Program usdc token account
        /// CHECK:
        #[account(
            mut,
            seeds = [USDC_SEED],
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
        msg!("valuerouter: swap_and_bridge");
        let message_transmitter = &ctx.accounts.message_transmitter;

        let authority_bump = ctx.bumps.get("program_authority").unwrap().to_le_bytes();
        let usdc_bump = ctx.bumps.get("program_usdc_account").unwrap().to_le_bytes();

        let mut flagLocalSwap = false;
        let mut after_balance: u64 = 0;
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
            let program_usdc_account = create_usdc_token_idempotent(
                ctx.accounts.program_authority.clone(),
                ctx.accounts.program_usdc_account.clone(),
                ctx.accounts.source_mint.clone(),
                ctx.accounts.token_program.clone(),
                ctx.accounts.system_program.clone(),
                &authority_bump,
                &usdc_bump,
            )?;

            msg!(
                "valuerouter: program_usdc_account: {:?}",
                program_usdc_account
            );

            msg!("valuerouter: swap on jupiter");
            swap_on_jupiter(
                ctx.remaining_accounts,
                ctx.accounts.jupiter_program.clone(),
                params.jupiter_swap_data,
            )?;

            after_balance = program_usdc_account.amount;
            msg!("valuerouter: swap output {:?}", after_balance);
            assert!(
                after_balance >= params.bridge_usdc_amount,
                "no enough swap output"
            );
        } else {
            msg!("valuerouter: no local swap");
            after_balance = params.bridge_usdc_amount;
        }

        // cpi depositForBurnWithCaller
        let deposit_for_burn_accounts = DepositForBurnContext {
            owner: ctx.accounts.program_authority.clone().to_account_info(),
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
            amount: after_balance,
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

        msg!("closing program usdc account");
        if flagLocalSwap {
            close_program_usdc(
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
            after_balance,
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

        emit!(SwapAndBridgeEvent {
            bridge_usdc_amount: after_balance,
            buy_token: params.buy_args.buy_token,
            guaranteed_buy_amount: params.buy_args.guaranteed_buy_amount,
            dest_domain: params.dest_domain,
            recipient: params.recipient.clone(),
            bridge_nonce: nonce,
            swap_nonce: nonce2,
        });

        Ok(())
    }
}

// Jupiter flash fill

pub const AUTHORITY_SEED: &[u8] = b"authority";
pub const USDC_SEED: &[u8] = b"usdc";

mod jupiter {
    use anchor_lang::declare_id;
    declare_id!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
}

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        jupiter::id()
    }
}

#[error_code]
pub enum ErrorCode {
    InvalidReturnData,
    InvalidJupiterProgram,
    IncorrectOwner,
}

fn swap_on_jupiter<'info>(
    remaining_accounts: &[AccountInfo],
    jupiter_program: Program<'info, Jupiter>,
    data: Vec<u8>,
) -> ProgramResult {
    let accounts: Vec<AccountMeta> = remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        })
        .collect();

    let accounts_infos: Vec<AccountInfo> = remaining_accounts
        .iter()
        .map(|acc| AccountInfo { ..acc.clone() })
        .collect();

    // TODO: Check the first 8 bytes. Only Jupiter Route CPI allowed.

    invoke_signed(
        &Instruction {
            program_id: *jupiter_program.key,
            accounts,
            data,
        },
        &accounts_infos,
        &[],
    )
}

fn create_usdc_token_idempotent<'info>(
    program_authority: UncheckedAccount<'info>,
    program_usdc_account: UncheckedAccount<'info>,
    usdc_mint: Box<Account<'info, Mint>>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    authority_bump: &[u8],
    usdc_bump: &[u8],
) -> Result<TokenAccount> {
    if program_usdc_account.data_is_empty() {
        msg!("program_usdc_account data is empty");
        let signer_seeds: &[&[&[u8]]] = &[
            &[AUTHORITY_SEED, authority_bump.as_ref()],
            &[USDC_SEED, usdc_bump.as_ref()],
        ];

        msg!("Initialize program usdc account");
        let rent = Rent::get()?;
        let space = TokenAccount::LEN;
        let lamports = rent.minimum_balance(space);
        system_program::create_account(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                system_program::CreateAccount {
                    from: program_authority.to_account_info(),
                    to: program_usdc_account.to_account_info(),
                },
                signer_seeds,
            ),
            lamports,
            space as u64,
            token_program.key,
        )?;

        msg!("Initialize program usdc token account");
        token::initialize_account3(CpiContext::new(
            token_program.to_account_info(),
            token::InitializeAccount3 {
                account: program_usdc_account.to_account_info(),
                mint: usdc_mint.to_account_info(),
                authority: program_authority.to_account_info(),
            },
        ))?;

        let data = program_usdc_account.try_borrow_data()?;
        let usdc_token_account = TokenAccount::try_deserialize(&mut data.as_ref())?;

        Ok(usdc_token_account)
    } else {
        msg!("program_usdc_account has data");

        msg!("Initialize program usdc token account");
        token::initialize_account3(CpiContext::new(
            token_program.to_account_info(),
            token::InitializeAccount3 {
                account: program_usdc_account.to_account_info(),
                mint: usdc_mint.to_account_info(),
                authority: program_authority.to_account_info(),
            },
        ))?;

        let data = program_usdc_account.try_borrow_data()?;
        msg!("program_usdc_account data: {:?}", data);
        let usdc_token_account = TokenAccount::try_deserialize(&mut data.as_ref())?;
        msg!("program_usdc_account: {:?}", usdc_token_account);
        if &usdc_token_account.owner != program_authority.key {
            // TODO: throw error
            return err!(ErrorCode::IncorrectOwner);
        }

        Ok(usdc_token_account)
    }
}

fn close_program_usdc<'info>(
    program_authority: UncheckedAccount<'info>,
    program_usdc_account: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    authority_bump: &[u8],
) -> Result<()> {
    let signer_seeds: &[&[&[u8]]] = &[&[AUTHORITY_SEED, authority_bump.as_ref()]];

    msg!("Close program usdc token account");
    token::close_account(CpiContext::new_with_signer(
        token_program.to_account_info(),
        token::CloseAccount {
            account: program_usdc_account.to_account_info(),
            destination: program_authority.to_account_info(),
            authority: program_authority.to_account_info(),
        },
        signer_seeds,
    ))
}

#[derive(Accounts)]
pub struct SwapToUSDC<'info> {
    #[account(mut, seeds = [AUTHORITY_SEED], bump)]
    /// CHECK:
    pub program_authority: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut, seeds = [USDC_SEED], bump)]
    pub program_usdc_account: UncheckedAccount<'info>,
    pub user_account: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct USDCToSwap<'info> {
    #[account(mut, seeds = [AUTHORITY_SEED], bump)]
    pub program_authority: SystemAccount<'info>,
    /// CHECK: This may not be initialized yet.
    #[account(mut, seeds = [USDC_SEED], bump)]
    pub program_usdc_account: UncheckedAccount<'info>,
    pub user_account: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
