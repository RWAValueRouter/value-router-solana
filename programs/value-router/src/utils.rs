//! Utils

use {
    crate::{constants, errors::ErrorCode},
    anchor_lang::{ prelude::*, system_program},
    anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer},
};

pub fn transfer_token<'info>(
    from_account: Account<'info, TokenAccount>,
    to_account: Account<'info, TokenAccount>,
    authority: UncheckedAccount<'info>,
    authority_bump: &[u8],
    token_program: Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    let cpi_accounts = Transfer {
        from: from_account.to_account_info(),
        to: to_account.to_account_info(),
        authority: authority.to_account_info(),
    };

    let cpi_program = token_program.to_account_info();

    let signer_seeds: &[&[&[u8]]] = &[&[constants::AUTHORITY_SEED, authority_bump.as_ref()]];

    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    token::transfer(cpi_context, amount)?;

    Ok(())
}

pub fn create_usdc_token_idempotent<'info>(
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
            &[constants::AUTHORITY_SEED, authority_bump.as_ref()],
            &[constants::USDC_SEED, usdc_bump.as_ref()],
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
            return err!(ErrorCode::IncorrectOwner);
        }

        Ok(usdc_token_account)
    }
}

pub fn close_program_usdc<'info>(
    program_authority: UncheckedAccount<'info>,
    program_usdc_account: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    authority_bump: &[u8],
) -> Result<()> {
    let signer_seeds: &[&[&[u8]]] = &[&[constants::AUTHORITY_SEED, authority_bump.as_ref()]];

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
