import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  shortcuts: [
    ["v-card", "bg-[#ffffff93] dark:bg-dark-5 rounded-1.5"],
    ["card-default", "bg-[#ffffff93] dark:bg-dark-5 rounded-1.5"],
    // ["v-card", "bg-[#ffffff93] dark:bg-dark-5 rounded-1.5 backdrop-blur-12px backdrop-saturate-180"],
    // ["card-default", "bg-[#ffffff93] dark:bg-dark-5 rounded-1.5 backdrop-blur-12px backdrop-saturate-180"],
    ["v-btn", "border-0 rounded-4px cursor-pointer"],
    ["blur-card", "backdrop-blur-4 bg-[#75757528] rounded-4px"],
    ["v-btn-primary", "border-0 cursor-pointer rounded-4px bg-[var(--el-color-primary)] transition-all text-white"],
    ["btn-default", "border-0 cursor-pointer rounded-4px hover:text-[var(--el-color-primary)] transition-all text-white"],
    ["btn-primary-bg", " cursor-pointer rounded-4px hover:bg-[var(--el-color-primary)] transition-all  hover:text-white"],
    // 颜色
    ["text-color", "text-dark dark:text-white"],
    ["bg-color", "bg-white dark:bg-dark"],
    // 边框
    ["border-default", "border-1px border-solid border-gray-200 dark:border-dark-300"],
    ["border-default-dashed", "hover:shadow-sm border-2px  border-default border-dashed"],
    ["border-default-hover", `transition-200 hover:shadow hover:border-solid hover:border-[var(--el-color-primary)]  border-default-dashed
    `],
    // 布局
    ["flex-row-c-c", "flex flex-row flex-justify-center flex-items-center"],
    ["flex-row-bt-c", "flex flex-row flex-justify-between flex-items-center"],
    ["layout-default", "mx-a sm:px-2rem py-4 w-94vw md:w-1400px"],
    ["layout-default-md", "mx-a sm:px-2rem py-4 w-94vw md:w-1400px"],
    ["layout-default-xm", "mx-a sm:px-2rem py-4 w-94vw md:w-1200px"],
    ["layout-default-se", "mx-a sm:px-2rem py-4 w-94vw md:w-1000px"],
    ["absolute-center", "absolute left-1/2 -translate-x-1/2"],
    ["absolute-center-center", "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"],
  ],
  rules: [
    // 文字
    [/^el-color-(\w*)$/, ([_, color]) => ({ color: `var(--el-color-${color})` })],
    [/^el-bg-(\w*)$/, ([_, color]) => ({ "background-color": `var(--el-color-${color})` })],
    // 文字按钮
    [/^btn-(\w*)$/, ([_, color]) => ({
      "--at-apply": `transition-all cursor-pointer rounded-4px hover:text-[var(--el-color-${color})] `,
    })],
    // 文字按钮
    [/^btn-(\w*)-plain$/, ([_, color]) => ({
      "--at-apply": `transition-all cursor-pointer rounded-4px hover:text-[var(--el-color-${color})] `,
    })],
    // 文字按钮组
    [/^group-btn-(\w*)$/, ([_, color]) => ({
      "--at-apply": `transition-all cursor-pointer rounded-4px group-hover:text-[var(--el-color-${color})] `,
    })],
    // hover组
    [/^g-hover-op-([0-9]*)$/, ([_, op]) => ({
      "--at-apply": `group-hover:(op-100) op-${op} transition-all`,
    })],
    [/^hover-op-([0-9]*)$/, ([_, op]) => ({
      "--at-apply": `hover:(op-100) op-${op} transition-all`,
    })],
  ],
  theme: {
    // ...
    colors: {
      theme: {
        primary: "var(--el-color-primary)",
      }, // class="text-very-cool"
      tip: {
        main: "var(--el-color-primary)", // class="--el-color-primary"
        green: "hsla(var(--hue, 217), 78%, 51%)", // class="bg-brand-primary"
      },
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () =>
          import("@iconify-json/carbon").then(i => i.icons as any),
        solar: () =>
          import("@iconify-json/solar").then(i => i.icons as any),
        tabler: () =>
          import("@iconify-json/tabler").then(i => i.icons as any),
      },
    }),
    presetTypography(),
    presetWebFonts({}),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
});
