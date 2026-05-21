interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
