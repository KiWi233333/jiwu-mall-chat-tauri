<script lang="ts" setup>
const user = useUserStore();
const isShow = ref<boolean>(false);
// 退出登录
function exitLogin() {
  ElMessageBox.confirm("确认退出登录？", "退出登录", {
    confirmButtonText: "确认退出",
    cancelButtonText: "取消",
    lockScroll: false,
    type: "warning",
  })
    .then((e) => {
      // 退出登录
      user.onUserExit(user.token);
      ElMessage.success("退出成功！");
    })
    .catch(() => {});
}
</script>

<template>
  <div>
    <div v-if="user.userInfo?.id">
      <el-popover
        placement="bottom"
        :width="60"
      >
        <template #reference>
          <img
            loading="lazy"
            class="h-2em w-2em rounded-6em"
            :src="
              user.userInfo.avatar ? BaseUrlImg + user.userInfo.avatar : `${BaseUrlImg}default.png`
            "
            :alt="user.userInfo.nickname"
          >
        </template>
        <div class="grid grid-cols-1 w-full text-center">
          <NuxtLink
            to="/"
            class="cursor-pointer rounded-6px py-2"
          >
            回到主页
          </NuxtLink>
          <span
            class="cursor-pointer rounded-6px py-2"
            @click="exitLogin"
          >
            退出登录
          </span>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
