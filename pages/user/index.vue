<script lang="ts" setup>
import { appName } from "@/constants";

const user = ref<Partial<UserInfoVO>>();
const isLoading = ref(false);
const store = useUserStore();
const route = useRoute();
const isSelf = ref(false);

const ohterUserId = route.query?.id ? route.query?.id.toString() : "";
isLoading.value = true;
if (ohterUserId && ohterUserId !== store?.userInfo?.id) {
  isSelf.value = false;
  // 获取用户信息
  const res = await getCommUserInfoSe(ohterUserId, store.getToken);
  if (res.code === StatusCode.SUCCESS) {
    user.value = {
      id: ohterUserId,
      ...res.data,
    } as UserInfoVO;
  }
  isLoading.value = false;
}
else {
  isSelf.value = true;
  user.value = store.userInfo;
}

useHead({
  title: () => `${isSelf.value ? "个人信息" : user?.value?.nickname} - 个人中心 - ${appName}`,
  meta: [
    {
      name: "description",
      content: () => `个人信息 - 个人中心 - ${appName}`,
    },
  ],
});

// 页面
definePageMeta({
  key: route => route.path,
  layout: false,
});
</script>

<template>
  <div>
    <NuxtLayout name="chat">
      <div w-full flex flex-col>
        <!-- 壁纸 -->
        <UserInfoBgToggle class="fixed left-0 top-0 z-0 w-full" />
        <div class="mains">
          <!-- 用户头像 -->
          <div v-if="user" class="avatars relative flex-1 -top-5em md:pr-4">
            <UserInfoLine
              :data="user"
              :is-edit="isSelf"
            />
          </div>
          <!-- 右侧 -->
          <div class="hidden flex-col gap-6 -mt-6 sm:flex">
            <!-- 帖子 -->
            <CardUserPostTotal
              v-if="user?.id"
              :dto="{
                userId: user?.id,
              }"
              :user="user"
              grid-class="grid grid-cols-4 gap-4"
              card-class="truncate word-nowrap text-0.85rem"
              class="p-4 border-default card-default-br"
            />
            <!-- 签到 -->
            <UserInfoSigninCard class="border-default card-default-br" />
          </div>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.mains {
  --at-apply: 'grid grid-cols-1 pl-2rem pr-4rem sm:(grid-cols-[2fr_1fr] px-4rem)';
}
</style>
