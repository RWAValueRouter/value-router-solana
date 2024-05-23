use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;

    #[derive(Accounts)]
    #[instruction(params: FooParams)]
    pub struct FooContext<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
    }

    // Instruction parameters
    #[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
    pub struct FooParams {}

    // Instruction handler
    pub fn foo(ctx: Context<FooContext>, _params: FooParams) -> Result<()> {
        msg!("foo");
        Ok(())
    }
}

