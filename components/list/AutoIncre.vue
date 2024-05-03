<script lang="ts" setup>
const props = withDefaults(defineProps<{
  noMore?: boolean
  immediate?: boolean
  delay?: number
  loading?: boolean
  loadingClass?: string
  appendLoadingClass?: string
  ssr?: boolean
  autoStop?: boolean
}>(), {
  noMore: false,
  immediate: true,
  loading: false,
  ssr: true,
  autoStop: true,
  delay: 500,
  loadingClass: "mx-a my-0.6em h-1.4rem w-1.4rem animate-[spin_2s_infinite_linear] rounded-6px bg-[var(--el-color-primary)]",
  appendLoadingClass: "",
});
const emit = defineEmits(["load"]);
// 停止加载
const loadMoreRef = ref();
const isSee = ref(props.immediate);
// 首次执行
onMounted(() => {
  if (props.immediate)
    emit("load");
});
// 定时器
let timer: any = null;
const showLoad = computed(() => {
  return props.loading || !props.noMore;
});
// 刷新
const { stop, isSupported } = useIntersectionObserver(
  loadMoreRef,
  ([obj]) => {
    isSee.value = obj.isIntersecting;
    callBack();
  },
);

// 监听
watch(isSee, (val) => {
  if (!val)
    return;
  callBack();
});


function callBack() {
  if (showLoad.value && isSee.value) {
    timer = setTimeout(callBack, props.delay * 2);
    emit("load");
  }
  else if (props.noMore && props.autoStop) {
    stop && stop();
    clearTimeout(timer);
  }
}

onMounted(() => {
  if (props.immediate)
    emit("load");
});
onUnmounted(() => {
  clearTimeout(timer);
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
    class="min-h-1em"
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
  <div v-else class="animate-fade-in">
    <slot name="done">
      <div v-if="!noMore " key="done" h-2 w-full text-center text-bluegray @click="!isSupported && $emit('load')" />
    </slot>
  </div>
</template>
