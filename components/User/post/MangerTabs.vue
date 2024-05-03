<script lang="ts" setup>
import { appName } from "~/constants";

const user = useUserStore();
const route = useRoute();
const searchDTO = ref({
  userId: user.userInfo.id,
  status: route?.query.status !== undefined ? +(route?.query?.status || -1) : -1,
  name: undefined,
  cid: undefined,
  commentSort: undefined,
  isEssence: undefined,
  isNew: undefined,
  viewsSort: undefined,
});
const tabsList = ref([
  // 全部
  {
    label: "全部",
    icon: "",
    dto: {
      status: -1,
      isNew: isTrue.TRUE,
    },
  },
  // 待审核
  {
    label: "待审核",
    icon: "",
    dto: {
      status: +PostStatus.UNDOING,
      isNew: isTrue.TRUE,
    },
  },
  // 已审核
  {
    label: "已审核",
    icon: "",
    dto: {
      status: +PostStatus.PUBLISHED,
    },
  },
  // 已驳回
  {
    label: "已驳回",
    icon: "",
    dto: {
      status: +PostStatus.REJECT,
    },
  },
  // 管理员删除
  {
    label: "管理员删除",
    icon: "",
    dto: {
      status: +PostStatus.ADMIN_DELETED,
    },
  },
  // 草稿箱
  {
    label: "草稿箱",
    icon: "i-solar:inbox-in-bold-duotone",
    dto: {
      status: +PostStatus.DRAFT,
    },
  },
  // 回收站
  {
    label: "回收站",
    icon: "i-solar:trash-bin-trash-bold-duotone",
    dto: {
      status: +PostStatus.DELETED,
    },
  },

]);
useHead({
  title: `${tabsList.value[searchDTO.value.status] ? `${tabsList.value[searchDTO.value.status]?.label}帖子` : "我的帖子"} - 个人中心 - ${appName}`,
});

/**
 * 重置筛选
 */
function reload(clear?: boolean) {
  if (clear) {
    searchDTO.value = {
      userId: user.userInfo.id,
      name: undefined,
      status: -1,
      cid: undefined,
      commentSort: undefined,
      isEssence: undefined,
      isNew: undefined,
      viewsSort: undefined,
    };
  }
}
</script>

<template>
  <div mb-4 flex flex-nowrap items-center gap-4 truncate>
    <small>筛选：</small>
    <!-- 关键字筛选 -->
    <div>
      <el-input
        v-model.lazy="searchDTO.name"
        prefix-icon="Search"
        placeholder="关键字（ Enter ）"
        @keyup.enter="reload"
      />
    </div>
    <!-- 分类筛选 -->
    <UserPostCategorySelect
      v-model="searchDTO.cid"
      placeholder="圈子分类筛选"
    />
    <div class="ml-a flex flex-nowrap">
      <btn-el-button

        plain transition-icon
        type="danger"
        icon-class="i-solar:refresh-outline mr-1.4"
        @click="reload(true)"
      >
        重置
      </btn-el-button>
      <btn-el-button
        transition-icon
        icon-class="i-solar:magnifer-broken mr-1.4"
        type="info"
        @click="reload()"
      >
        搜索
      </btn-el-button>
    </div>
  </div>
  <el-tabs
    v-model="searchDTO.status"
    tab-position="top"
  >
    <!-- 全部 -->
    <el-tab-pane
      v-for="p in tabsList"
      :key="p.dto.status"
      :name="p.dto.status"
      lazy
    >
      <template #label>
        <span class="group">
          <i v-if="p.icon" :class="p.icon" class="p-0 transition-200 transition-all group-hover:(m-1 p-0.6em)" />
          {{ p.label }}
        </span>
      </template>
      <!-- 用户帖子列表  -->
      <UserPostInfoList
        :dto="searchDTO"
        :status="p.dto.status"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="scss"></style>
