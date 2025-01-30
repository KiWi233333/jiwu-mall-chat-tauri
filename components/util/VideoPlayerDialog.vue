<script lang="ts" setup>
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);
const setting = useSettingStore();
const videoInfo = ref<{
  url: string;
  muted: boolean;
  mouseX?: number | undefined;
  mouseY?: number | undefined;
  thumbUrl?: string | undefined;
  thumbSize?: number | undefined;
  thumbWidth?: number | undefined;
  thumbHeight?: number | undefined;
}>({
  url: "",
  muted: true,
  mouseX: undefined,
  mouseY: undefined,

  thumbUrl: undefined,
  thumbSize: undefined,
  thumbWidth: undefined,
  thumbHeight: undefined,
});
const show = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (val && videoInfo.value.url !== "") {
      document.addEventListener("fullscreenchange", onFullscreenChange);
    }
    emit("update:modelValue", val);
  },
});
const isFullscreen = ref(false);
const videoPlayerRef = useTemplateRef<HTMLVideoElement | null>("videoPlayerRef");
const status = ref<"playing" | "play-dbsound" | "paused" | "ended">("paused");
const src = computed(() => videoInfo.value.url);

// 全屏切换
function toggleFullscreen() {
  if (videoPlayerRef.value) {
    if (isFullscreen.value) {
      document.exitFullscreen().catch(() => {}); // 捕获可能的错误
    }
    else {
      if ("fullscreenElement" in document) {
        videoPlayerRef.value.requestFullscreen().catch(() => {}); // 捕获可能的错误
      }
    }
    isFullscreen.value = !isFullscreen.value;
  }
}

// 关闭弹窗
function closeDialog() {
  show.value = false;
  destroy();
}

// 生命周期方法
function onPlay() {
  status.value = "playing";
}

function onPause() {
  status.value = "paused";
}

function onEnded() {
  status.value = "ended";
}

// 全屏关闭时处理
// function onClosed() {
//   if (isFullscreen.value) {
//     document.exitFullscreen().catch(() => {}); // 捕获可能的错误
//   }
//   isFullscreen.value = false;
// }

// 全屏事件监听
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// 挂载时添加监听
onMounted(() => {
  mitter.on(MittEventType.VIDEO_READY, ({ type, payload }) => {
    // console.log(payload);
    switch (type) {
      case "play":
        status.value = "playing";
        show.value = true;
        videoInfo.value = {
          url: payload.url.startsWith("http") ? payload.url : "",
          muted: false,
          mouseX: payload.mouseX || undefined,
          mouseY: payload.mouseY || undefined,
          thumbUrl: payload.thumbUrl,
          thumbSize: payload.thumbSize,
          thumbWidth: payload.thumbWidth,
          thumbHeight: payload.thumbHeight,
        };
        break;
      case "play-dbsound":
        status.value = "play-dbsound";
        show.value = true;
        videoInfo.value = {
          url: payload.url.startsWith("http") ? payload.url : "",
          muted: true,
          mouseX: payload.mouseX || undefined,
          mouseY: payload.mouseY || undefined,
          thumbUrl: payload.thumbUrl,
          thumbSize: payload.thumbSize,
          thumbWidth: payload.thumbWidth,
          thumbHeight: payload.thumbHeight,
        };
        break;
      case "pause":
        status.value = "paused";
        videoPlayerRef.value?.pause();
        break;
      case "ended":
        status.value = "ended";
        show.value = false;
        break;
      default:
        break;
    }
  });
  document.addEventListener("fullscreenchange", onFullscreenChange);
});

// 卸载时移除监听
function destroy() {
  if (videoPlayerRef.value) {
    videoPlayerRef.value?.pause?.();
    videoInfo.value = {
      ...videoInfo.value,
      url: "", // 清空部分
      muted: true,
    };
  }
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  show.value = false;
}
onDeactivated(() => {
  destroy();
});
onUnmounted(() => {
  mitter.off(MittEventType.VIDEO_READY);
  destroy();
});

const videoSize = computed(() => {
  const res = {
    width: "100%",
    height: "100%",
  };
  if (videoInfo.value?.thumbWidth !== undefined && videoInfo.value?.thumbHeight !== undefined && globalThis) {
    const windowWidth = globalThis.window.innerWidth;
    const windowHeight = globalThis.window.innerHeight;
    if (setting.isMobileSize) {
      res.width = `100vw`;
      res.height = `100vh`;
    }
    else {
      const { width, height } = computedImgScaleSize(videoInfo.value.thumbWidth, videoInfo.value.thumbHeight, { maxWidth: Math.floor(windowWidth * 0.6), maxHeight: Math.floor(windowHeight * 0.6) });
      res.width = `${width}px`;
      res.height = `${height}px`;
    }
  }
  return res;
});
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="animate-[zoom-in_0.4s_var(--animate-cubic)]"
    leave-active-class="animate-[zoom-out_0.3s_var(--animate-cubic)]"
  >
    <div
      v-show="show"
      title="视频播放器"
      class="video-player-dialog fixed left-0 top-0 z-999 h-full w-full flex-row-c-c"
      :style="videoInfo.mouseX !== undefined && videoInfo.mouseY !== undefined ? `transform-origin: ${videoInfo.mouseX}px ${videoInfo.mouseY}px` : ''"
      @click.self="closeDialog"
    >
      <div
        class="group video-player relative flex-row-c-c animate-[fade-in_0.4s] card-rounded-df shadow-lg transition-none bg-color-2 border-default-hover"
      >
        <div class="menu absolute right-2 top-2 z-1 flex gap-4 px-4 py-2 transition-opacity card-default-br sm:(op-0 group-hover:op-100)">
          <div
            @click.stop="toggleFullscreen"
          >
            <i
              :class="isFullscreen ? 'i-tabler:minimize' : 'i-tabler:maximize'"
              :title="isFullscreen ? '还原' : '最大化'"
              p-2.8 filter-drop-shadow-lg btn-info
            />
          </div>
          <div @click.stop="closeDialog">
            <i title="关闭" i-carbon:close p-3 filter-drop-shadow-lg btn-danger />
          </div>
        </div>
        <video
          v-if="src"
          ref="videoPlayerRef"
          :style="{ width: videoSize.width, height: videoSize.height }"
          :src="src"
          controls
          autoplay
          :muted="!!videoInfo.muted"
          class="block h-full w-full overflow-hidden card-rounded-df object-contain"
          @play="onPlay"
          @pause="onPause"
          @ended="onEnded"
        />
        <div
          v-else card-rounded-df
          :style="{ width: videoSize.width, height: videoSize.height, background: `url(${videoInfo.thumbUrl}) no-repeat center center / cover` }"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
</style>
