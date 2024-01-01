import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import {
  AuthorityType,
  createSetAuthorityInstruction,
  createMint,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccount,
  mintTo,
  createMintToInstruction,
} from "@solana/spl-token";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";

// require("dotenv").config();

const mnemonic =
  "trouble sport ignore faint hidden mushroom van future naive spike issue sheriff";

function getUserAccount() {
  const NO_PASSWORD = "";
  const seed = mnemonicToSeedSync(mnemonic, NO_PASSWORD);
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

async function createNft() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const payerKeypair = getUserAccount();

  const mint = await createMint(
    connection,
    payerKeypair,
    payerKeypair.publicKey,
    payerKeypair.publicKey,
    0
  );

  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    mint,
    payerKeypair.publicKey
  );

  await mintTo(
    connection,
    payerKeypair,
    mint,
    associatedTokenAccount.address,
    payerKeypair,
    1
  );

  let transaction = new Transaction().add(
    createSetAuthorityInstruction(
      mint,
      payerKeypair.publicKey,
      AuthorityType.MintTokens,
      null
    )
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payerKeypair]
  );

  console.log(
    `Transaction hash: https://solscan.io/tx/${transactionSignature}?cluster=devnet`
  );
}

async function createNftWithMetadata() {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const payerKeypair = getUserAccount();

    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(payerKeypair))
      .use(bundlrStorage({ address: "https://devnet.bundlr.network" }));

    const { uri } = await metaplex.nfts().uploadMetadata({
      name: "Fibi NFT",
      maxSupply: 1,
      image:
        "https://static.wixstatic.com/media/0fe759_eed11ea2e1c240b1847f0cfa80b9290b~mv2.png/v1/fill/w_260,h_294,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/%D7%A1%D7%91%D7%AA%D7%90%20%D7%A4%D7%99%D7%91%D7%99.png",
    });

    const { nft } = await metaplex.nfts().create({
      name: "Fibi's first NFT",
      uri,
    });

    console.log(`   Success!🎉`);
    console.log(
      `   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`
    );
  } catch (error) {
    console.log({ error });
  }
}

createNftWithMetadata();
