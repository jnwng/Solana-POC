import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMint } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

import dotenv from "dotenv";
dotenv.config();

const DEFAULT_MNEMONIC =
  "trouble sport ignore faint hidden mushroom van future naive spike issue sheriff";
const TWEED_WALLET_MNEMONIC = process.env.TWEED_WALLET_MNEMONIC; // devnet address 2SaEtKn292eAgHnfypJMGkUPXfHhZvMt4VjXKLXJBxbf

//Connection and Umi instance
const endpoint = clusterApiUrl("devnet");
const umi = createUmi(endpoint);
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//Constants
const mplProgramId = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const mint = new PublicKey("4EttqH8nm4SRyNGsvUnzGhh8it6VCU87zvfkWpx2rZkn");
const [metadata] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), mplProgramId.toBytes(), mint.toBytes()],
  mplProgramId
);

export function getUserAccount(mnemonic) {
  const NO_PASSWORD = "";
  const seed = mnemonicToSeedSync(mnemonic || DEFAULT_MNEMONIC, NO_PASSWORD);
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  console.log(
    `User Account: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet}`
  );
  return keypair;
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
  console.log(
    `Token Mint Account: https://solscan.io/address/${publicKey.toBase58()}?cluster=devnet`
  );
  return publicKey;
}

const main = async () => {
  try {
    const ownerKeypair = getUserAccount();
    const mintKeypair = getUserAccount(process.env.TWEED_WALLET_MNEMONIC);

    const instructionArgs = {
      mint,
      mintAuthority: mintKeypair,
      //payer: keypair,
      //updateAuthority: keypair.publicKey,
      data: {
        name: "Test Nft",
        symbol: "TEST",
        uri: "https://static.wixstatic.com/media/0fe759_eed11ea2e1c240b1847f0cfa80b9290b~mv2.png/v1/fill/w_260,h_294,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/%D7%A1%D7%91%D7%AA%D7%90%20%D7%A4%D7%99%D7%91%D7%99.png",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: false,
      collectionDetails: null,
    };

    //The tx builder expects the type of mint authority and signer to be `Signer`, so built a dummy Signer instance
    const signer = {
      publicKey: fromWeb3JsPublicKey(mintKeypair.publicKey),
      signTransaction: null,
      signMessage: null,
      signAllTransactions: null,
    };

    //Metadata account IX Accounts
    const accounts = {
      metadata: fromWeb3JsPublicKey(metadata),
      mint: fromWeb3JsPublicKey(mint),
      payer: signer,
      mintAuthority: mintKeypair,
      updateAuthority: fromWeb3JsPublicKey(ownerKeypair.publicKey),
    };

    //Arguments merged to match the parameter required by the method
    const fullArgs = { ...accounts, ...instructionArgs };

    const metadataBuilder = createMetadataAccountV3(umi, fullArgs);

    (async () => {
      const ix = metadataBuilder.getInstructions()[0];
      ix.keys = ix.keys.map((key) => {
        const newKey = { ...key };
        newKey.pubkey = toWeb3JsPublicKey(key.pubkey);
        return newKey;
      });

      const tx = new Transaction().add(ix);
      const sig = await sendAndConfirmTransaction(connection, tx, [
        ownerKeypair,
        mintKeypair,
      ]);

      console.log(`   Successfully updated ${mint} metadata!🎉`);
      console.log(
        `   Transaction: https://solscan.io/tx/${sig}?cluster=devnet`
      );
    })();
  } catch (error) {
    console.log({ error });
  }
};

main();
