/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: "development" | "production" | "test"
  readonly VITE_PUBLIC_API_BASE_URL: string
  readonly VITE_PUBLIC_API_WS_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
