npm run install
npm run start

The code will: 
1. Fetch 3 accounts
   - Platform (The token issuer)
   - Minter (Tweed)
   - Destination (End User)

2. Create a `Mint Account`
3. Add `Metadata Account` using the Metaplex UMI SDK
4. Create a `Destination Token Account` under the destination account
5. Mint the token from the `Mint Account` to the `Destination Token Account`


![Screenshot 2024-01-23 at 15 46 18](https://github.com/paytweed/Solana-POC/assets/107198516/9a1cb5b8-8e5c-4ff9-8f71-29ca2f4bdfea)
