<script lang="ts" setup>
import type { FileBodyMsgVO } from "~/composables/api/chat/message";
import { FILE_TYPE_ICON_DEFAULT, FILE_TYPE_ICON_MAP, downloadFile, formatFileSize } from "~/composables/api/res/file";

/**
 * 文件消息
 */
const props = defineProps<{
  data: ChatMessageVO<FileBodyMsgVO>
  lastMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
const { data } = toRefs(props);
// 具体
const body: Partial<FileBodyMsgVO> | undefined = props.data.message?.body || {};
const fileName = body.fileName || `${body?.url?.split("/").pop() || "未知文件"}.${body.fileType?.toLocaleLowerCase()}`;

const isDownload = ref(false);
function onDownloadFile(url: string, fileName: string) {
  if (isDownload.value)
    return;
  isDownload.value = true;
  downloadFile(url, fileName, (val) => {
    if (val === 1)
      isDownload.value = false;
  });
}
</script>

<template>
  <ChatMsgTemplate
    :last-msg="lastMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <!-- 文件 -->
      <div
        v-loading="isDownload"
        :title="fileName" class="max-w-14em w-fit flex cursor-pointer gap-3 p-3 shadow-sm transition-all !items-center border-default hover:border-[var(--el-color-primary)] card-default bg-color hover:shadow-lg" @click="onDownloadFile(BaseUrlFile + body.url, fileName)"
      >
        <img :src="body.mimeType ? FILE_TYPE_ICON_MAP[body.mimeType] : FILE_TYPE_ICON_DEFAULT" class="h-8 w-8 object-contain">
        <div class="flex flex-col justify-between">
          <p class="text-overflow-2 text-sm">
            {{ fileName }}
          </p>
          <small class="ml-a text-xs op-60">
            {{ formatFileSize(body.size || 0) }}
          </small>
        </div>
      </div>
      <!-- 内容 -->
      <p v-if="data.message?.content?.trim()" class="msg-popper">
        {{ data.message.content }}
      </p>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
