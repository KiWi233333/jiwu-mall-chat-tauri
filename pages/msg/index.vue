<script lang="ts" setup>
const unReadContactList = ref<ChatContactVO[]>([]);
const channel = new BroadcastChannel("main_channel");
const unreadCount = computed(() => unReadContactList.value?.reduce((acc, cur) => acc + cur.unreadCount, 0) || 0);

// 监听消息
async function handleReadMessage(p: ChatContactVO) {
  // 标记已读
  channel.postMessage({ type: "readContact", data: JSON.parse(JSON.stringify(p)) });
  unReadContactList.value = unReadContactList.value.filter(item => item.roomId !== p.roomId);
}

// 全部已读
async function readAllContact() {
  channel.postMessage({ type: "readAllContact" });
  unReadContactList.value = [];
}

onMounted(async () => {
  // 监听locakStorage
  window.addEventListener("storage", (e) => {
    if (e.key === "unReadContactList")
      unReadContactList.value = JSON.parse(e.newValue || "[]");
  });
  // 主动获取
  try {
    unReadContactList.value = JSON.parse(localStorage.getItem("unReadContactList") || "[]");
  }
  catch (error) {
    console.warn(error);
  }
});
onBeforeUnmount(() => {
  channel.close();
  window.removeEventListener("storage", () => {});
});

definePageMeta({
  key: route => route.fullPath,
});
</script>

<template>
  <div class="h-100vh overflow-hidden text-0.8rem">
    <NuxtLayout>
      <main class="h-100vh flex flex-col justify-between gap-3 truncate p-3">
        <div class="border-0 border-b-1px pb-2 border-default">
          新消息 ({{ unreadCount }})
        </div>
        <el-scrollbar
          v-if="unReadContactList.length"
          height="70vh"
        >
          <!-- 消息 -->
          <div
            v-for="p in unReadContactList"
            :key="p.message"
            title="读消息"
            class="group w-full flex cursor-pointer gap-2 rounded bg-white p-2 shadow-sm transition-all !items-center dark:bg-dark-7 hover:(bg-[var(--el-color-primary)] text-light shadow-lg)"
            @click="handleReadMessage(p)"
          >
            <CardElImage :src="BaseUrlImg + p.avatar" fit="cover" class="h-8 w-8 rounded-1 object-cover card-default" />
            <div class="flex flex-1 flex-col justify-between gap-1 truncate px-1">
              <p class="truncate">
                {{ p.name }}
              </p>
              <p flex-row-bt-c gap-2 truncate op-60>
                <small truncate>
                  {{ p.text || "暂无消息" }}
                </small>
              </p>
            </div>
            <el-badge :value="p.unreadCount" class="ml-1" />
          </div>
        </el-scrollbar>

        <small v-if="unReadContactList.length" class="border-0 border-t-1px pt-2 text-right btn-info border-default" @click="readAllContact()">
          忽略全部
        </small>
        <!-- 没有消息 -->
        <div v-else class="flex-row-c-c flex-1 flex-col text-center op-70">
          <i i-solar-chat-dots-line-duotone class="mb-2 h-6 w-6" />
          <small class="text-sm">
            暂无新消息
          </small>
        </div>
      </main>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.mains {
  --at-apply: "grid grid-cols-1 pl-2rem pr-4rem sm:(grid-cols-[2fr_1fr] px-4rem)";
}
</style>
