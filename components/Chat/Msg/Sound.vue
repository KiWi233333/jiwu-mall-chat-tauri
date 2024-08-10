<script lang="ts" setup>
import { dayjs } from "element-plus";

/**
 * 文本消息
 */
const props = withDefaults(defineProps<{
  data: ChatMessageVO<SoundBodyMsgVO>
  lastMsg: Partial<ChatMessageVO<TextBodyMsgVO>>
  index: number
  showTranslation: boolean
}>(), {
  showTranslation: false,
});

const { data } = toRefs(props);
const chat = useChatStore();
const user = useUserStore();
// 具体
const body: Partial<SoundBodyMsgVO> = props.data.message.body || {};
const theSecond = ref(body.second);
const getSoundText = computed(() => {
  if (!theSecond.value)
    return "0\"";
  if (theSecond.value <= 60)
    return `${theSecond.value % 60}"`;
  else if (theSecond.value <= 3600)
    return `${Math.floor(theSecond.value / 60)}'${theSecond.value % 60}"`;
});

const getSoundTextRaw = computed(() => {
  if (!body.second)
    return "0\"";
  if (body.second <= 60)
    return `${body.second % 60}"`;
  else if (body.second <= 3600)
    return `${Math.floor(body.second / 60)}'${body.second % 60}"`;
});

// 点击播放音频
function playSound(newUrl?: string) {
  if (chat.playSounder?.url === newUrl && chat.playSounder?.state === "play") {
    chat.playSounder?.audio?.pause();
    chat.playSounder.state = "pause";
    chat.playSounder.currentSecond = 0;
    return;
  }
  if (chat.playSounder?.url !== newUrl)
    resetPlaySounder();

  const audio = new Audio(BaseUrlSound + newUrl);
  audio.play();
  chat.playSounder = {
    url: newUrl,
    state: "loading",
    currentSecond: 0,
    duration: body?.second || 0,
    audio,
  };
  theSecond.value = 0;
  audio.addEventListener("timeupdate", onTimeupdate);
  audio.addEventListener("ended", resetPlaySounder);
  audio.addEventListener("loadeddata", onLoadeddata);
  audio.addEventListener("pause", resetPlaySounder);
}
function onLoadeddata() {
  chat.playSounder.state = "play";
}
function onTimeupdate() {
  if (chat.playSounder?.state === "play") {
    const currentSecond = Math.floor(chat.playSounder.audio?.currentTime || 0);
    if (currentSecond !== chat.playSounder?.currentSecond) {
      chat.playSounder.currentSecond = currentSecond;
      theSecond.value = currentSecond;
    }
  }
}
// 重置播放器
function resetPlaySounder() {
  if (chat.playSounder) {
    chat.playSounder.audio?.pause();
    if (chat.playSounder.audio) {
      chat.playSounder.audio.src = "";
      chat.playSounder.audio.removeEventListener("timeupdate", onTimeupdate);
      chat.playSounder.audio.removeEventListener("ended", resetPlaySounder);
      chat.playSounder.audio.removeEventListener("loadeddata", onLoadeddata);
      chat.playSounder.audio.removeEventListener("pause", resetPlaySounder);
    }
    chat.playSounder.state = "stop";
    chat.playSounder.currentSecond = 0;
    chat.playSounder.audio = undefined;
    chat.playSounder.url = "";
  }
  theSecond.value = body?.second || 0;
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
      </p>
      <!-- 内容 -->
      <slot name="body">
        <p
          class="msg-popper cursor-pointer sm:max-w-35vw hover:op-80" :class="{ 'animate-pulse': chat.playSounder?.url === body?.url && chat.playSounder?.state === 'play' }"
          @click="playSound(body?.url)"
        >
          <i :class="chat.playSounder?.url === body.url && chat.playSounder?.state === 'loading' ? 'i-solar:menu-dots-bold-duotone animate-spin ' : 'i-solar:volume-loud-outline'" p-2 />
          {{ chat.playSounder?.url === body.url ? getSoundText : getSoundTextRaw }}
          <small v-if="body?.translation && showTranslation" class="mt-2 block border-t-(1px #8585828e solid) pt-1.5">
            {{ body?.translation }}
          </small>
        </p>
      </slot>
      <!-- 回复 -->
      <small v-if="body?.reply" class="max-w-50vw w-fit cursor-pointer truncate truncate px-2 text-0.75em op-80 sm:max-w-30em btn-primary border-default card-default" @click="chat.scrollReplyMsg(body?.reply?.id || 0, body?.reply?.gapCount)">
        回复：{{ `${body.reply.nickName}:${body.reply?.body || ''}` }}
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';
</style>
