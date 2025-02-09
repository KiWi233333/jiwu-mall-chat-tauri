<script lang="ts" setup>
/**
 * 群通知弹窗
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

// 消息群通知
const chat = useChatStore();
const applyFormRef = ref();
const applyForm = ref<ChatMessageDTO>({
  roomId: chat.theContact.roomId,
  msgType: MessageType.GROUP_NOTICE, // 系统消息
  content: "",
  body: {
    noticeAll: isTrue.TRUE, // 是否群发
    imgList: [], // 图片列表
    replyMsgId: undefined, // 回复消息ID
  },
});
// 群通知
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
  <el-dialog v-model="isShow" width="fit-content" center append-to-body>
    <template #title>
      <div class="flex-row-c-c">
        <i i-carbon:bullhorn p-2 />
        <span ml-2>群通知</span>
      </div>
    </template>
    <el-form ref="applyFormRef" :model="applyForm">
      <el-form-item
        label=""
        style="margin: 0.5rem 0 0 0;"
        prop="content"
        :rules="[{
                   min: 1,
                   max: 500,
                   message: '群通知不能超过500字！',
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
          placeholder="请输入群通知内容"
          @keydown.enter.prevent="addMsg"
        />
      </el-form-item>
      <el-form-item
        label=""
        style="margin: 0.5rem 0 0 0;"
        prop="body.noticeAll"
      >
        <!-- 是否群发 -->
        <el-checkbox
          v-model="applyForm.body.noticeAll"
          :true-value="1"
          :false-value="0"
        >
          群发
        </el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="mr-4 w-5rem" @click="isShow = false">取消</el-button>
        <el-button class="w-5rem" type="primary" @click="addMsg">
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

