import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import { createMint, createAssociatedTokenAccount, mintTo} from "@solana/spl-token";

import dotenv from "dotenv";
import { addMetadataToToken } from "./update_metadata.js";
dotenv.config();

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

function styled_log(log) {
  console.log("-------------------------------------------------");
  console.log(log)
  console.log("-------------------------------------------------");
}

export function getUserAccount(mnemonic) {
  const NO_PASSWORD = "";
  const seed = mnemonicToSeedSync(mnemonic, NO_PASSWORD);
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  styled_log(`User Account: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet}`);
  return keypair;
}

async function createMintAccount(keyPair, mintAuthorityPubKey) {
  const decimals = 0; //Must for NFT
  
  const mintPublicKey = await createMint(
    connection,
    keyPair,              //Payer
    mintAuthorityPubKey,  //mintAuthority
    keyPair.publicKey,    //freezeAuthority
    decimals
  );

  styled_log(`Token Mint Account: https://solscan.io/address/${mintPublicKey.toBase58()}?cluster=devnet`);
  return mintPublicKey;
}

async function createTokenAccount(mint, payer, owner) {
    const tokenAccPubKey = await createAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
    );

    styled_log(`Token Account: https://solscan.io/address/${tokenAccPubKey}?cluster=devnet`);
    return tokenAccPubKey;
}

async function mint(mintAccountPubkey, destinationTokenAccountPubkey, mintAuthorityKeypair) {
    const transactionSignature = await mintTo(
      connection,
      mintAuthorityKeypair, // tweed is the payer for the mint
      mintAccountPubkey,
      destinationTokenAccountPubkey,
      mintAuthorityKeypair, // tweed is a mint authority
      10
    );

    styled_log(`Transaction hash: https://solscan.io/tx/${transactionSignature}?cluster=devnet`);

    return transactionSignature;
}

async function main() {
  const platformKeypair = getUserAccount(process.env.PLATFORM_MNEMONIC);              //devnet address 8TDZ7JWKUnhhtQsYa7e6mepj2txVN4VbuvSTn4MdcZWc
  const mintAuthorityKeypair = getUserAccount(process.env.TWEED_WALLET_MNEMONIC);     //devnet address 2SaEtKn292eAgHnfypJMGkUPXfHhZvMt4VjXKLXJBxbf
  const destinationKeypair = getUserAccount(process.env.DESTINATION_WALLET_MNEMONIC); //devnet address DSrxq6niWEh2GXJUERiyz2MQQfpzYqieAnW7Vd3fDH5S
  
  const mintAccountPubkey = await createMintAccount(platformKeypair, mintAuthorityKeypair.publicKey);
  const metaDataAccount = await addMetadataToToken(mintAccountPubkey, platformKeypair, mintAuthorityKeypair);
  const destinationTokenAccountPubkey = await createTokenAccount(mintAccountPubkey, mintAuthorityKeypair, destinationKeypair.publicKey);
  const txSig = await mint(mintAccountPubkey, destinationTokenAccountPubkey, mintAuthorityKeypair);
}

main();