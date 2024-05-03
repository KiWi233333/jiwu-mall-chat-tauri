<script lang="ts" setup>
import { useLocalStorage } from "@vueuse/core";

const bgList = ref<string[]>([
  "/image/kiwi-bg-1.jpg",
  "/image/kiwi-bg-2.jpg",
  "/image/kiwi-bg-3.jpg",
  "/image/kiwi-bg-4.jpg",
  "/image/kiwi-bg-5.jpg",
]);
const bgUrl = useLocalStorage("jiwu_user_bg", "/image/kiwi-bg-4.jpg");
</script>

<template>
  <div class="group top-bg relative select-none shadow-lg shadow-inset">
    <el-popover
      :width="400"
      placement="top"
      title="切换壁纸"
      :teleported="false"
      trigger="click"
      class=""
    >
      <template #reference>
        <!-- 切换按钮 -->
        <el-button
          class="absolute bottom-2rem right-2rem z-999 opacity-0 group-hover:opacity-100"
          type="info"
          plain
          style="padding: 8px; background-color: rgba(97, 255, 163, 0.1); transition: 0.3s"
        >
          <i
            i-solar:pallete-2-bold h-1.6em w-1.6em
          />
        </el-button>
      </template>
      <template #default>
        <ClientOnly>
          <div class="img-list">
            <card-el-image
              v-for="(p, i) in bgList"
              :key="i"
              loading="lazy"
              alt="Design By Kiwi23333"
              :src="BaseUrlImg + p"
              object-cover
              class="hover: m-1 h-4em w-1/1 w-6em rounded-4px object-cover transition-300 hover:scale-110 border-default"
              @click="bgUrl = p"
            />
          </div>
        </ClientOnly>
      </template>
    </el-popover>
    <card-el-image
      loading="lazy"
      :src="BaseUrlImg + bgUrl"
      object-cover
      class="h-300px w-1/1 object-cover"
    />
  </div>
</template>

<style scoped lang="scss"></style>
