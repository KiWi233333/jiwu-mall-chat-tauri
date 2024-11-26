/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_ENV: "development" | "production" | "test"
  readonly VITE_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_WS_BASE_URL: string
  readonly VITE_BASE_OSS_PATH: string
  readonly VITE_XUN_FEI_WSS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
