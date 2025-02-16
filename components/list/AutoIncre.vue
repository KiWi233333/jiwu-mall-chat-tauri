<script lang="ts" setup>
const props = withDefaults(defineProps<{
  noMore: boolean
  immediate?: boolean
  delay?: number
  loadingClass?: string
  appendLoadingClass?: string
  ssr?: boolean
  autoStop?: boolean
}>(), {
  noMore: false,
  immediate: true,
  ssr: true,
  autoStop: true,
  delay: 1000,
  loadingClass: "mx-a my-0.6em h-1.2em w-1.2em animate-[spin_2s_infinite_linear] rounded-6px bg-[var(--el-color-primary)]",
  appendLoadingClass: "",
});
const emit = defineEmits(["load"]);
// 停止加载
const loadMoreRef = ref();
const isSee = ref(props.immediate);
// 定时器
let timer: any = null;
const showLoad = computed(() => !props.noMore);
// 刷新
const { stop, isSupported } = useIntersectionObserver(
  loadMoreRef,
  (arr) => {
    const obj = arr[arr.length - 1];
    isSee.value = !!obj?.isIntersecting;
  },
);
// 监听
watch(isSee, (val) => {
  if (val) {
    callBack();
  }
  else {
    clearInterval(timer);
  }
});


function callBack() {
  if (props.noMore && props.autoStop) {
    stop && stop();
    clearInterval(timer);
  }
  else if (isSee.value) {
    clearInterval(timer);
    emit("load");
    timer = setInterval(callBack, props.delay);
  }
}

if (props.immediate)
  emit("load");
onUnmounted(() => {
  clearInterval(timer);
  stop();
  timer = null;
});
defineExpose({
  stop,
  loadMoreRef,
});
</script>

<template>
  <slot name="default" />
  <!-- 加载 -->
  <div
    v-if="showLoad"
    ref="loadMoreRef"
    key="loadMoreRef"
    class="z-9 min-h-1em"
  >
    <slot name="load">
      <div key="load" w-full flex-row-c-c py-2 text-center text-bluegray>
        <div
          :class="`${loadingClass} ${appendLoadingClass}`"
        />
      </div>
    </slot>
  </div>
  <!-- 完成 -->
  <div v-else>
    <slot name="done">
      <div v-if="!noMore " key="done" h-2 w-full text-center text-bluegray @click="!isSupported && $emit('load')" />
    </slot>
  </div>
</template>
