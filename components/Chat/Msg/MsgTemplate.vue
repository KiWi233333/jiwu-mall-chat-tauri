<script lang="ts" setup>
import { dayjs } from "element-plus";

/**
 * 文本消息
 */
const { data } = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO | ImgBodyMsgVO>
  prevMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();
defineEmits(["clickAvatar"]);

const chat = useChatStore();
const user = useUserStore();
// 具体
const body = computed(() => data.message?.body as Partial<TextBodyMsgVO> | undefined);

function onCopyMsg(msg?: string | null) {
  if (!msg)
    return;
  const res = useCopyText(msg);
  if (res) {
    ElMessage.success({
      message: "复制成功",
      type: "success",
      grouping: true,
      duration: 500,
    });
  }
}
</script>

<template>
  <div
    v-bind="$attrs"
    :label="data.roomId"
    class="msg"
    :class="{
      self: user?.userInfo?.id && data?.fromUser?.userId === user?.userInfo?.id,
    }"
  >
    <!-- 头像 -->
    <CardElImage
      error-class="i-solar:user-broken"
      :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="avatar h-2.4rem w-2.4rem flex-shrink-0 cursor-pointer rounded-1/2 object-cover border-default"
      @click="$emit('clickAvatar', data.fromUser.userId)"
    />
    <!-- 消息体 -->
    <div class="body">
      <p class="flex-res truncate">
        <!-- 昵称 -->
        <small class="nickname">
          {{ data.fromUser.nickName }}
        </small>
        <small class="sendTime text-0.7em op-0">
          {{ dayjs(data.message.sendTime).format("YYYY-MM-DD HH:mm:ss") }}
        </small>
        <small class="sendTime text-0.7em op-0 btn-info" @click="onCopyMsg(data.message.content)">
          复制
        </small>
      </p>
      <!-- 内容 -->
      <slot name="body">
        <p class="msg-popper">
          {{ data.message.content }}
        </p>
      </slot>
      <!-- 回复 -->
      <small
        v-if="body?.reply"
        title="点击跳转"
        class="max-w-20em w-fit flex-1 cursor-pointer truncate px-2 text-0.75em sm:max-w-30em card-default dark:text-light-900 border-default-hover"
        @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount, false)"
      >
        <i class="i-solar:forward-2-bold-duotone mr-1 p-2" />
        {{ `${body.reply.nickName} : ${body.reply?.body || ''}` }}
      </small>
      <!-- AT @ -->
      <small
        v-if="body?.atUidList?.length && body?.atUidList.includes(user?.userInfo?.id)"
        class="at-list flex-ml-a w-fit cursor-pointer truncate px-2 text-[var(--el-color-info)] card-default"
      >
        有人@我
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
