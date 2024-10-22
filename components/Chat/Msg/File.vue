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
const setting = useSettingStore();
const isDownload = ref(false);
function onDownloadFile(url: string, fileName: string) {
  if (isDownload.value)
    return;
  const item = setting.fileDownloadMap?.[url];
  if (item) {
    setting.openFileByDefaultApp(item);
    return;
  }
  isDownload.value = true;
  downloadFile(url, fileName, body?.mimeType, (val) => {
    if (val >= 1)
      isDownload.value = false;
  });
  nextTick(() => {
    setting.showDownloadPanel = true;
  });
}

// 导出
defineExpose({
  onDownloadFileAndOpen: () => onDownloadFile(BaseUrlFile + body.url, fileName),
});
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
        :title="fileName"
        class="file max-w-14em w-fit flex flex-row-reverse cursor-pointer gap-3 p-3 shadow-sm transition-all !items-center border-default hover:border-[var(--el-color-primary)] card-default bg-color hover:shadow-lg"
        @click="onDownloadFile(BaseUrlFile + body.url, fileName)"
      >
        <img :src="body.mimeType ? FILE_TYPE_ICON_MAP[body.mimeType] : FILE_TYPE_ICON_DEFAULT" class="file-icon h-8 w-8 object-contain">
        <div>
          <p class="text-overflow-2 text-sm leading-4">
            {{ fileName }}
          </p>
          <small v-if="body?.url && setting.fileDownloadMap[BaseUrlFile + body.url]?.status === FileStatus.DOWNLOADED" class="float-left mt-2 text-xs op-60">
            <i i-solar-check-circle-outline p-2 />&nbsp;已下载
          </small>
          <small class="float-right mt-2 text-xs op-60">
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
