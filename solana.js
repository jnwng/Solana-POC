import {
  Connection,
  Keypair,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import { mnemonicToSeedSync, generateMnemonic } from "bip39";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  transferChecked,
  closeAccount,
} from "@solana/spl-token";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";

// require("dotenv").config();

const DEFAULT_MNEMONIC =
  "trouble sport ignore faint hidden mushroom van future naive spike issue sheriff";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

function getUserAccount(mnemonic) {
  const NO_PASSWORD = "";
  const seed = mnemonicToSeedSync(mnemonic || DEFAULT_MNEMONIC, NO_PASSWORD);
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  console.log(
    `User Account: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet}`
  );
  return keypair;
}

async function airdropSolToUserAccount(keypair, connection) {
  try {
    await connection.requestAirdrop(keypair.publicKey, 1000000000);
  } catch (error) {
    console.log(`Could not airdrop: ${error}`);
  }
}

async function createMintAccount(connection, keypair) {
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

async function createTokenAccount(connection, mint, keypair) {
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

async function mint(connection, keypair, mint, tokenAccount) {
  try {
    const transactionSignature = await mintTo(
      connection,
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
//   const connection = new Connection(
//     clusterApiUrl("devnet"),
//     "confirmed"
//   );
//   const keypair = getUserAccount();
//   //await airdropSolToUserAccount(keypair, connection);
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

// mints directly to the wallet
async function createNftWithMetadata(payerKeypair) {
  try {
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(payerKeypair || getUserAccount()))
      .use(bundlrStorage({ address: "https://devnet.bundlr.network" }));

    const { uri } = await metaplex.nfts().uploadMetadata({
      name: "Fibi NFT",
      maxSupply: 1,
      image:
        "https://static.wixstatic.com/media/0fe759_eed11ea2e1c240b1847f0cfa80b9290b~mv2.png/v1/fill/w_260,h_294,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/%D7%A1%D7%91%D7%AA%D7%90%20%D7%A4%D7%99%D7%91%D7%99.png",
    });

    const res = await metaplex.nfts().create({
      name: "Fibi's first NFT",
      uri,
    });

    console.log(`   Success!🎉`);
    console.log(
      `   Minted NFT: https://explorer.solana.com/address/${res.nft.address}?cluster=devnet`
    );

    return {
      nftAddress: res.nft.address,
      tokenAccountAddress: res.tokenAddress,
    };
  } catch (error) {
    console.log({ error });
  }
}

function generateSolanaKeypair() {
  const mnemonic = generateMnemonic();
  console.log("Mnemonic:", mnemonic);

  const seed = mnemonicToSeedSync(mnemonic, "");
  const keypair = Keypair.fromSeed(seed.slice(0, 32));

  console.log("Public Key:", keypair.publicKey.toBase58());

  return keypair;
}

// async function main() {
//   const keypair = generateSolanaKeypair();
//   const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//   await airdropSolToUserAccount(keypair, connection);
//   await createNftWithMetadata(connection, keypair);
// }

async function generateTokenAccount(nftAddress, ownerWallet, payerWallet) {
  const ata = await createAssociatedTokenAccount(
    connection,
    payerWallet,
    nftAddress, // mint (nft)
    ownerWallet.publicKey // owner of created ata,
  );

  return ata;
}

async function mintAndTransferNFT() {
  const senderKeypair = getUserAccount(
    "erosion bean muscle feel clay order spend mammal yard tooth balcony surround"
  );
  // will mint nft to the sender wallet
  const { nftAddress, tokenAccountAddress: sourceTokenAccountAddress } =
    await createNftWithMetadata(senderKeypair);
  const receiverWallet = getUserAccount();
  // create token account for receiver
  const receiverTokenAccount = await generateTokenAccount(
    nftAddress,
    receiverWallet,
    senderKeypair
  );

  try {
    const transferTxHash = await transferChecked(
      connection,
      senderKeypair, // payer
      sourceTokenAccountAddress, // from (should be a token account)
      nftAddress, // mint (nft)
      receiverTokenAccount, // to (should be a token account)
      senderKeypair, // from's owner
      1, // amount, if your deciamls is 8, send 10^8 for 1 token
      0 // decimals
    );

    console.log("-------------------------------------------------");

    console.log(
      `   Successfully transfered nft ${nftAddress} to token account ${receiverTokenAccount}!🎉`
    );
    console.log(
      `   Transaction: https://explorer.solana.com/tx/${transferTxHash}?cluster=devnet`
    );
    console.log("-------------------------------------------------");

    // close source token account address after the transfer
    const accCloseTxHash = await closeAccount(
      connection,
      senderKeypair, // payer
      sourceTokenAccountAddress, // token account which you want to close
      senderKeypair.publicKey, // destination
      senderKeypair // owner of token account
    );

    console.log("-------------------------------------------------");
    console.log(
      `   Successfully closed token account ${sourceTokenAccountAddress}!🎉`
    );
    console.log(
      `   Transaction: https://explorer.solana.com/tx/${accCloseTxHash}?cluster=devnet`
    );
    console.log("-------------------------------------------------");
  } catch (error) {
    console.log({ error });
  }
}

mintAndTransferNFT();
