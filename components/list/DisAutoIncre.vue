<script lang="ts" setup>
const props = withDefaults(defineProps<{
  noMore?: boolean
  immediate?: boolean
  delay?: number
  loading?: boolean
  loadingClass?: LoadingClassEnum | string
  appendLoadingClass?: string
  autoStop?: boolean
  thresholdHeight?: number
}>(), {
  noMore: false,
  immediate: true,
  loading: false,
  autoStop: true,
  delay: 600,
  thresholdHeight: 300,
  appendLoadingClass: "mx-a text-1.8rem",
  loadingClass: "mx-a my-0.6em h-1.4rem w-1.4rem animate-[spin_2s_infinite_linear] rounded-6px bg-[var(--el-color-primary)]",
});
const emit = defineEmits(["load"]);

enum LoadingClassEnum {
  "load-empty-circle",
  "load-chaotic-orbit",
  "load-db-rule",
}
const isLoaing = ref(false);
// 停止加载
const loadMoreRef = ref();
const isIntersecting = ref(false);
// 定时器
let timer: any = null;

// 刷新
const { stop, isSupported } = useIntersectionObserver(
  loadMoreRef,
  ([obj]) => {
    isIntersecting.value = !!obj?.isIntersecting;
  },
  {
    threshold: 0,
  },
);

function callBack() {
  if (props.noMore && props.autoStop) {
    clearInterval(timer);
    stop && stop();
  }
  else {
    emit("load");
  }
}
watch(isIntersecting, (val) => {
  if (val) {
    callBack && callBack();
    timer = setInterval(callBack, props.delay);
  }
  else {
    clearInterval(timer);
  }
}, {
  immediate: props.immediate,
});
if (props.immediate) {
  clearInterval(timer);
  callBack && callBack();
  timer = setInterval(callBack, props.delay);
}

// 展示加载
const showLoad = computed(() => {
  return !props.noMore && !props.loading;
});


// 是否没有更多
watch(() => props.noMore, (val) => {
  if (val && props.autoStop)
    stop && stop();
});
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
  <!-- 加载 -->
  <div
    v-if="showLoad" relative pt-4
  >
    <div
      ref="loadMoreRef"
      key="loadMoreRef" absolute top-0 w-full py-4
      :style="{ height: `${thresholdHeight}px` }"
    >
      <slot name="load">
        <div
          key="load"
          :class="`${loadingClass} ${appendLoadingClass}`"
        />
      </slot>
    </div>
  </div>
  <!-- 完成 -->
  <div v-else>
    <slot name="done">
      <div v-if="!noMore && !loading " key="done" mim-h-4 w-full text-center text-mini @click="!isSupported && $emit('load')">
        <!-- 暂无更多 -->
      </div>
    </slot>
  </div>
  <!-- 调试 -->
  <!-- <div fixed bottom-400px>
    {{ isIntersecting }}
  </div> -->
  <slot name="default" />
</template>
