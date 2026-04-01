import { getSession, createRecord, listRecords } from './atproto-proxy';

export interface LatestMeasurement {
  uri: string;
  value: string;
  createdAt: string;
  sourceUrl?: string;
}

export interface ActivityClaimResult {
  uri: string;
  cid: string;
}

/**
 * Buat ATProto activity claim saat donor mendonasikan buku ke library.
 */
export async function createActivityClaim(params: {
  donorDid: string;
  donorIdentity?: string; // ATProto DID jika ada, else CAIP-10 (fallback ke donorWallet)
  bookTitle: string;
  libraryName: string;
  amount: number;
  donorWallet: string;
  txHash?: string;
}): Promise<ActivityClaimResult> {
  const { did } = await getSession();
  const now = new Date().toISOString();

  return createRecord({
    repo: did,
    collection: 'org.hypercerts.claim.activity',
    record: {
      $type: 'org.hypercerts.claim.activity',
      title: `Donated ${params.amount} ${params.amount === 1 ? 'copy' : 'copies'} of "${params.bookTitle}" to ${params.libraryName}`,
      shortDescription: `Book donation to ${params.libraryName} via Libere decentralized library`,
      description: `${params.donorWallet} donated ${params.amount} ${params.amount === 1 ? 'copy' : 'copies'} of "${params.bookTitle}" to the ${params.libraryName} library pool on Base Sepolia blockchain.${params.txHash ? ` Transaction: ${params.txHash}` : ''}`,
      workScope: {
        $type: 'org.hypercerts.claim.activity#workScopeString',
        scope: 'book-donation',
      },
      startDate: now,
      endDate: now,
      contributors: [
        {
          contributorIdentity: {
            $type: 'org.hypercerts.claim.activity#contributorIdentity',
            identity: params.donorIdentity ?? `eip155:84532:${params.donorWallet}`,
          },
          contributionWeight: '100',
          contributionDetails: {
            $type: 'org.hypercerts.claim.activity#contributorRole',
            role: 'Donor',
          },
        },
      ],
      ...(params.txHash && {
        evidence: [
          {
            $type: 'org.hypercerts.claim.activity#evidenceLink',
            label: 'On-chain donation transaction (Base Sepolia)',
            uri: `https://base-sepolia.blockscout.com/tx/${params.txHash}`,
            description: `ERC-1155 donation transaction on Base Sepolia. Tx: ${params.txHash}`,
          },
        ],
      }),
      createdAt: now,
    },
  });
}

/**
 * Tambah measurement record ke activity claim saat ada borrow baru.
 */
export async function addMeasurement(params: {
  activityUri: string;
  activityCid: string;
  newBorrowCount: number;
  borrowerWallet?: string;
  txHash?: string;
}): Promise<void> {
  const { did } = await getSession();
  const now = new Date().toISOString();

  await createRecord({
    repo: did,
    collection: 'org.hypercerts.context.measurement',
    record: {
      $type: 'org.hypercerts.context.measurement',
      subjects: [
        { uri: params.activityUri, cid: params.activityCid },
      ],
      metric: 'borrow_count',
      value: String(params.newBorrowCount),
      unit: 'borrows',
      methodType: 'on-chain-event',
      ...(params.txHash && {
        sourceUrl: `https://base-sepolia.blockscout.com/tx/${params.txHash}`,
      }),
      ...(params.borrowerWallet && {
        measuredBy: `eip155:84532:${params.borrowerWallet}`,
      }),
      startDate: now,
      endDate: now,
      createdAt: now,
    },
  });
}

/**
 * Ambil measurement terbaru untuk activity claim tertentu.
 */
export async function getLatestMeasurement(
  activityUri: string,
): Promise<LatestMeasurement | null> {
  try {
    const { did } = await getSession();
    const { records } = await listRecords({
      repo: did,
      collection: 'org.hypercerts.context.measurement',
      limit: 100,
    });

    const matching = records
      .filter((r) =>
        r.value?.subjects?.some((s: { uri: string }) => s.uri === activityUri)
      )
      .sort((a, b) =>
        new Date(b.value?.createdAt ?? 0).getTime() -
        new Date(a.value?.createdAt ?? 0).getTime()
      );

    if (matching.length === 0) return null;
    const latestRecord = matching[0];
    const latest = latestRecord.value;
    return {
      uri: latestRecord.uri,
      value: latest.value,
      createdAt: latest.createdAt,
      sourceUrl: latest.sourceUrl,
    };
  } catch {
    return null;
  }
}
