declare module "#components"
declare module "streamsaver"

declare global {
  interface Window {
    process: NodeJS.Process
  }
}
