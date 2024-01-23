import {createMetadataAccountV3} from "@metaplex-foundation/mpl-token-metadata";
import {clusterApiUrl} from "@solana/web3.js";
import {createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import {generateSigner, signerIdentity} from "@metaplex-foundation/umi";
import {fromWeb3JsPublicKey} from '@metaplex-foundation/umi-web3js-adapters'

export async function addMetadataToToken(mintAccountPubkey, platformKeypair, mintAuthKeypair) {
  const chain = clusterApiUrl("devnet");
  const umi = createUmi(chain).use(signerIdentity(platformKeypair));
  const signer = generateSigner(umi);

  const CreateMetadataAccountV3Args = {
    mint: mintAccountPubkey,
    mintAuthority: platformKeypair,
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
  let transaction = (await transactionBuilder.setLatestBlockhash(umi)).build(umi)
  let signTransaction = signer.signTransaction(transaction)
  //const signature = await umi.rpc.sendTransaction(signTransaction)
  //let txHash = await umi.rpc.sendTransaction(transaction)
}