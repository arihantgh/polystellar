# Memory

## Project Overview
Decentralized prediction market on Stellar Soroban. See `README.md` for full details.

## Architecture

```
polystellar/
├── contracts/           # Rust smart contract (Soroban SDK 21.0.0)
│   └── src/{lib,market,types}.rs
├── frontend/            # Vite 5 + React 18 + TailwindCSS 3
│   └── src/{pages,components,contexts,services,utils}/
└── scripts/             # bash helpers for build/deploy
```

- **Entrypoints**: `contracts/src/lib.rs` (Soroban contract), `frontend/src/main.jsx` (React SPA)
- **No monorepo tool** — each package managed independently
- **No test framework** for frontend (only contract tests exist)

## Commands

```sh
# Contracts (run from contracts/)
cargo test                    # unit tests only
soroban contract build         # WASM build
scripts/build-contracts.sh     # full build (checks wasm target)

# Frontend (run from frontend/)
npm install && npm run dev     # dev server on :3000
npm run build                  # production build → dist/
npm run preview                # preview production build
npm run deploy                 # build + wrangler pages deploy

# Deploy all
scripts/deploy-contracts.sh testnet deployer  # build + deploy to testnet
scripts/deploy-frontend.sh                     # build + Cloudflare Pages deploy
scripts/create-test-market.sh CONTRACT_ID      # helper for test markets
```

## Gotchas

- **Stellar 7-decimal precision**: All amounts use `i128` with 7 decimals (e.g. 100 tokens = `100_0000000`)
- **Claim-winnings bug**: `market.rs:366-386` — payout uses pool shares instead of total user holdings. The calculation is documented as incorrect in source comments
- **Market ID 1 blocked**: Hardcoded in `frontend/src/config/constants.js:46` as `BLOCKED_MARKET_IDS = [1]`
- **Hardcoded contract addresses**: `frontend/src/config/constants.js` — must update `CONTRACT_ID` and `TOKEN_ID` after each deploy
- **No HMR on network**: Vite dev server is localhost-only (`server.host` not set in `vite.config.js`)
- **`soroban` CLI required** for contract build/deploy, `wrangler` for frontend deploy
- **Contract uses `soroban-sdk` 21.0.0** — important for version compatibility
