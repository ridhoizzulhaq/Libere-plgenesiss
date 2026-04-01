---
noteId: "727c82802b9511f196bfa7e8c94680e7"
tags: []

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Libere** is a decentralized digital library platform on Base Sepolia blockchain. Users can publish, purchase, donate, borrow, and read EPUB/PDF books and listen to audiobooks as ERC-1155 NFTs with USDC payments and gasless transactions.

## Key Technologies

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Auth & Wallet**: Privy (embedded wallets + ERC-4337 smart wallets for gasless txs)
- **Blockchain**: Base Sepolia testnet — viem v2 + ethers v6 + permissionless
- **Payment**: USDC (6 decimals) — `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Storage**: Supabase Storage (current) + Pinata/IPFS (legacy) for book files
- **Database**: Supabase (Book + Library tables)
- **Readers**: react-reader (EPUB), react-pdf (PDF), HTML5 audio (audiobook)
- **PWA**: vite-plugin-pwa with Workbox

## Development Commands

```bash
npm run dev          # Dev server at http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run preview      # Preview production build

# Utility scripts (run with tsx)
npm run migrate:epubs    # Migrate EPUB files from IPFS to Supabase Storage
npm run migrate:simple   # Simple migration utility
npm run test:supabase    # Test Supabase connection
npm run sync:libraries   # Sync library NFTs data

