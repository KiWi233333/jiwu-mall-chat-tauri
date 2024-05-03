<script lang="ts" setup>
/**
 * 文本消息
 */
const props = defineProps<{
  data: ChatMessageVO<TextBodyMsgVO>
  index: number
}>();

const { data } = toRefs(props);
const user = useUserStore();
const nowDate = Date.now();

function getTime(time: string) {
  return (nowDate - +time) > 24 * 3600
    ? useDateFormat(time, "YYYY-MM-DD HH:mm:ss").value.toString()
    : useDateFormat(time, "HH:mm:ss").value.toString()
  ;
}
</script>


<template>
  <div
    v-bind="$attrs"
    :label="data.roomId"
    class="msg"
    :class="{
      self: data?.fromUser?.userId === user?.userInfo.id,
    }"
  >
    <!-- 头像 -->
    <CardElImage :src="BaseUrlImg + data.fromUser.avatar" fit="cover" class="avatar h-2.4rem w-2.4rem flex-shrink-0 rounded-1/2 object-cover border-default" />
    <!-- 消息体 -->
    <div class="flex flex-col">
      <!-- 昵称 -->
      <small class="nickname">
        {{ data.fromUser.nickName }}
      </small>
      <!-- 内容 -->
      <template v-if="data.fromUser.userId === user.userInfo.id">
        <p class="msg-popper mt-2">
          {{ data.message?.content }}
        </p>
      </template>
      <v-md-preview
        v-else
        class="msg-popper markdown mt-2 sm:max-w-40rem"
        :text="data.message?.content"
      />
    </div>
  </div>
  <p v-if="index % 8 === 0" w-full py-2 text-center text-0.8em op-80>
    {{ getTime(data.message.sendTime) }}
  </p>
</template>

<style lang="scss" scoped>
@use './msg.scss';
.markdown {
  :deep(.vuepress-markdown-body) {
    font-size: 0.95em;
    background: transparent;
    padding: 0 !important;
    * {
      background: transparent ;
    }
    a {
      color: var(--el-color-info);
    }

    a:active,
    a:focus,
    a:valid,
    a:active {
      background-color: none;
    }
    a:hover{
      color: var(--el-color-info);
    }
    img {
      --at-apply: "block rounded-2 max-w-10rem max-h-10rem";
    }
  }
}
</style>
