import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// 引入icon
export default defineNuxtPlugin(async (NuxtApp) => {
  // nuxtApp包含的属性可看文档 https://nuxt.com.cn/docs/guide/directory-structure/plugins
  // 全局组件引入
  for (const [key, component] of Object.entries(ElementPlusIconsVue))
    NuxtApp.vueApp.component(key, component);
});
