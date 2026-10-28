// Which Neon branch this running app talks to, and that branch's public (non-secret) addresses.
//
//   production deployment on Vercel  → main  (the real data)
//   everything else (next dev, previews) → dev
//
// Override with NEON_BRANCH=main|dev. The secrets (database URL, storage keys) arrive as env vars; the push
// script sends main's database URL to production and dev's everywhere else, so the two always agree.
// These addresses are public: the auth URL is only ever called from our server, and the storage host appears in
// every image URL anyway.

export type BranchName = "dev" | "main";

export const NEON_PROJECT_ID = "holy-bonus-89610570";

export const BRANCHES: Record<BranchName, { id: string; authBaseUrl: string; storageEndpoint: string }> = {
  dev: {
    id: "br-fragrant-shape-b9dk55gf",
    authBaseUrl: "https://ep-green-cell-b97k9i3t.neonauth.c-7.eu-central-1.aws.neon.tech/hypernet/auth",
    storageEndpoint: "https://br-fragrant-shape-b9dk55gf.storage.c-7.eu-central-1.aws.neon.tech",
  },
  main: {
    id: "br-young-credit-b9t2vyjm",
    authBaseUrl: "https://ep-holy-smoke-b93npjx9.neonauth.c-7.eu-central-1.aws.neon.tech/hypernet/auth",
    storageEndpoint: "https://br-young-credit-b9t2vyjm.storage.c-7.eu-central-1.aws.neon.tech",
  },
};

export const STORAGE_REGION = "eu-central-1";
export const IMAGES_BUCKET = "images";

export function branchName(): BranchName {
  const forced = process.env.NEON_BRANCH;
  if (forced === "dev" || forced === "main") return forced;
  return process.env.VERCEL_ENV === "production" ? "main" : "dev";
}

export function branch() {
  return BRANCHES[branchName()];
}
