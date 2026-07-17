/**
 * Real placeholder photography via pravatar.cc (network URLs, as requested).
 * Every named creator/person used across the site gets a manually assigned,
 * unique photo ID — avoids the collision bug where a simple hash mapped two
 * different people to the same picture. Unknown seeds fall back to a hash.
 */
const KNOWN_PHOTO_IDS: Record<string, number> = {
  'rhea-kapoor': 5,
  'aarav-mehta': 12,
  'simran-oberoi': 9,
  'kabir-anand': 14,
  'devika-rao': 25,
  'yash-malhotra': 18,
  'ananya-iyer': 20,
  'rohan-bhatia': 15,
  'meher-chawla': 23,
  'nikhil-sethi': 13,
  'priya-nair': 28,
  'karan-vora': 33,
  'aditya-singh': 51,
};

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatar(seed: string, size = 300) {
  const id = KNOWN_PHOTO_IDS[seed] ?? (hashSeed(seed) % 70) + 1;
  return `https://i.pravatar.cc/${size}?img=${id}`;
}
