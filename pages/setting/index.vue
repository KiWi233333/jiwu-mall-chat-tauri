<script lang="ts" setup>
import { useModeToggle } from "@/composables/utils/useToggleThemeAnima";
import { appKeywords } from "@/constants/index";

const isLoading = ref(false);
const setting = useSettingStore();
// 字体监听
watchDebounced(
  () => setting.settingPage.fontFamily.value,
  (val: string) => {
    if (val && document) {
      isLoading.value = true;
      localStorage.setItem("--font-family", val);
      document.documentElement.style.setProperty("--font-family", val);
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    }
  },
);

const theEvent = ref();
// 夜间模块
watchDebounced(
  () => setting.settingPage.modeToggle.value,
  async (val: string) => {
    if (val && document) {
      if (val)
        useModeToggle(val, theEvent.value);
    }
  },
);

useSeoMeta({
  title: "设置",
  description: "设置 - 极物圈 开启你的极物之旅！",
  keywords: appKeywords,
});
function onSave() {
  ElNotification.success("保存成功！");
}
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <main v-loading.fullscreen.lock="isLoading" class="my-8 flex flex-1 flex-col p-4 layout-default-se md:p-6">
        <h3 flex items-center>
          系统设置
          <i i-solar:settings-bold ml-2 inline-block p0.6em opacity-60 hover:animate-spin />
        </h3>
        <ElDivider class="opacity-60" />
        <section text-0.9rem grid="~ cols-1 gap-4">
          <!-- 字体 -->
          <div class="group flex-row-bt-c">
            字体设置
            <el-select v-model="setting.settingPage.fontFamily.value" :teleported="false" :disabled="isLoading" class="inputs w-12rem" placeholder="请选择主题字体">
              <el-option v-for="item in setting.settingPage.fontFamily.list" :key="item.value" :label="item.name" :value="item.value" />
            </el-select>
          </div>
          <!-- 黑暗 -->
          <div class="group flex-row-bt-c">
            深色模式
            <el-radio-group v-model="setting.settingPage.modeToggle.value" class="inputs w-12rem" :disabled="isLoading" @click="(e:MouseEvent) => theEvent = e">
              <el-radio-button v-for="p in setting.settingPage.modeToggle.list" :key="p.value" :disabled="isLoading" class="flex-1" :label="p.value">
                {{ p.name }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </section>
        <!-- 保存 -->
        <div class="btns mt-a flex-row-bt-c">
          <i />
          <BtnElButton class="ml-a shadow" icon-class="i-solar:diskette-bold" type="info" :transition-icon="true" round @click="onSave">
            保存
          </BtnElButton>
        </div>
      </main>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.inputs {
  --at-apply: 'transition-200 select-none opacity-80 group-hover:opacity-100';
}

:deep(.el-radio-group.inputs) {
  border: 1px solid #7c7c7c33;
  border-radius: 1rem;

  .el-radio-button__inner {
    border: none;
    border-radius: 1rem;
    width: 100%;
  }
}

:deep(.el-select) {
  position: relative;
  z-index: 99;

  .el-input__wrapper {
    border-radius: 1rem;
  }

  .el-popper.el-select__popper {
    border-radius: 1rem;
    overflow: hidden;
  }

  .el-input__inner {
    padding-left: 0.5rem;
  }
}
</style>
