/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: "development" | "production" | "test"
  readonly VITE_PUBLIC_API_BASE_URL: string
  readonly VITE_PUBLIC_API_WS_BASE_URL: string
  readonly VITE_PUBLIC_BASE
  readonly VITE_PUBLIC_BASE_OSS_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
