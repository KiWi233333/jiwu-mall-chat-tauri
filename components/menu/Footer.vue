<template>
  <footer
    class="min-h-200px w-full flex-row-c-c rounded-0 card-default"
    border-0px
    border-t="1px solid gray-200"
    dark:border-t-dark-3 dark:bg-dark-9
  >
    <div class="layout-default" flex-row-c-c flex-col dark:opacity-80>
      <img
        loading="lazy"
        src="/logo_title.png" w-10rem alt="Design By: Kiwi2333"
      >
      <NuxtLink
        target="_blank"
        to="https://github.com/KiWi233333"
        class="mt-4 flex-row-c-c text-0.8rem tracking-0.1em opacity-70"
      >
        <i i-carbon:logo-github mr-2 p-0.8em />@KiWi233333
      </NuxtLink>
      <strong pt-1em opacity-80>
        Design By
        <NuxtLink
          target="_blank"
          to="https://github.com/KiWi233333"
        >
          <img
            loading="lazy"
            src="/images/logo/kiwi_strong.svg"
            alt="Design By Kiwi23333"
            class="ml-4 w-80px"
            dark:filter-invert-100
          >
        </NuxtLink>
      </strong>
    </div>
  </footer>
</template>

<style scoped lang="scss"></style>
