/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXCHANGERATE_API_KEY?: string;
  readonly VITE_TRAVEL_TRENDING_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
