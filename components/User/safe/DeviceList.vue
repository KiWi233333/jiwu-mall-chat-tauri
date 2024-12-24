<script lang="ts" setup>
import { getLoginDeviceList, toUserOffline } from "@/composables/api/user/safe";

const [autoAnimateRef, enable] = useAutoAnimate({
  duration: 300,
  easing: "cubic-bezier(0.61, 0.225, 0.195, 1.3)",
});
onMounted(() => {
  const setting = useSettingStore();
  enable(!setting.settingPage.isCloseAllTransition);
});
const user = useUserStore();
const isLoading = ref<boolean>(false);

const deviceList = ref<DeviceInfo[]>([]);
// 信息
async function getDeviceList() {
  const res = await getLoginDeviceList(user.getToken);
  if (res.code === StatusCode.SUCCESS) {
    deviceList.value = res.data.sort((a, b) => a.isLocal);
  }
  return true;
}
getDeviceList();
// 刷新
async function reload() {
  if (isLoading.value)
    return;
  deviceList.value.splice(0);
  const flag = await getDeviceList();
  setTimeout(() => {
    ElMessage.success(flag ? "刷新成功🎉！" : "刷新失败，请稍后重试！");
  }, 300);
}

// 用户下线
function exitLogin(ua?: string) {
  ElMessageBox.confirm("是否确认下线用户?", "确认选择", {
    cancelButtonText: "取消",
    lockScroll: false,
    center: true,
    confirmButtonText: "确认下线",
    confirmButtonClass: "el-button--danger",
  })
    .then(async (action: string) => {
      if (action === "confirm") {
        const arr = ua ? [ua] : (deviceList.value?.map(p => p.userAgentString) as string[]);
        const { code, message } = await toUserOffline(arr, user.getToken);
        if (code === StatusCode.SUCCESS) {
          if (deviceList.value) {
            for (let i = 0; i < deviceList.value.length; i++) {
              if (deviceList?.value?.[i]?.userAgentString === ua) {
                deviceList.value.splice(i, 1);
                break;
              }
            }
          }
          ElMessage.success("下线成功！");
        }
        else {
          ElMessage.error(message);
        }
      }
    })
    .catch(() => {});
}
</script>

<template>
  <div class="group flex flex-col">
    <small my-4 block opacity-70>
      登录设备
      <i class="i-solar:devices-outline ml-2 p-2.5" />
      <i
        opacity-100
        transition-300 group-hover:opacity-100 md:opacity-0 class="i-solar:refresh-outline float-right cursor-pointer bg-[var(--el-color-info)] px-3 transition-300 hover:rotate-180"
        @click="reload"
      />
    </small>
    <div
      v-loading="isLoading"
      rounde-4 h-62vh overflow-y-auto
      element-loading-background="initial"
      class="group"
    >
      <!-- 列表 -->
      <div
        ref="autoAnimateRef"
        class="relative grid grid-cols-1 gap-2 pb-4rem lg:grid-cols-3 sm:grid-cols-2"
      >
        <UserSafeDeviceCard
          v-for="p in deviceList"
          :key="p.id"
          class="cursor-pointer active:scale-97 hover:(border-[var(--el-color-info)] border-solid shadow)"
          :data="p"
        >
          <div />
          <el-button
            v-if="!p.isLocal"
            size="small"
            type="danger"
            style="padding: 0 8px"
            plain
            @click="exitLogin(p.userAgentString)"
          >
            下线
          </el-button>
        </UserSafeDeviceCard>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bg-btn {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}
</style>
