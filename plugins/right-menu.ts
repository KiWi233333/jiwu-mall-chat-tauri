import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
import ContextMenu from "@imengyu/vue3-context-menu";

// highlightjs
// 引入icon
export default defineNuxtPlugin(async (NuxtApp) => {
  NuxtApp.vueApp.use(ContextMenu);
});
