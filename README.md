1. `Change .evn.templeate to .env`
2. Add 3 mnemonic phrases to the `.evn`
3. Run the code by hitting:
`npm run install` and `npm run start`

The code will: 
- Fetch 3 accounts
   - Platform (The token issuer)
   - Minter (Tweed)
   - Destination (End User)

- Create a `Mint Account`
- Add `Metadata Account` using the Metaplex UMI SDK
- Create a `Destination Token Account` under the destination account
- Mint the token from the `Mint Account` to the `Destination Token Account`


![Screenshot 2024-01-23 at 15 46 18](https://github.com/paytweed/Solana-POC/assets/107198516/9a1cb5b8-8e5c-4ff9-8f71-29ca2f4bdfea)
