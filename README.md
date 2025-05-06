# 🖼️ Sui NFT Minting dApp

A Sui-based NFT minting decentralized app (dApp) with whitelist support, random traits, and dynamic on-chain metadata.

---

## ✨ Features

### 🛠 **Move Smart Contract**
- ✅ Create simple NFTs on the Sui blockchain.
- ✅ Allow owner to whitelist multiple wallet addresses for **free minting**.
- ✅ Provide **public minting** for non-whitelisted users (paid).
- ✅ On each mint:
  - Automatically mint a new NFT.
  - Randomly select NFT traits or images.
  - Dynamically generate metadata on the fly.

---

### 💻 **Frontend (Next.js)**
- ✅ Built using **Next.js** for fast, modern frontend.
- ✅ Connect Sui wallet (supports Sui Wallet, Suiet).
- ✅ Show mint button:
  - Free mint for whitelisted users.
  - Paid mint for public users.
- ✅ Interact with the smart contract to:
  - Check whitelist status.
  - Call minting functions.
  - Display details of the minted NFT (including traits, image, metadata).

---

## 🚀 Tech Stack

| Layer        | Tech                       |
|-------------|----------------------------|
| Blockchain   | Sui, Move smart contracts  |
| Frontend     | Next.js, React, TailwindCSS (optional) |
| Wallets      | Sui Wallet, Suiet          |
| Tools        | Sui CLI, Sui Explorer      |

---

## 🏗 Setup Instructions

### 📦 Smart Contract

1️⃣ **Install Sui CLI**
- Follow: [https://docs.sui.io/build/install](https://docs.sui.io/build/install)

2️⃣ **Build Move Contract**
```bash
sui move build
```

3️⃣ **Deploy Move Contract**
```bash
sui client publish
```

