import {createMetadataAccountV3} from "@metaplex-foundation/mpl-token-metadata";
import {clusterApiUrl} from "@solana/web3.js";
import {createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import {generateSigner, signerIdentity, createSignerFromKeypair} from "@metaplex-foundation/umi";
import {fromWeb3JsKeypair} from '@metaplex-foundation/umi-web3js-adapters'

export async function addMetadataToToken(mintAccountPubkey, platformKeypair, mintAuthKeypair) {
  const chain = clusterApiUrl("devnet");
  const umi = createUmi(chain);
  const signer = generateSigner(umi);

  const CreateMetadataAccountV3Args = {
    mint: mintAccountPubkey,
    mintAuthority: mintAuthKeypair,
    payer: platformKeypair,
    updateAuthority: platformKeypair.publicKey,
    data: {
        name: "UDI Token",
        symbol: "UDI",
        uri: "google.com",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    },
    isMutable: false,
    collectionDetails: null
  }
  
  let transactionBuilder = createMetadataAccountV3(umi, CreateMetadataAccountV3Args)

  transactionBuilder = transactionBuilder.setFeePayer(createSignerFromKeypair(umi, fromWeb3JsKeypair(platformKeypair)))
  let transaction = await transactionBuilder.buildAndSign(umi);

  const signature = await umi.rpc.sendTransaction(transaction);
  const confirmResult = await umi.rpc.confirmTransaction(signature, {
    strategy: { type: 'blockhash', ...(await umi.rpc.getLatestBlockhash()) }
  });



  //const signature = await umi.rpc.sendTransaction(signTransaction)
  //let txHash = await umi.rpc.sendTransaction(transaction)
}