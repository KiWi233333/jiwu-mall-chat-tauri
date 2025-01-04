<script lang="ts" setup>
/**
 * 广播消息弹窗
 */
const props = defineProps<{
  show: boolean | undefined | null
}>();
const emit = defineEmits<{
  (e: "update:show", value: boolean | undefined | null): void
  (e: "submit", value: ChatMessageDTO): void
}>();
const isShow = computed({
  get: () => props.show !== undefined && props.show === true,
  set: value => emit("update:show", value),
});

// 消息广播
const chat = useChatStore();
const applyFormRef = ref();
const applyForm = ref<ChatMessageDTO>({
  roomId: chat.theContact.roomId,
  msgType: MessageType.SYSTEM, // 系统消息
  content: "",
  body: {
  },
});
const user = useUserStore();
// 群广播消息
async function addMsg() {
  applyFormRef?.value?.validate(async (valid: boolean) => {
    if (!valid)
      return;
    // 请求
    emit("submit", applyForm.value);
    applyForm.value.content = "";
    applyFormRef?.value?.resetFields();
    isShow.value = false;
  });
}
</script>

<template>
  <el-dialog v-model="isShow" title="群广播消息" width="fit-content" center append-to-body>
    <el-form v-if="isShow" ref="applyFormRef" :model="applyForm">
      <el-form-item
        label=""
        prop="content"
        :rules="[{
                   min: 1,
                   max: 500,
                   message: '广播消息不能超过500字！',
                 },
                 {
                   required: true,
                   message: '内容不能为空！',
                 }]"
        class="w-20rem"
      >
        <el-input
          v-model="applyForm.content"
          class="text-input card-rounded-df border-default-hover"
          autofocus type="textarea" :rows="4"
          placeholder="请输入广播消息内容"
          @keydown.enter.prevent="addMsg"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="isShow = false">取消</el-button>
        <el-button type="primary" @click="addMsg">
          发送
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.text-input {
  :deep(.el-textarea__inner) {
    resize: none;
    box-shadow: none !important;
    background-color: transparent;
    caret-color: var(--el-color-primary);
  }
}
</style>