# Additional scripts (not in package.json)
npx tsx scripts/debug-library-access.ts
npx tsx scripts/list-books.ts
```

## Smart Contracts

### Main Marketplace — `0xC12F333f41D7cedB209F24b303287531Bb05Bc67`
- `createItem()` — Publish new book NFT (currently `onlyOwner` restricted)
- `purchaseItem()` — Buy book with USDC (2-step: approve then purchase)
- `purchaseItemForLibrary()` — Donate book to library pool
- ABI: [src/smart-contract.abi.ts](src/smart-contract.abi.ts)

### Library Pool — `0xA31D6d3f2a6C5fBA99E451CCAAaAdf0bca12cbF0`
- `borrowFromPool(tokenId)` — Borrow book (returns recordId)
- `returnMyBorrow(tokenId)` — Return borrowed book
- `getActiveBorrows(address)` — Returns `BorrowView[] { recordId, tokenId, expiry }`
- `usableBalanceOf(address, tokenId)` — Check if user has active borrow
- ABI: [src/library-pool.abi.ts](src/library-pool.abi.ts)

## Architecture

### Application Entry Point

```
src/main.tsx → Providers (Privy) → CurrencyProvider → BrowserRouter → SubdomainRouter → Routes
```

`App.tsx` in root is an unused Vite template leftover. Actual entry is `src/main.tsx`.

`main.tsx` suppresses browser extension iframe errors from the EPUB reader iframe — these are harmless.

### Route Structure

**Public:**
- `/` → redirect to `/books`
- `/auth` → AuthScreen
- `/books` → HomeScreen
- `/books/:id` → BookDetailScreen
- `/libraries/:id` → LibraryDetailScreen

**Protected** (Privy auth required):
- `/libraries` → LibraryListScreen
- `/bookselfs` → BookselfScreen
- `/read-book/:id` → DocumentReaderScreen (unified EPUB/PDF reader)
- `/read-pdf/:id` → redirects to `/read-book/:id` (backward compat)
- `/listen-audiobook/:id` → AudiobookPlayerScreen
- `/publish` → CreateBookV2Screen (disabled — `onlyOwner` restriction)

### Subdomain Routing ([src/routes/SubdomainRouter.tsx](src/routes/SubdomainRouter.tsx))

Library subdomains auto-redirect to their library page:
- `theroom19.libere.digital` → `/libraries/theroom19`
- Allowed paths on subdomains: `/libraries/:slug`, `/read-book/:id`, `/listen-audiobook/:id`
- All other subdomain paths redirect to the library's detail page

### Document Reader Flow ([src/pages/DocumentReaderScreen.tsx](src/pages/DocumentReaderScreen.tsx))

1. Verify NFT ownership (`balanceOf`) OR library borrow (`usableBalanceOf`) — access if either > 0
2. Fetch book metadata from Supabase
3. Auto-detect file type via [src/utils/documentType.ts](src/utils/documentType.ts)
4. Route to: EpubReaderScreen (react-reader) or PdfRenderer (react-pdf)

Same access check pattern used in AudiobookPlayerScreen.

### Transaction Pattern

All writes use Privy smart wallet (`useSmartWallets`) for gasless execution:
```typescript
const { client } = useSmartWallets();
await client.sendTransaction({ chain: baseSepolia, to, data, value: BigInt(0) });
```

All reads use `readContract` from viem with a `createPublicClient`.

USDC purchases are 2 steps: `approve(contractAddress, price)` on USDC token, then `purchaseItem()`.

## Key Data Notes

- **`Book.priceEth`** — misleadingly named; stores USDC units (6 decimals), not ETH wei. `"1000000"` = 1.00 USDC.
- **`Book.epub`** — misleadingly named; stores document URL (EPUB or PDF).
- **`Book.fileType`** — optional `'epub' | 'pdf'`, defaults to `'epub'` if absent.
- **`Book.audiobook`** — optional MP3 URL for audiobook companion.
- **Royalties** — stored as basis points (500 = 5%).

## Supabase Schema

- `Book` table — book metadata (fields map to `Book` interface in [src/core/interfaces/book.interface.ts](src/core/interfaces/book.interface.ts))
- `Library` table — library pool info (fields map to `Library` interface in [src/core/interfaces/library.interface.ts](src/core/interfaces/library.interface.ts))
- Storage bucket: `libere-books` — EPUB, PDF, MP3, and image files

## PWA Caching Strategy ([vite.config.ts](vite.config.ts))

- EPUB files: **NetworkOnly** (security — never cache)
- Supabase signed URLs: **NetworkOnly** (expire quickly)
- Supabase API: **NetworkFirst** (5 min cache)
- MP3 audiobooks: **CacheFirst** (7 day cache, 10MB/file limit — offline playback)
- Pinata/IPFS images: **CacheFirst** (24 hour cache)

## WatermarkOverlay ([src/components/reader/WatermarkOverlay.tsx](src/components/reader/WatermarkOverlay.tsx))

All readers display the user's wallet address as a diagonal repeating watermark + borrow expiry countdown for borrowed books.

## Category System ([src/utils/categoryColors.ts](src/utils/categoryColors.ts))

Categories: `'Fiksi'`, `'Non-Fiksi'`, `'Sejarah'`, `'Teknologi'`, `'Seni'`, `'All'`

Monochrome grayscale color scheme. Use `getCategoryColors(cat)` or `getCategoryBadgeColors(cat)`.

## StandaloneLayout ([src/components/layouts/StandaloneLayout.tsx](src/components/layouts/StandaloneLayout.tsx))

Minimal layout for library-branded subdomain pages. Props: `librarySlug`, `libraryLogo`, `showScrollNav`. Includes sticky header, wallet dropdown, smooth scroll navigation.

## Civilib Components ([src/components/civilib/](src/components/civilib/))

Library-specific book display components used in `LibraryDetailScreen`. `CivilibBookList` renders books from a library pool; `CivilibAccessButton` handles borrow/return flow specific to library subdomain pages.

## Smart Contract Development (Foundry)

```bash
forge build
forge test
forge test --gas-report
forge script smartcontract/upgradeable/Deploy.s.sol --rpc-url base-sepolia --broadcast
```

Contract source in `smartcontract/upgradeable/`:
- `Libere1155CoreUpgradeable.sol` — main marketplace (UUPS)
- `LibraryPoolUpgradeable.sol` — borrowing pool (UUPS)

Solidity 0.8.20, Shanghai EVM target.

## Known Issues

1. **`createItem()` is `onlyOwner`** — publishing disabled for regular users. See [SOLUTION_ONLYOWNER_ISSUE.md](SOLUTION_ONLYOWNER_ISSUE.md).
2. **`setPaymentToken()`** must be called on the marketplace contract with the USDC address before purchases work.
3. Users need Base Sepolia testnet USDC to make purchases.

## Environment Variables

```env
VITE_PRIVY_APP_ID=
VITE_PRIVY_CLIENT_ID=
VITE_PINATA_API_KEY=
VITE_PINATA_SECRET_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_API_KEY=
VITE_BASE_SEPOLIA_LIBRARY_URL=
VITE_BASE_SEPOLIA_LIBRARY_BASE_URL=

# For Foundry scripts only:
BASE_SEPOLIA_RPC_URL=
BASESCAN_API_KEY=
PRIVATE_KEY=
```
