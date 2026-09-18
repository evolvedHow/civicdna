/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Cloudflare Worker URL for the AI narrative. Unset = feature disabled. */
  readonly VITE_NARRATIVE_URL?: string;
  /** Optional bearer token matching the Worker's CIVICDNA_AI_TOKEN. Public — see narrative.ts. */
  readonly VITE_NARRATIVE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
