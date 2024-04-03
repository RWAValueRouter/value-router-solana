import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ValueRouter } from "../target/types/value_router";

describe("value-router", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ValueRouter as Program<ValueRouter>;

  it("Is initialized!", async () => {
    // Add your test here.
  });
});
