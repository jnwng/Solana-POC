const web3 =  require('@solana/web3.js');
const bip39 =  require("bip39");
const splToken = require('@solana/spl-token');

require('dotenv').config()

function getUserAccount() {
    const NO_PASSWORD = ""
    const seed = bip39.mnemonicToSeedSync(process.env.SOLANA_SEED_PHRASE, NO_PASSWORD); 
    const keypair = web3.Keypair.fromSeed(seed.slice(0, 32));
    console.log(`User Account: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}?cluster=devnet}`);
    return keypair;
}

async function airdropSolToUserAccount() {
    try {
        await connection.requestAirdrop(keypair.publicKey, 1000000000);
    } catch (error) {
        console.log("Could not airdrop")
    }
}

async function createMintAccount(connection, keypair) {
    const decimals = 8;
    const publicKey = await splToken.createMint(connection, keypair, keypair.publicKey, keypair.publicKey, decimals);
    console.log(`Token Mint Account: https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`);
    return publicKey;
}

async function createTokenAccount(connection, mint, keypair) {
    const account_address = await splToken.createAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
    console.log(`Token Account: https://explorer.solana.com/address/${account_address}?cluster=devnet`);
    return account_address;
}

async function mint(connection, keypair, mint, tokenAccount) {
    console.log(`${connection} ${keypair} ${mint} ${tokenAccount}`)
    const transactionSignature = await splToken.mintTo(connection, keypair, mint, tokenAccount, keypair, 1);
    console.log(`Transaction hash: ${transactionSignature}`)
    return transactionSignature;
}

(async () => {
    const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
    const keypair = getUserAccount();
    await airdropSolToUserAccount();
    const mintAccountPubkey = await createMintAccount(connection, keypair);
    const tokenAccountAddress = await createTokenAccount(connection, mintAccountPubkey, keypair);
    const transactionHash = await mint(connection, keypair, mintAccountPubkey, tokenAccountAddress);
    

    // const number_of_tokens = 1 * Math.pow(10, MINT_CONFIG.numDecimals)
    // let mint = await splToken.createMintToInstruction(
    //     mintKeypair.publicKey, 
    //     mintAuthority, 
    //     tokenAccountAddress, 
    //     number_of_tokens);


})();