import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { getUserAccount } from "./solana";
import {
  createAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import { Connection } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

async function generateTokenAccount(nftAddress, ownerWallet, payerWallet) {
  const ata = await createAssociatedTokenAccount(
    connection,
    payerWallet,
    nftAddress, // mint (nft)
    ownerWallet.publicKey // owner of created ata,
  );

  return ata;
}

// mints directly to the wallet
async function createNftWithMetadata(payerKeypair) {
  try {
    const metaplex = Metaplex.make(connection).use(
      keypairIdentity(payerKeypair || getUserAccount())
    );

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

// transfer minted nft from one token account to another
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
