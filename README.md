# Cashcode｜Stablecoin Wallet Landing Page

**Stablecoins, paid by sharing a code.**

Cashcode is a Base-powered stablecoin payment app that enables peer‑to‑peer transfers via **Check Codes** and **Payment Links**. Users can issue and share one‑time check codes or instant payment links in USDC/USDT — with zero gas claims, stoppable or expirable logic, and unified ledger tracking.

---

## 🌐 Multi‑Language Support
- Chinese (cn)
- English (en)
- Japanese (ja)

Language switching is built‑in via the helper function `t(cn, en, ja)`.

---

## 🧱 Tech Stack
- **Framework:** React + TailwindCSS (single‑file landing page)
- **Wallets:** MetaMask / Coinbase Wallet (EIP‑1193 provider)
- **Blockchain:** Base Mainnet (Chain ID 8453)
- **On‑chain library:** `ethers v6` (BrowserProvider + Contract)
- **Core modules:**
  - Issue Check (calls `Check.issue` on chain)
  - Generate payment links
  - Local high‑entropy secret `S` → on‑chain hash `H`
  - Stop / Expire / Extend / Auto‑refund support

---

## ⚙️ Environment Variables
Before deploying, set the following in your `.env` file:

```bash
NEXT_PUBLIC_USDC_BASE=<Base_USDC_contract_address>
NEXT_PUBLIC_CHECK_CONTRACT=<Check_contract_address>
```

---

## 🚀 Run Locally
```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```
Visit **http://localhost:5173** to preview.

---

## 💳 Features Overview
- 🧾 **Check Code:** One‑time hashlocked payment with stop/expiry controls.
- 🔗 **Payment Link:** Instant consent‑to‑pay flow with optional 0‑gas sponsorship.
- 💸 **Direct Send:** Instant transfer to known addresses.
- 📒 **Unified Ledger:** Exportable CSV‑style financial reconciliation.
- 🛡️ **Security Highlights:**
  - EIP‑712 templated intents (no arbitrary calldata)
  - Paymaster whitelist for 0‑gas redemptions
  - MPC / Passkey seedless onboarding (AA‑ready)

---

## 📁 Directory Structure
```
CashcodeLanding.jsx     # Main React component (single file)
index.css               # TailwindCSS entry
vite.config.js          # Vite configuration
```

---

## 🧪 Demo Mode
- Default mode is **demo‑only** (local code generation, no transactions).
- When enabling **Real On‑Chain Mode**:
  - Approves USDC (if needed)
  - Calls `Check.issue` on Base Mainnet
  - Verifiable on [basescan.org](https://basescan.org)

---

## 🪙 Supported Assets & Networks
| Token | Network | Status |
|--------|----------|---------|
| USDC | Base | ✅ Live |
| USDT | Base | 🚧 Coming soon |
| USDC / USDT | OP / Arbitrum | 🕐 Planned |

---

## 📜 License
MIT License © 2025 Cashcode / 码信钱包

---

## 🔗 Links
- 🌐 Website → [https://cashcode.app](https://cashcode.app)
- 📘 Docs → [https://docs.cashcode.app](https://docs.cashcode.app)
- 🧑‍💻 GitHub → [https://github.com/CashcodeApp](https://github.com/CashcodeApp)

---

> **Cashcode: The check system for the stablecoin era.**  
> Simple, stoppable, borderless payments for everyone.
