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

// @unocss-include
export default defineConfig({
  shortcuts: [
    ["v-card", "bg-[#ffffff93] dark:bg-dark-5 rounded-1.5"],
    ["card-default", "bg-[#ffffff93] dark:(bg-dark-5) rounded-1.5"],
    ["v-card-br", "bg-[#ffffff93] dark:(bg-dark-5 bg-op-60) rounded-1.5 backdrop-blur-12px backdrop-saturate-180"],
    ["card-default-br", "bg-[#ffffff93] dark:(bg-dark-5 bg-op-60) rounded-1.5 backdrop-blur-12px backdrop-saturate-180"],
    ["v-btn", "border-0 rounded-4px"],
    ["blur-card", "backdrop-blur-4 bg-[#75757528] rounded-4px"],
    ["card-rounded-df", "rounded-4px"],
    ["btn-default", "border-0 cursor-pointer rounded-4px hover:text-[var(--el-color-primary)] transition-200 text-white"],
    ["btn-primary-bg", " cursor-pointer rounded-4px hover:bg-[var(--el-color-primary)]  hover:text-white"],
    // 颜色
    ["bg-color", "bg-white dark:bg-dark"],
    ["bg-color-br", "bg-[#ffffff93] dark:(bg-dark-5 bg-op-60) backdrop-blur-12px"],
    ["bg-menu-color", "bg-white  dark:bg-dark-8"], // 控件菜单背景色
    ["bg-color-second", "bg-light-5 dark:bg-dark"],
    ["text-color", "text-dark dark:text-white"],
    // 文本颜色
    ["text-default", "text-1em text-dark dark:text-white"],
    ["text-mini", "text-dark-50 dark:text-[#979898] text-xs"],
    ["text-mini-50", "text-xs text-dark-50 dark:text-[#717171]"],
    ["text-color-primary", "text-[var(--el-color-primary)]"],
    ["text-small", "text-dark-50 dark:text-[#979898] text-sm"],
    ["text-small-50", "text-sm text-dark-50 dark:text-[#717171]"],
    ["text-small-color", "text-dark-50 dark:text-[#979898]"],
    // 边框
    ["border-default", "border-1px border-solid border-gray-200 dark:border-dark-300"],
    ["border-default-r", "border-solid border-gray-200 border-0 border-r-1px  dark:border-dark-300"],
    ["border-default-l", "border-solid border-gray-200 border-0 border-l-1px  dark:border-dark-300"],
    ["border-default-t", "border-solid border-gray-200 border-0 border-t-1px  dark:border-dark-300"],
    ["border-default-b", "border-solid border-gray-200 border-0 border-b-1px  dark:border-dark-300"],
    ["border-default-dashed", "hover:shadow-sm border-2px  border-default border-dashed"],
    ["border-default-hover", "transition-200 border-1px border-solid border-gray-200 dark:border-dark-500 hover:(border-gray-300 dark:border-dark-100)"],
    ["border-default-dashed", "border-2px  border-default border-dashed"],
    ["border-default-dashed-hover", "transition-200 hover:border-solid hover:border-[var(--el-color-primary)]  border-default-dashed"],
    // 布局
    ["flex-row-c-c", "flex flex-row flex-justify-center flex-items-center"],
    ["flex-row-bt-c", "flex flex-row flex-justify-between flex-items-center"],
    ["layout-default", "mx-a sm:px-2rem py-4 w-94vw md:w-1400px"],
    ["layout-default-md", "mx-a sm:px-2rem py-4 w-94vw md:w-1400px"],
    ["layout-default-xm", "mx-a sm:px-2rem py-4 w-94vw md:w-1200px"],
    ["layout-default-se", "mx-a sm:px-2rem py-4 w-94vw md:w-1000px"],
    ["absolute-center", "absolute left-1/2 -translate-x-1/2"],
    ["absolute-center-center", "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"],
    ["absolute-center-x", "absolute left-1/2 -translate-x-1/2"],

    // element风格按钮
    ["btn-info", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-info)]"],
    ["btn-success", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-success)]"],
    ["btn-primary", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-primary)]"],
    ["btn-danger", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-danger)]"],
    ["btn-warning", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-warning)]"],
    ["btn-info-text", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-info)]"],
    ["btn-success-text", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-success)]"],
    ["btn-primary-text", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-primary)]"],
    ["btn-danger-text", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-danger)]"],
    ["btn-warning-text", "transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-warning)]"],
    ["btn-info-bg", "transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-info)])"],
    ["btn-success-bg", "transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-success)])"],
    ["btn-primary-bg", "transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-primary)])"],
    ["btn-danger-bg", "transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-danger)])"],
    ["btn-warning-bg", "transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-warning)])"],
    ["group-btn-info", "transition-200 cursor-pointer rounded-4px group-hover:text-[var(--el-color-info)]"],
    ["group-btn-success", "transition-200 cursor-pointer rounded-4px group-hover:text-[var(--el-color-success)]"],
    ["group-btn-primary", "transition-200 cursor-pointer rounded-4px group-hover:text-[var(--el-color-primary)]"],
    ["group-btn-danger", "transition-200 cursor-pointer rounded-4px group-hover:text-[var(--el-color-danger)]"],
    ["group-btn-warning", "transition-200 cursor-pointer rounded-4px group-hover:text-[var(--el-color-warning)]"],

    ["btn-light-bg", "transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-light)])"],
  ],
  rules: [
    // color: info success primary danger warning
    // 文字
    [/^el-color-(\w*)$/, ([_, color]) => ({ color: `var(--el-color-${color})` })],
    [/^el-bg-(\w*)$/, ([_, color]) => ({ "background-color": `var(--el-color-${color})` })],
    // 文字按钮
    // [/^btn-(\w*)$/, ([_, color]) => ({
    //   "--at-apply": `transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-${color})]`,
    // })],
    // [/^btn-(\w*)-text$/, ([_, color]) => ({
    //   "--at-apply": `transition-200 cursor-pointer rounded-4px hover:text-[var(--el-color-${color})]`,
    // })],
    // // 文字背景按钮
    // [/^btn-(\w*)-bg$/, ([_, color]) => ({
    //   "--at-apply": `transition-200 cursor-pointer rounded-4px hover:(text-white bg-[var(--el-color-${color})]) `,
    // })],
    // // 文字按钮组
    // [/^group-btn-(\w*)$/, ([_, color]) => ({
    //   "--at-apply": `transition-200 cursor-pointer rounded-4px group-hover:text-[var(--el-color-${color})]`,
    // })],
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
