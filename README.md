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

---

## The Problem

The digital book industry is built on hidden inequalities that have compounded quietly for years.

- Distribution platforms take 30 to 70 percent of every transaction
- Authors wait up to 90 days to receive royalties
- Readers who pay full price can lose access overnight if a platform shuts down
- Amazon, Apple, and Google collectively control over 90 percent of the ebook retail market

Libraries face the same imbalance from a different angle.

- Publishers charge institutions three to five times the consumer price for a single ebook license
- Licenses expire after just 26 loans, forcing libraries to repurchase the same title repeatedly
- Controlled Digital Lending (CDL), the most serious attempt at a fix, was struck down by a federal court in 2023 after major publishers sued the Internet Archive
- CDL failed because it digitized physical books without the copyright holder's permission, directly competing with the existing ebook licensing market
- The ruling left libraries more dependent on publisher-controlled licensing than ever

---

## The Solution

Libere exists precisely where CDL failed. Every book that enters the Libere ecosystem is published directly by the author or publisher themselves — meaning the copyright holder is the party actively minting the NFT and setting the terms of distribution from the outset. No unauthorized format conversion, no unilateral reproduction, no legal ambiguity.

Every ownership right, royalty rule, and lending term is encoded directly into a smart contract at the moment a book is published — transparent, automatic, and permanent by design.

---

## Achievements & Traction

![Traction Overview](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/19c60ad24ffa090f13fcbee492092e00.png?raw=true)

![Awards & Partnerships](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/19c60ad5860d5090daa355a445ab1a44.png?raw=true)

---

## How Libere Works

- Each book is minted as an NFT using **ERC-1155** and **ERC-2981** standards, representing verifiable ownership, authorship, and royalty rules
- When a reader buys or donates a book, the smart contract triggers instant royalty payment to the author and publisher, with no intermediaries and no hidden fees
- Library institutions can deploy their own smart contracts to access, lend, and showcase their owned digital collections transparently and sustainably

---

## Architecture

![Libere Architecture](https://github.com/ridhoizzulhaq/Libere-plgenesiss/blob/main/public/diagram.png?raw=true)

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

## Demo

- **Video:** https://www.youtube.com/watch?v=z-oY35RoUOE
- **Live:** https://libere-plgenesiss.vercel.app
- **Repository:** https://github.com/ridhoizzulhaq/Libere-plgenesiss

---

## License

MIT
