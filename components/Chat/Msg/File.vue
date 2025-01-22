<script lang="ts" setup>
import type { FileBodyMsgVO } from "~/composables/api/chat/message";
import { DownFileStatusIconMap, downloadFile, FILE_TYPE_ICON_DEFAULT, FILE_TYPE_ICON_MAP, formatFileSize } from "~/composables/api/res/file";

/**
 * 文件消息
 */
const props = defineProps<{
  data: ChatMessageVO<FileBodyMsgVO>
  prevMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
const { data } = toRefs(props);
// 具体
const body: Partial<FileBodyMsgVO> | undefined = props.data.message?.body || {};
const fileName = body.fileName || `${body?.url?.split("/").pop() || "未知文件"}.${body.fileType?.toLocaleLowerCase()}`;
const setting = useSettingStore();
function onDownloadFile(url: string, fileName: string) {
  const item = setting.fileDownloadMap?.[url];
  if (item && item.status === FileStatus.DOWNLOADING) {
    setting.showDownloadPanel = true;
    return;
  }
  if (item) { // 存在文件则打开
    setting.openFileByDefaultApp(item);
    return;
  }
  // 下载文件
  downloadFile(url, fileName, {
    mimeType: body?.mimeType,
  }, (val) => {
  });
  if (setting.isDesktop) {
    nextTick(() => {
      setting.showDownloadPanel = true;
    });
  }
}

// 导出
defineExpose({
  onDownloadFileAndOpen: () => onDownloadFile(BaseUrlFile + body.url, fileName),
});

const fileItem = computed(() => setting.fileDownloadMap[BaseUrlFile + body.url]);
</script>

<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
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
          <small v-if="body?.url && setting.fileDownloadMap[BaseUrlFile + body.url]?.status !== undefined" class="float-left mr-2 mt-2 text-xs op-60">
            <i :class="fileItem?.status !== undefined ? DownFileStatusIconMap[fileItem?.status] : ''" p-2 />&nbsp;{{ fileItem ? DownFileTextMap[fileItem?.status] : "" }}
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
