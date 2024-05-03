<script lang="ts" setup>
import type { DeviceIpInfo } from "@/composables/api/user/safe";
import { getLoginDeviceList, toUserOffline } from "@/composables/api/user/safe";

const user = useUserStore();
const isLoading = ref<boolean>(false);

const deviceList = ref<DeviceIpInfo[]>([]);
// 信息
async function getDeviceList() {
  const res = await getLoginDeviceList(user.getToken);
  const result: DeviceIpInfo[] = res.data.sort((a, b) => b.isLocal - a.isLocal);
  const getList = [];
  for (const p of result)
    getList.push(await getDeviceIpInfo(p.ip, user.getToken));

  // 获取地址
  const ProList = await Promise.all(getList);
  ProList.forEach((p, i) => {
    result[i] = {
      ...p.data,
      ...result[i],
    };
  });
  deviceList.value = result.sort((a, b) => a.isLocal);
  return true;
}
getDeviceList();
// 刷新
async function reload() {
  if (isLoading.value)
    return;
  deviceList.value.splice(0);
  isLoading.value = true;
  const flag = await getDeviceList();
  setTimeout(() => {
    isLoading.value = false;
    ElMessage.success(flag ? "刷新成功🎉！" : "刷新失败，请稍后重试！");
  }, 300);
}

// 用户下线
function exitLogin(ua?: string) {
  ElMessageBox.confirm("是否确认下线用户?", "确认选择", {
    cancelButtonText: "取消",
    lockScroll: false,
    confirmButtonText: "确认下线",
    confirmButtonClass: "el-button--danger",
  })
    .then(async (action) => {
      if (action === "confirm") {
        const arr = ua ? [ua] : (deviceList.value?.map(p => p.userAgentString) as string[]);
        const { code, message } = await toUserOffline(arr, user.getToken);
        if (code === StatusCode.SUCCESS) {
          if (deviceList.value) {
            for (let i = 0; i < deviceList.value.length; i++) {
              if (deviceList.value[i].userAgentString === ua) {
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
    <strong

      my-4 block opacity-70
    >
      <i class="i-solar:devices-outline mr-2 p-2.5" />
      登录设备
      <i
        opacity-100
        transition-300 group-hover:opacity-100 md:opacity-0 class="i-solar:refresh-outline float-right cursor-pointer bg-[var(--el-color-info)] px-3 transition-300 hover:rotate-180"
        @click="reload"
      />
    </strong>
    <div
      v-loading="isLoading"
      class="group flex-1 select-none overflow-hidden rounded-14px p-4 shadow-sm border-default v-card"
    >
      <el-scrollbar height="400px">
        <!-- 列表 -->
        <div
          v-auto-animate="{
            duration: 300,
            easing: 'cubic-bezier(0.61, 0.225, 0.195, 1.3)',
          }"
          class="relative grid grid-cols-1 grid-gap-3 md:grid-cols-3"
        >
          <UserSafeDeviceCard
            v-for="p in deviceList"
            :key="p.id"
            class="cursor-pointer active:scale-97 hover:border-[var(--el-color-info)]"
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
      </el-scrollbar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bg-btn {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}
</style>
