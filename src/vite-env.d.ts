/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PERSONA_ID?: string;
  readonly VITE_PERSONA_EMAIL?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
