<script lang="ts" setup>
import { appName } from "@/constants";

const user = ref<Partial<UserInfoVO>>();
const isLoading = ref(false);
const store = useUserStore();
const route = useRoute();
const isSelf = ref(true);

const userId = route.query?.id ? route.query?.id.toString() : "";
isLoading.value = true;
if (userId && userId !== store?.userInfo?.id) {
  isSelf.value = false;
  // 获取用户信息
  const res = await getCommUserInfoSe(userId, store.getToken);
  if (res.code === StatusCode.SUCCESS) {
    user.value = {
      id: userId,
      ...res.data,
    } as UserInfoVO;
  }
  else {
    user.value = store.userInfo;
    isSelf.value = true;
  }
  isLoading.value = false;
}
else { user.value = store.userInfo; }

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
    <NuxtLayout
      name="chat"
      :menu="['back']"
    >
      <ClientOnly>
        <template #fallback>
          <OtherPreLoading class="w-full" icon="" />
        </template>
        <div v-if="store?.getToken ">
          <!-- 壁纸 -->
          <UserInfoBgToggle class="fixed left-0 top-0 z-0 w-full" />
          <div class="gird-cols-1 grid px-2rem sm:(grid-cols-[3fr_1fr] px-4rem)">
            <!-- 用户头像 -->
            <div v-if="user" class="avatars relative flex-1 -top-5em md:pr-4">
              <UserInfoLine
                :data="user"
                :is-edit="isSelf"
              />
              <div class="m-2">
                <UserInfoTabs :user-id="userId" />
              </div>
            </div>
            <!-- 右侧 -->
            <div flex flex-col gap-6>
              <!-- 帖子 -->
              <CardUserPostTotal
                v-if="user?.id"
                :dto="{
                  userId: user?.id,
                }"
                :user="user"
                grid-class="grid grid-cols-4 gap-4"
                card-class="truncate word-nowrap text-0.85rem"
                class="p-4 border-default card-default"
              />
              <!-- 签到 -->
              <UserInfoSigninCard class="sm:w-360px" />
            </div>
          </div>
        </div>
      </ClientOnly>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss"></style>
