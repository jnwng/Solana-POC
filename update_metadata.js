import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import {  nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage'
import dotenv from "dotenv";
import  fs  from 'fs'
dotenv.config();

// constants
const umi = createUmi(clusterApiUrl("devnet"));
umi.use(nftStorageUploader({ token: process.env.NFT_STORAGE_TOKEN }))


const connection = new Connection(clusterApiUrl("devnet"), 'confirmed')
const mplProgramId = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);


async function createUri() {
  const imageBuffer =  fs.readFileSync("/Users/alisamakarova/Desktop/fibi.png")
  const file = {
    buffer: imageBuffer,
    fileName: "testNft",
    displayName: "test nft",
    uniqueName: "fibiNft",
    contentType: 'image/png',
    extension: 'png',
    tags: [{name: 'test', value: 'test'}]

  }
  
  const fileUri = await umi.uploader.upload([file])
  
  // Upload the JSON metadata.
  const uri = await umi.uploader.uploadJson({
    name: 'My NFT #1',
    description: 'My description',
    image: fileUri,
  })

  console.log({uri})
  return uri
}

export async function updateTokenMetadata(
  mint,
  ownerKeypair,
  mintAuthorityKeypair
) {
  try {
    const [metadata] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), mplProgramId.toBytes(), mint.toBytes()],
      mplProgramId
    );
    const uri = await createUri()

    const instructionArgs = {
      mint,
      mintAuthority: mintAuthorityKeypair,
      //payer: keypair,
      updateAuthority: ownerKeypair.publicKey, // could affect token type
      data: {
        name: "Test Nft",
        symbol: "TEST",
        uri,
        sellerFeeBasisPoints: 0,
        creators: [
          {
            address: fromWeb3JsPublicKey(ownerKeypair.publicKey),
            verified: true,
            share: 100,
          },
        ], // could affect token type
        collection: {
          // could affect token type
          verified: false,
          key: mint,
        },
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    };

    //The tx builder expects the type of mint authority and signer to be `Signer`, so built a dummy Signer instance
    const signer = {
      publicKey: fromWeb3JsPublicKey(mintAuthorityKeypair.publicKey),
      signTransaction: null,
      signMessage: null,
      signAllTransactions: null,
    };

    //Metadata account IX Accounts
    const accounts = {
      metadata: fromWeb3JsPublicKey(metadata),
      mint: fromWeb3JsPublicKey(mint),
      payer: signer,
      mintAuthority: mintAuthorityKeypair,
      updateAuthority: fromWeb3JsPublicKey(ownerKeypair.publicKey),
    };

    //Arguments merged to match the parameter required by the method
    const fullArgs = { ...accounts, ...instructionArgs };

    const metadataBuilder = createMetadataAccountV3(umi, fullArgs);

    const ix = metadataBuilder.getInstructions()[0];
    ix.keys = ix.keys.map((key) => {
      const newKey = { ...key };
      newKey.pubkey = toWeb3JsPublicKey(key.pubkey);
      return newKey;
    });

    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [
      ownerKeypair,
      mintAuthorityKeypair,
    ]);

    console.log(`   Successfully updated ${mint} metadata!🎉`);
    console.log(`   Transaction: https://solscan.io/tx/${sig}?cluster=devnet`);
  } catch (error) {
    console.log("updateTokenMetadata error:" + { error });
    throw error;
  }
}
