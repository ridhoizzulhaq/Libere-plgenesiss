# Libere

  

> An NFT-powered digital book ecosystem that ensures every writer gets fair royalties, every reader truly owns their book, and every library expands access sustainably.

  

![Libere Flow](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/flow.png?raw=true)

  

[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red)](https://www.youtube.com/watch?v=z-oY35RoUOE)

[![GitHub](https://img.shields.io/badge/Repo-GitHub-black)](https://github.com/ridhoizzulhaq/Libere-plgenesiss)

[![LinkedIn](https://img.shields.io/badge/Builder-LinkedIn-blue)](https://www.linkedin.com/in/ridhoizzulhaq/)

  

---

  

## Hackathon Submission

| | |
|---|---|
| **Event** | PL Genesis: Frontiers of Collaboration |
| **Build Path** | Existing Code |
| **Tracks** | Infrastructure & Digital Rights, Crypto |
| **Sponsor Bounty** | Hypercerts (Funding the Commons) |
| **Hackathon Repo** | [ridhoizzulhaq/Libere-plgenesiss](https://github.com/ridhoizzulhaq/Libere-plgenesiss) — isolated fork with all hackathon-specific changes |
| **Main Repo** | [Libere-digital/libere](https://github.com/Libere-digital/libere) — ongoing production codebase |
| **X / Twitter** | [@ridhoizzulhaq_](https://x.com/ridhoizzulhaq_) |

  

## The Problem

  The digital book industry is built on hidden inequalities that have compounded quietly for years. Platforms like Amazon Kindle and Google Play Books take 30 to 70 percent of every transaction, authors wait up to 90 days to receive royalties, and readers who pay full price can lose access overnight if a platform shuts down. Purchased books cannot be resold or transferred. Amazon, Apple, and Google collectively control over 90 percent of the ebook retail market, leaving creators with almost no leverage.

Libraries face the same imbalance from a different angle. OverDrive, the dominant library ebook platform, operates under publisher-dictated terms that charge institutions three to five times the consumer price for a single license, with expiration limits forcing repurchase of the same title after just 26 loans. The most serious attempt at an alternative was Controlled Digital Lending, a framework proposing that a library owning a physical copy should be permitted to lend one digital version of that same title at a time, mirroring how physical lending works. It was a principled idea, but it was struck down by a federal court in 2023 after major publishers sued the Internet Archive, on the grounds that digitizing a physical book without the copyright holder's permission constitutes reproduction, regardless of the one-to-one ratio. The ruling left libraries more dependent on platform-controlled licensing than ever, and made clear that access to digital knowledge cannot be solved through legal workarounds alone.
  

---

  

## The Solution

Libere rebuilds the digital book ecosystem from the ground up, addressing the broken incentives for every party involved. For authors and publishers, every book minted on Libere triggers instant, automatic royalty payments directly through the smart contract with no intermediaries, no hidden fees, and no 90-day wait. The copyright holder sets the terms from the outset and earns from every transaction, including secondary resales, through ERC-2981.

For readers, buying a book on Libere means genuinely owning it. The NFT lives in the reader's wallet, cannot be revoked by a platform, and can be resold or donated just like a physical book, while still compensating the author on every transfer.

For libraries, Libere exists precisely where CDL failed. CDL collapsed because it digitized physical books without the copyright holder's permission, creating legal ambiguity that courts ultimately rejected. Libere inverts that logic entirely: every book is published directly by the author or publisher themselves, meaning the copyright holder is the party actively minting the NFT and setting the terms of distribution from the outset. No unauthorized format conversion, no unilateral reproduction, no legal ambiguity. Libraries can deploy their own smart contracts to own, lend, and expand their digital collections sustainably, without depending on publisher-controlled licensing or platforms that can revoke access at will.
  
| | Kindle / Google Play (for Consumers)| OverDrive (For Library) | Libere |
|---|---|---|---|
| Reader ownership | License only, revocable | Borrowed access only | True NFT ownership, permanent |
| Author royalties | 30–70% platform cut, 60–90 day delay | None | Instant, automatic, no intermediaries |
| Secondary resale | Not allowed | Not allowed | Allowed, author still earns via ERC-2981 |
| Library access | Expensive institutional licensing | 3–5x consumer price, expires after 26 loans | Own smart contract, sovereign collection |
| Donation to library | Not supported | Not supported | Supported, triggers royalty to author |
| Verifiable impact | None | None | On-chain via Hypercerts |
  

## How Libere Works

  

- Each book is minted as an NFT using **ERC-1155** and **ERC-2981** standards, representing verifiable ownership, authorship, and royalty rules

- When a reader buys or donates a book, the smart contract triggers instant royalty payment to the author and publisher, with no intermediaries and no hidden fees

- Library institutions can deploy their own smart contracts to access, lend, and showcase their owned digital collections transparently and sustainably

  

---


## Architecture

![Libere Architecture](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/diagram.png?raw=true)

### Smart Contracts (Base Sepolia)

| Contract | Address | Source |
|---|---|---|
| **Marketplace** (ERC-1155 + ERC-2981) | [`0xC12F333f41D7cedB209F24b303287531Bb05Bc67`](https://base-sepolia.blockscout.com/address/0xC12F333f41D7cedB209F24b303287531Bb05Bc67) | [core_1155.sol](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/smartcontract/core_1155.sol) |
| **Library Pool** (borrow/return) Example Implementation | [`0xA31D6d3f2a6C5fBA99E451CCAAaAdf0bca12cbF0`](https://base-sepolia.blockscout.com/address/0xA31D6d3f2a6C5fBA99E451CCAAaAdf0bca12cbF0) | [library-libere.sol](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/smartcontract/library-libere.sol) |

---

  

## Hypercerts Integration

  

One of the persistent problems in charitable giving and corporate social responsibility is the inability to verify whether a contribution actually reached its intended destination. Libere integrates Hypercerts as the backbone of its impact infrastructure, turning every book donation into a verifiable, on-chain record of measurable good.

  

### Impact Recording

  

- A Hypercert is minted for every donation, recording the donor's identity, titles donated, receiving institution, and transaction timestamp

- Not a receipt — a permanent, verifiable claim of contribution that anyone can inspect without relying on a third party

- Enables donors and corporate CSR programs to prove exactly what they gave, to whom, and when

  

**Example:** [View Impact log on Hyperscan](https://www.hyperscan.dev/data?did=did%3Aplc%3A3ccjzfaw7mltkor5gdpdekyj&collection=org.hypercerts.claim.activity&rkey=3midgww7gys25)

  

### Impact Measurement

  

- Each time a donated book is borrowed from the library, a new measurement record is created referencing the original impact claim

- Donors and corporate sponsors can see not just that their contribution arrived, but that it is actively being read

- For libraries reporting to government funders, or corporations substantiating ESG claims, this transforms anecdotal generosity into structured, auditable evidence

- Impact is not declared once and forgotten; it compounds with every borrow

  

**Example:** [View Measurement log on Hyperscan](https://www.hyperscan.dev/data?did=did%3Aplc%3A3ccjzfaw7mltkor5gdpdekyj&collection=org.hypercerts.context.measurement&rkey=3mifjx3uawk25)

  

---

  

## Changelog (Hackathon Period)

  

Features built during PL Genesis: Frontiers of Collaboration (Feb 10 – Mar 16, 2026):

  

- **Hypercerts Impact Recording** — on-chain attribution minting for every book donation, capturing donor identity, titles, receiving institution, and timestamp

- **Hypercerts Impact Measurement** — on-chain tracking of borrowing events tied to donated titles, surfacing verifiable usage data per donation

- **Library Smart Contract** — institutions can deploy their own contracts to own, lend, and showcase digital collections independently of any platform

- **Donation flow** — reader-to-library donation triggers automatic royalty payment to author and Hypercert minting in a single transaction

  

---
## Getting Started
**Live app (no setup needed):** https://libere-plgenesiss.vercel.app

 Requires Base Sepolia testnet USDC. Get test USDC from the [Base Sepolia faucet](https://faucet.base.org).

1. Connect wallet via Privy (Google account)
2. Go to `/impact` → connect your ATProto account via OAuth (certified.one) to link your identity to Hypercert records
3. Browse books at `/books`
4. Buy a book with USDC — royalty paid to author instantly; choose to keep it or donate to a library
5. When donating — a Hypercert impact claim is minted on-chain recording the contribution
6. Borrow from a library at `/libraries` — a Hypercert measurement record is created automatically on every borrow
7. Read purchased books at `/bookselfs`, or read borrowed books directly from the library page
8. Return to `/impact` to view your donation history, borrow count, and live Hypercert records on Hyperscan



### Run Locally

```bash
git clone https://github.com/ridhoizzulhaq/Libere-plgenesiss
cd Libere-plgenesiss
npm install
cp env.example .env
npm run dev   # http://localhost:5173
```

Fill in `.env`:

```env
# Privy — https://privy.io/dashboard
VITE_PRIVY_APP_ID=
VITE_PRIVY_CLIENT_ID=

# Supabase — https://supabase.com/dashboard/project/_/settings/api
VITE_SUPABASE_URL=
VITE_SUPABASE_API_KEY=

# Hypercerts ATProto PDS
VITE_HYPER_PDS_HOST=https://certified.one
VITE_HYPER_USERNAME=
VITE_HYPER_PASSWORD=

# Base Sepolia (pre-filled)
VITE_BASE_SEPOLIA_LIBRARY_URL=https://base-sepolia.blockscout.com/api/v2/addresses/0x584f1c676445707E3AF1A16b4B78186E445A8C93/nft?type=ERC-1155
VITE_BASE_SEPOLIA_LIBRARY_BASE_URL=https://base-sepolia.blockscout.com/api/v2/addresses/
```

---

## Demo

  

- **Video:** https://www.youtube.com/watch?v=z-oY35RoUOE

- **Live:** https://libere-plgenesiss.vercel.app

- **Repository:** https://github.com/ridhoizzulhaq/Libere-plgenesiss

  

---

  
---

  

## Achievements & Traction 

  

![Traction Overview](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/19c60ad24ffa090f13fcbee492092e00.png?raw=true)

  

![Awards & Partnerships](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/19c60ad5860d5090daa355a445ab1a44.png?raw=true)

  

---


## License

MIT
---
## Acknowledgements

All books available in the live demo are either sourced from the public domain or published with explicit permission from the respective authors. Public domain titles have been reformatted and presented in the Libere style for demonstration purposes. No copyrighted material is reproduced without authorization. This demo is intended solely to showcase the platform's publishing, lending, and impact tracking infrastructure.    


