<script lang="ts" setup>
import { dayjs } from "element-plus";

/**
 * 其他未适配消息
 */
const { data } = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO | ImgBodyMsgVO>
  prevMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
}>();

const chat = useChatStore();
const user = useUserStore();
// 具体
const body = computed(() => data.message?.body as Partial<ChatMessageVO<TextBodyMsgVO>> | undefined);

function onCopyMsg(msg?: string | null) {
  if (!msg)
    return;
  const res = useCopyText(msg);
  if (res)
    ElMessage.success("复制成功");
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
    <CardElImage :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="avatar h-2.4rem w-2.4rem flex-shrink-0 rounded-1/2 object-cover border-default" />
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
      <p class="msg-popper">
        {{ data.message.content }}
      </p>
      <span class="mx-a max-w-full truncate px-4 py-1 pt-1.4 text-wrap text-0.7rem font-500 op-60 !w-fit border-default !rounded-1em card-default">
        未适配该消息，请升级客户端查看
      </span>
      <!-- AT @ -->
      <small
        v-if="body?.atUidList?.length && body?.atUidList.includes(user?.userInfo?.id)"
        class="at-list flex-ml-a w-fit cursor-pointer truncate px-2 text-[var(--el-color-info)] card-default"
      >
        有人@我
      </small>
      <!-- 回复 -->
      <small
        v-if="body?.reply"
        title="点击跳转"
        class="max-w-50vw w-fit cursor-pointer truncate truncate px-2 text-0.75em op-80 sm:max-w-30em btn-primary border-default card-default"
        @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount, false)"
      >
        {{ `${body.reply.nickName} : ${body.reply?.body || ''}` }}
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
