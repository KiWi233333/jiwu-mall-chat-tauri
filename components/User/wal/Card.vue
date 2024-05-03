<script lang="ts" setup>
const user = useUserStore();
// 加载
const isWalletLoading = ref<boolean>(false);
// 获取
async function reLoadUserWallet() {
  if (isWalletLoading.value)
    return;
  isWalletLoading.value = true;
  const flag = await user.loadUserWallet(user.getToken);
  if (flag)
    ElMessage.success("更新成功！");
  else
    ElMessage.error("更新失败，请稍后重试！");
  setTimeout(() => {
    isWalletLoading.value = false;
  }, 400);
}
</script>

<template>
  <div
    v-loading="isWalletLoading"
    relative h-180px w-320px flex flex-col justify-between overflow-hidden p-4
    element-loading-background="rgba(0, 0, 0, 0.6)"
    bg="#2d2a3b"
    class="group rounded-4 text-white shadow-sm v-card dark:bg-#2d2a3b"
  >
    <!-- 顶部 -->
    <div flex-row-bt-c>
      <small font-600 opacity-90>
        <i i-solar:banknote-2-bold-duotone mr-2 bg-white p-3 />
        极物圈
      </small>
      <img
        src="/logo.png"
        alt="LOGO Design By Kiwi23333"
        class="w-2em opacity-95 shadow-lg"
      >
    </div>
    <!-- 余额： -->
    <div class="blance leading-1.6em">
      <span>余额：</span>
      <h2>
        <small>￥</small><span v-incre-up="user.userWallet.balance" mr-2 />
        <i
          opacity-0
          transition-300
          group-hover:opacity-100
          class="i-solar:refresh-outline inline-block h-0.8em w-0.8em cursor-pointer bg-[var(--el-color-info)] transition-300 hover:rotate-180"
          @click="reLoadUserWallet()"
        />
      </h2>
    </div>
    <small block opacity-70>更新于：{{ user.userWallet.updateTime }}</small>
  </div>
</template>

<style scoped lang="scss">
.v-card::after {
  content: "";
  width: 90%;
  height: 60%;
  transform: rotate(45deg) translate(0%, 130%);
  border-radius: 60%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  filter: blur(30px);
  background-image: linear-gradient(to right, #5983ff, #ff5aa2 50%, #ff8f67 50%);
}
</style>
