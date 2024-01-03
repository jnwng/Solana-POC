import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { mnemonicToSeedSync, generateMnemonic } from "bip39";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import dotenv from "dotenv";
dotenv.config();

const DEFAULT_MNEMONIC =
  "trouble sport ignore faint hidden mushroom van future naive spike issue sheriff";
const TWEED_WALLET_MNEMONIC = process.env.TWEED_WALLET_MNEMONIC; // devnet address 2SaEtKn292eAgHnfypJMGkUPXfHhZvMt4VjXKLXJBxbf
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export function getUserAccount(mnemonic) {
  const NO_PASSWORD = "";
  const seed = mnemonicToSeedSync(mnemonic || DEFAULT_MNEMONIC, NO_PASSWORD);
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  console.log(
    `User Account: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet}`
  );
  return keypair;
}

async function airdropSolToUserAccount(keypair) {
  try {
    await connection.requestAirdrop(keypair.publicKey, 1000000000);
  } catch (error) {
    console.log(`Could not airdrop: ${error}`);
  }
}

async function createMintAccount(keypair) {
  const decimals = 0;
  const publicKey = await createMint(
    connection,
    keypair,
    keypair.publicKey,
    keypair.publicKey,
    decimals
  );
  console.log(
    `Token Mint Account: https://solscan.io/address/${publicKey.toBase58()}?cluster=devnet`
  );
  return publicKey;
}

async function createTokenAccount(mint, keypair) {
  try {
    const account_address = await createAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    console.log(
      `Token Account: https://solscan.io/address/${account_address}?cluster=devnet`
    );
    return account_address;
  } catch (error) {
    console.log(`createTokenAccount error: ${error.message}`);
    throw error;
  }
}

async function mint(keypair, mint, tokenAccount) {
  try {
    const transactionSignature = await mintTo(
      keypair,
      mint,
      tokenAccount,
      keypair,
      10
    );
    console.log(
      `Transaction hash: https://solscan.io/tx/${transactionSignature}?cluster=devnet`
    );
    return transactionSignature;
  } catch (error) {
    console.log(`mint error: ${error.message}`);
  }
}

// (async () => {
//   const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
//   const keypair = getUserAccount();
//   await airdropSolToUserAccount(keypair, connection);
//   const mintAccountPubkey = await createMintAccount(connection, keypair);
//   const tokenAccountAddress = await createTokenAccount(
//     connection,
//     mintAccountPubkey,
//     keypair
//   );
//   const transactionHash = await mint(
//     connection,
//     keypair,
//     mintAccountPubkey,
//     tokenAccountAddress
//   );

//   //   const number_of_tokens = 1 * Math.pow(10, MINT_CONFIG.numDecimals);
//   //   let mint = await createMintToInstruction(
//   //     mintKeypair.publicKey,
//   //     mintAuthority,
//   //     tokenAccountAddress,
//   //     number_of_tokens
//   //   );
// })();

function generateSolanaKeypair() {
  const mnemonic = generateMnemonic();
  console.log("Mnemonic:", mnemonic);

  const seed = mnemonicToSeedSync(mnemonic, "");
  const keypair = Keypair.fromSeed(seed.slice(0, 32));

  console.log("Public Key:", keypair.publicKey.toBase58());

  return keypair;
}
