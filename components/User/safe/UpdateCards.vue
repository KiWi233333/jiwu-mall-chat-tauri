<script lang="ts" setup>
const user = useUserStore();

async function toExistLogin() {
  ElMessageBox.confirm("是否确认退出登录？", "退出登录", {
    confirmButtonText: "确认退出",
    confirmButtonClass: "el-button--danger",
    lockScroll: false,
    cancelButtonText: "取消",
    center: true,

  }).then(async (action) => {
    if (action === "confirm") {
      await user.onUserExit(user.getToken);
      setTimeout(() => {
        user.$reset();
      }, 50);
      navigateTo("/");
    }
  });
}
/**
 * 重新加载用户信息
 */
const isLoading = ref<boolean>(false);
async function reloadUserInfo() {
  isLoading.value = true;
  (await user.loadUserWallet(user.getToken))
    ? ElMessage.success("刷新成功🎉")
    : ElMessage.success("刷新失败，请稍后重试！");
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
}
// 展示表单
const form = ref({
  showUpdatePwd: false,
  showUpdatePhone: false,
  showUpdateEmail: false,
});
</script>

<template>
  <div class="card flex flex-col">
    <strong
      my-4 block opacity-70
    >
      <i
        i-solar:shield-check-broken mr-2 p-2.5
      />
      修改信息
    </strong>
    <!-- 用户信息 -->
    <div
      v-loading="isLoading"
      class="group flex flex-col overflow-hidden rounded-14px p-5 text-1em shadow-sm border-default v-card"
      flex flex-1 flex-col
    >
      <div class="flex items-center">
        <el-avatar
          size="large"
          :src="
            user.userInfo.avatar ? BaseUrlImg + user.userInfo.avatar : `${BaseUrlImg}default.png`
          "
        />
        <strong class="ml-3 block">用户名：{{ user.userInfo.username }}</strong>
        <i
          opacity-0
          transition-300
          group-hover:opacity-100
          class="i-solar:refresh-outline ml-a cursor-pointer bg-[var(--el-color-info)] px-3 transition-300 hover:rotate-180"
          @click="reloadUserInfo"
        />
      </div>
      <!-- 密码 -->
      <div
        ml-1 mt-6 flex-row-bt-c
      >
        <small>
          密&emsp;码：
          <small opacity-80>*******</small>
        </small>
        <small
          class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]"
          @click="form.showUpdatePwd = true"
        >
          修改密码
        </small>
      </div>
      <!-- 手机号 -->
      <div


        ml-1 mt-6 flex-row-bt-c
      >
        <small>
          手机号：
          <small
            opacity-80
            :class="{ 'text-red-5': user.userInfo.isPhoneVerified === 0 }"
          >
            {{ user.userInfo.phone || "还未绑定" }}
          </small>
        </small>
        <small
          class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]"
          @click="form.showUpdatePhone = true"
        >
          {{ user.userInfo.isPhoneVerified ? "修改手机号" : "绑定" }}
        </small>
      </div>
      <!-- 邮箱 -->
      <div


        ml-1 mt-6 flex-row-bt-c
      >
        <small>
          邮&emsp;箱：
          <small
            opacity-80
            :class="{ 'text-red-5': user.userInfo.isEmailVerified === 0 }"
          >
            {{ user.userInfo.email || "还未绑定" }}
          </small>
        </small>
        <small
          class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]"
          @click="form.showUpdateEmail = true"
        >
          {{ user.userInfo.isEmailVerified ? "修改邮箱" : "绑定" }}
        </small>
      </div>
      <div
        mt-a
        w-full
      >
        <!-- 退出 -->
        <ElDivider class="dark:opacity-20" />
        <div


          mb-1 flex-row-bt-c justify-end
        >
          <el-text
            style="margin-left: 1rem"
            class="cursor-pointer transition-300 hover:text-[var(--el-color-primar)y]"
            @click="ElMessage.warning('功能还未开放!')"
          >
            注销
          </el-text>
          <el-text
            style="margin-left: 1rem"
            class="cursor-pointer transition-300 hover:text-[var(--el-color-primar)y]"
            type="danger"
            @click="toExistLogin"
          >
            退出登录
          </el-text>
        </div>
      </div>
    </div>
    <UserSafeDialog v-model="form" />
  </div>
</template>

<style scoped lang="scss"></style>
