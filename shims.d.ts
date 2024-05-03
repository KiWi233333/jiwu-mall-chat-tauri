declare module "@kangc/v-md-editor/lib/theme/vuepress.js";
declare module "@kangc/v-md-editor/lib/preview";
declare module "@kangc/v-md-editor";
declare module "vue-virtual-scroller";
declare module "crypto-js/sha256"
declare module "crypto-js"

declare module "highlight.js/lib/core"

declare module "#components"
declare module "./electron/preload.d.ts"


declare global {
  interface Window {
    process: NodeJS.Process
  }
}
