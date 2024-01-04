import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { mnemonicToSeedSync, generateMnemonic } from "bip39";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import dotenv from "dotenv";
import { updateTokenMetadata } from "./update_metadata.js";
dotenv.config();

const PLATFORMS_MNEMONIC =
  "trouble sport ignore faint hidden mushroom van future naive spike issue sheriff"; // devnet address 8TDZ7JWKUnhhtQsYa7e6mepj2txVN4VbuvSTn4MdcZWc
const DESTINATION_WALLET_MNEMONIC =
  "jelly leopard sad thunder property check champion pig dune meat tape crawl"; // devnet address DSrxq6niWEh2GXJUERiyz2MQQfpzYqieAnW7Vd3fDH5S - user that will receive an nft
const TWEED_WALLET_MNEMONIC = process.env.TWEED_WALLET_MNEMONIC; // devnet address 2SaEtKn292eAgHnfypJMGkUPXfHhZvMt4VjXKLXJBxbf
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export function getUserAccount(mnemonic) {
  const NO_PASSWORD = "";
  const seed = mnemonicToSeedSync(mnemonic || PLATFORMS_MNEMONIC, NO_PASSWORD);
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  console.log("-------------------------------------------------");

  console.log(
    `User Account: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet}`
  );
  console.log("-------------------------------------------------");

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
  const mintAuthorityKeypair = getUserAccount(TWEED_WALLET_MNEMONIC);
  const decimals = 0;
  const publicKey = await createMint(
    connection,
    keypair,
    mintAuthorityKeypair.publicKey,
    keypair.publicKey,
    decimals
  );
  console.log("-------------------------------------------------");

  console.log(`   Successfully created mint account!🎉`);
  console.log(
    `Token Mint Account: https://solscan.io/address/${publicKey.toBase58()}?cluster=devnet`
  );
  console.log("-------------------------------------------------");

  return publicKey;
}

async function createTokenAccount(mint, payer, owner) {
  try {
    const tokenAccPubKey = await createAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
    );
    console.log("-------------------------------------------------");

    console.log(`   Successfully created token account!🎉`);
    console.log(
      `Token Account: https://solscan.io/address/${tokenAccPubKey}?cluster=devnet`
    );
    console.log("-------------------------------------------------");

    return tokenAccPubKey;
  } catch (error) {
    console.log(`createTokenAccount error: ${error.message}`);
    throw error;
  }
}

// this part we will do on our side
async function mint(mintAccountPubkey, destinationTokenAccountPubkey) {
  try {
    const mintAuthorityKeypair = getUserAccount(TWEED_WALLET_MNEMONIC);

    const transactionSignature = await mintTo(
      connection,
      mintAuthorityKeypair, // tweed is payer
      mintAccountPubkey,
      destinationTokenAccountPubkey,
      mintAuthorityKeypair, // tweed is mint authority
      10
    );
    console.log("-------------------------------------------------");

    console.log(`   Successfully minted token to the token account!🎉`);
    console.log(
      `Transaction hash: https://solscan.io/tx/${transactionSignature}?cluster=devnet`
    );
    console.log("-------------------------------------------------");

    return transactionSignature;
  } catch (error) {
    console.log(`mint error: ${error.message}`);
    throw error;
  }
}

async function generateSolanaKeypair() {
  const mnemonic = generateMnemonic();
  console.log("Mnemonic:", mnemonic);

  const seed = mnemonicToSeedSync(mnemonic, "");
  const keypair = Keypair.fromSeed(seed.slice(0, 32));

  await airdropSolToUserAccount(keypair);

  console.log("Public Key:", keypair.publicKey.toBase58());

  return keypair;
}

async function main() {
  // ------------------------ PLATFORM'S PART ------------------------
  const platformsKeypair = getUserAccount();
  const mintAuthorityKeypair = getUserAccount(TWEED_WALLET_MNEMONIC);
  const tokenDestinationOwnerKeypair = getUserAccount(
    DESTINATION_WALLET_MNEMONIC
  );

  console.log(
    "Wallet address that will generate token:" +
      `https://solscan.io/account/${platformsKeypair.publicKey.toBase58()}`
  );

  // await airdropSolToUserAccount(platformsKeypair);

  // creating mint account with tweed mint authority
  const mintAccountPubkey = await createMintAccount(platformsKeypair);

  await updateTokenMetadata(
    mintAccountPubkey,
    platformsKeypair,
    mintAuthorityKeypair
  );

  // ------------------------ OUR PART ------------------------
  const destinationTokenAccountPubkey = await createTokenAccount(
    mintAccountPubkey,
    mintAuthorityKeypair, // tweed wallet,
    tokenDestinationOwnerKeypair.publicKey
  );

  // mint only after metadata has been uploaded
  await mint(mintAccountPubkey, destinationTokenAccountPubkey);
}

main();
