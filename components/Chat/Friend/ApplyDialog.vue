<script lang="ts" setup>
/**
 * 添加好友弹窗
 */
const props = defineProps<{
  show: boolean | undefined | null
  userId?: string
}>();
const emit = defineEmits<{
  (e: "update:show", value: boolean | undefined | null): void
  (e: "submit", userId: string): void
}>();
const isShowApply = computed({
  get: () => props.show !== undefined && props.show === true,
  set: value => emit("update:show", value),
});

// 添加好友
const applyFormRef = ref();
const applyForm = ref<ChatUserFriendApplyDTO>({
  msg: "",
  targetUid: "",
});
const user = useUserStore();
// 好友申请
async function addFrendApplyById() {
  applyFormRef?.value?.validate(async (valid: boolean) => {
    if (!valid || !props.userId)
      return;
    // 请求
    const res = await addFriendApply({
      ...applyForm.value,
      targetUid: props.userId,
    }, user.getToken);
    isShowApply.value = false;
    if (res.code !== StatusCode.SUCCESS)
      return;
    applyForm.value = {
      msg: "",
      targetUid: "",
    };
    emit("submit", props.userId);
    ElNotification.success("好友申请已发送！");
  });
}
</script>

<template>
  <el-dialog v-model="isShowApply" title="好友申请" width="fit-content" center append-to-body>
    <el-form ref="applyFormRef" :model="applyForm">
      <el-form-item
        label=""
        prop="msg"
        :rules="[{
                   min: 1,
                   max: 50,
                   trigger: ['blur', 'change'],
                   message: '申请理由1-50字符！',
                 },
                 {
                   required: true,
                   trigger: ['blur'],
                   message: '申请理由不能为空！',
                 }]"
        class="w-20rem"
      >
        <el-input v-model="applyForm.msg" type="textarea" :rows="4" placeholder="发送一条有趣的问候语吧~" @keyup.enter="addFrendApplyById" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="isShowApply = false">取消</el-button>
        <el-button type="primary" @click="addFrendApplyById">
          发起申请
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

