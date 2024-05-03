// VMdPreview
import VMdPreview from "@kangc/v-md-editor/lib/preview";
import "@kangc/v-md-editor/lib/style/preview.css";

// VMdEditor
import VMdEditor from "@kangc/v-md-editor";
import "@kangc/v-md-editor/lib/style/base-editor.css";

// 插件
import vuepressTheme from "@kangc/v-md-editor/lib/theme/vuepress.js";
import "@kangc/v-md-editor/lib/theme/style/vuepress.css";

// import hljs from "highlight.js/lib/core";

// highlightjs
// 引入icon
export default defineNuxtPlugin(async (NuxtApp) => {
  // 预览
  VMdPreview.use(vuepressTheme);
  // 初级-编辑
  VMdEditor.use(vuepressTheme);
  NuxtApp.vueApp
    .use(VMdPreview)
    .use(VMdEditor);
});
