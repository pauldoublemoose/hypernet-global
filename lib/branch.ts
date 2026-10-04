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

export const NEON_PROJECT_ID = "billowing-rice-20515821";

export const BRANCHES: Record<BranchName, { id: string; authBaseUrl: string; storageEndpoint: string }> = {
  dev: {
    id: "br-rapid-butterfly-b2sgym8n",
    authBaseUrl: "https://ep-tiny-morning-b26xe7lf.neonauth.c-6.eu-central-1.aws.neon.tech/hypernet/auth",
    storageEndpoint: "https://br-rapid-butterfly-b2sgym8n.storage.c-6.eu-central-1.aws.neon.tech",
  },
  main: {
    id: "br-holy-dawn-b2fwcldg",
    authBaseUrl: "https://ep-soft-thunder-b2xv95gy.neonauth.c-6.eu-central-1.aws.neon.tech/hypernet/auth",
    storageEndpoint: "https://br-holy-dawn-b2fwcldg.storage.c-6.eu-central-1.aws.neon.tech",
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
