/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REFRESH_INTERVAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
