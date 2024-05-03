<script lang="ts" setup>
const props = withDefaults(defineProps<{
  noMore?: boolean
  immediate?: boolean
  delay?: number
  loading?: boolean
  loadingClass?: LoadingClassEnum | string
  appendLoadingClass?: string
  autoStop?: boolean
}>(), {
  noMore: false,
  immediate: true,
  loading: false,
  autoStop: true,
  delay: 400,
  appendLoadingClass: "mx-a text-1.8rem",
  loadingClass: "mx-a my-0.6em h-1.4rem w-1.4rem animate-[spin_2s_infinite_linear] rounded-6px bg-[var(--el-color-primary)]",
});
const emit = defineEmits(["load"]);

enum LoadingClassEnum {
  "load-empty-circle",
  "load-chaotic-orbit",
  "load-db-rule",
}

// 停止加载
const loadMoreRef = ref();
// 首次执行
onMounted(() => {
  if (props.immediate)
    emit("load");
});
const isIntersecting = ref(false);
// 定时器
let timer: any = null;
// 刷新
const { stop, isSupported } = useIntersectionObserver(
  loadMoreRef,
  ([obj]) => {
    isIntersecting.value = obj.isIntersecting;
    if (obj.isIntersecting) {
      clearInterval(timer);
      callBack && callBack();
      timer = setInterval(callBack, props.delay * 2);
    }
    else {
      clearInterval(timer);
    }
  },
);

function callBack() {
  if (props.noMore && props.autoStop) {
    cancelAnimationFrame(timer);
    clearInterval(timer);
    stop && stop();
  }
  else {
    emit("load");
  }
}

if (props.immediate)
  emit("load");


onUnmounted(() => {
  cancelAnimationFrame(timer);
  clearInterval(timer);
  stop();
  timer = null;
});

watch(() => props.noMore, (val) => {
  if (val && props.autoStop) {
    cancelAnimationFrame(timer);
    stop && stop();
  }
});

watch(() => props.loading, (val) => {
  if (val)
    requestAnimationFrame(callBack);
});

const showLoad = computed(() => {
  return props.loading || !props.noMore;
});

defineExpose({
  stop,
  loadMoreRef,
});
</script>

<template>
  <!-- 加载 -->
  <div
    v-if="showLoad"
    ref="loadMoreRef"
    key="loadMoreRef"
    class="min-h-1em"
  >
    <slot name="load">
      <div
        key="load"
        :class="`${loadingClass} ${appendLoadingClass}`"
      />
    </slot>
  </div>
  <!-- 完成 -->
  <div v-else class="animate-fade-in">
    <slot name="done">
      <div v-if="!noMore && !loading " key="done" h-2 w-full text-center text-bluegray @click="!isSupported && $emit('load')">
        <!-- 暂无更多 -->
      </div>
    </slot>
  </div>
  <slot name="default" />
</template>
