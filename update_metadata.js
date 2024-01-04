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

// constants
const umi = createUmi(clusterApiUrl("devnet"));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const mplProgramId = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

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

    const instructionArgs = {
      mint,
      mintAuthority: mintAuthorityKeypair,
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
