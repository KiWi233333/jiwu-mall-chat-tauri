<script lang="ts" setup>
import { type CommPostActionVO } from "@/composables/api/community/post";

const { data } = defineProps<{
  data: CommPostActionVO
}>();
const emit = defineEmits<{
  (e: "cancel", id: CommPostActionVO): void
}>();
const user = useUserStore();
const Host = `${location.protocol}/${location?.host}`;
</script>

<template>
  <main h-fit flex-row-bt-c border-0 border-b-1px py-4 border-default>
    <div class="h-5rem flex flex-1 flex-col pr-4">
      <NuxtLink
        tag="div"
        :to="`/community/post/detail/${data.postId}`"
      >
        <div class="flex-row-bt-c">
          <!-- 标题 -->
          <h4 for="content" class="truncate" flex items-center gap-2 truncate font-500>
            <el-tag
              v-if="data?.postInfo?.isEssence" class="font-600 shadow"
              round
              type="warning"
              effect="dark"
              size="small"
            >
              <i i-solar:crown-star-bold mr-1 p-0.5em />
              精选
            </el-tag>
            {{ data?.postInfo?.title }}
          </h4>
        </div>
      </NuxtLink>
      <div class="mt-a flex-row-bt-c">
        <div class="mt-4 hidden w-full items-center gap-2 md:flex">
          <!-- 评论 -->
          <span
            class="tip-group tip-group link-text mr-2"
          >
            <i
              class="i-solar:chat-dots-outline mr-1 p-0.5em"
            />
            <small>{{ data?.postInfo?.comments || '暂无' }}</small>
          </span>
          <!-- 点赞 -->
          <span class="link-text mr-2">
            <i
              class="i-solar:like-outline mr-1 p-0.5em"
            />
            <small>{{ data?.postInfo?.likes || '暂无' }}</small>
          </span>
          <span v-copying.toast="`${Host}/community/post/detail/${data?.postInfo?.id}`" class="link-text">
            <i
              class="i-solar:share-outline mr-1 p-0.5em"
            />
            <small>分享</small>
          </span>
          <span class="link-text" @click="$emit('cancel', data)">
            <i
              class="i-solar:star-outline mr-1 p-0.5em"
            />
            <small>取消</small>
          </span>
        </div>
        <!-- tags -->
        <div
          v-if="data?.postInfo?.tags?.trim()"
        >
          <NuxtLink
            tag="div"
            class="grid flex gap-2 op-70"
            :to="`/community/post/detail/${data.postId}`"
          >
            <CommTagList size="small" :tags="data?.postInfo?.tags" effect="dark" />
          </NuxtLink>
        </div>
      </div>
    </div>
    <!-- 封面 -->
    <CardElImage
      fit="cover"
      class="h-5rem w-8rem card-default"
      loading="lazy"
      preview-teleported
      :src="BaseUrlImg + data?.postInfo?.cover"
    />
  </main>
</template>

<style lang="scss" scoped>
.text-overflow-5 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
}

.link-text {
  --at-apply: 'opacity-80 text-1rem hover:(text-[var(--el-color-info)] opacity-100) cursor-pointer transition-200 ';
}

.tip-group {
  &:hover {
    .toggle-tip {
      display: none;
    }

    .data {
      display: inline-block;
    }
  }
}
</style>
