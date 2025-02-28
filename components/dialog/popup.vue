<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface DialogPosition {
  x: number;
  y: number;
}

interface DialogStyle {
  transformOrigin?: string;
  transform?: string;
  opacity?: string;
  width?: string;
  transition?: string;
}

interface DialogProps {
  modelValue: boolean;
  title?: string;
  width?: string | number;
  showClose?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  closeOnClickModal?: boolean;
  teleportTo?: string | HTMLElement;
  contentClass?: string;
  duration?: number;
  destroyOnClose?: boolean;
  center?: boolean;
}

const {
  modelValue = false,
  title,
  width = "",
  showClose = true,
  teleportTo = "body",
  confirmButtonText = "确定",
  cancelButtonText = "取消",
  closeOnClickModal = true,
  contentClass = "",
  duration = 300,
  center = false,
  destroyOnClose = false,
} = defineProps<DialogProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "open"): void;
  (e: "opened"): void;
  (e: "close"): void;
  (e: "closed"): void;
}>();

// 控制内容渲染的状态
const shouldRenderContent = ref(modelValue);
// 是否应当销毁内容标记
const shouldDestroy = ref(false);

// 监听 modelValue 变化
watch(() => modelValue, (newVal) => {
  if (newVal) {
    // 打开时，立即渲染内容
    shouldRenderContent.value = true;
    shouldDestroy.value = false;
  }
  else if (destroyOnClose) {
    // 关闭时，将销毁标记置为true，实际销毁会在动画结束后执行
    shouldDestroy.value = true;
  }
});

const dialogRef = useTemplateRef<HTMLElement>("dialogRef");
const lastClickPosition = ref<DialogPosition>({ x: 0, y: 0 });
const dialogStyle = ref<DialogStyle>({
  transform: "scale(1)",
  opacity: "1",
});
const transition = "transform var(--duration, 0.3s) cubic-bezier(0.61, 0.225, 0.195, 1), opacity var(--duration, 0.3s) cubic-bezier(0.61, 0.225, 0.195, 1)";
const loadingAnima = ref(false);

// 计算对话框的最终宽度
const dialogWidth = computed(() => {
  if (!width)
    return "";
  return typeof width === "number" ? `${width}px` : width;
});

// 监听鼠标点击事件，记录点击位置
function trackMousePosition(e: MouseEvent) {
  if ((!loadingAnima.value && !modelValue) || (!lastClickPosition.value.x && !lastClickPosition.value.y)) {
    lastClickPosition.value = { x: e.clientX, y: e.clientY };
  }
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener("mousedown", trackMousePosition);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousedown", trackMousePosition);
});

// 处理关闭对话框
function handleClose() {
  if (closeOnClickModal) {
    emit("update:modelValue", false);
    emit("cancel");
  }
}

// 处理确认按钮点击
function handleConfirm() {
  emit("confirm");
  emit("update:modelValue", false);
}

// 计算点击位置相对于对话框的相对坐标
function calculateTransformOrigin() {
  if (!dialogRef.value)
    return "center";

  const dialog = dialogRef.value;
  const rect = dialog.getBoundingClientRect();

  // 使用最后的点击位置或窗口中心作为默认值
  const clickX = lastClickPosition.value.x || window.innerWidth / 2;
  const clickY = lastClickPosition.value.y || window.innerHeight / 2;

  // 计算点击位置相对于对话框的相对坐标
  const originX = clickX - rect.left;
  const originY = clickY - rect.top;

  return `${originX}px ${originY}px`;
}

// 过渡动画钩子函数
function onBeforeEnter(): void {
  emit("open");
  loadingAnima.value = true;
  // 重置样式，准备开始入场动画
  dialogStyle.value = {
    transform: "scale(0.5)",
    opacity: "0",
    transition: "none", // 确保没有过渡效果以立即应用初始状态
  };
}

function onEnter(): void {
  // 在下一个帧应用变换原点和动画
  nextTick(() => {
    if (!dialogRef.value)
      return;
    const originPoint = calculateTransformOrigin();
    dialogStyle.value = {
      transformOrigin: originPoint,
      transform: "scale(1)",
      opacity: "1",
      transition,
    };
  });
}

function onAfterEnter(): void {
  emit("opened");
  loadingAnima.value = false;
}

function onBeforeLeave(): void {
  emit("close");
  loadingAnima.value = true;
  if (!dialogRef.value)
    return;

  // 使用与打开相同的变换原点
  const originPoint = calculateTransformOrigin();

  // 首先确保有正确的原点，但保持对话框可见
  dialogStyle.value = {
    transformOrigin: originPoint,
    transform: "scale(1)",
    opacity: "1",
    transition: "none", // 确保立即应用
  };

  // 然后在下一帧应用收缩动画
  nextTick(() => {
    dialogStyle.value = {
      transformOrigin: originPoint,
      transform: "scale(0.5)",
      opacity: "0",
      transition,
    };
  });
}

function onAfterLeave(): void {
  emit("closed");
  // 重置样式
  dialogStyle.value = {
    transform: "scale(1)",
    opacity: "1",
  };
  loadingAnima.value = false;

  // 在动画完全结束后，如果标记为应当销毁，则执行销毁操作
  if (shouldDestroy.value) {
    destroy();
  }
}

// 销毁方法
function destroy() {
  // 只有在需要销毁时才执行
  if (shouldDestroy.value) {
    // 设置状态以阻止内容渲染
    shouldRenderContent.value = false;
    // 重置点击位置
    lastClickPosition.value = { x: 0, y: 0 };
  }
}

defineExpose({
  handleClose,
  handleConfirm,
  destroy,
});
</script>

<template>
  <Teleport :to="teleportTo">
    <Transition
      name="fade"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-show="modelValue"
        key="dialog"
        :style="{ '--duration': `${duration}ms` }"
        class="fixed inset-0 z-2099 flex items-center justify-center"
        @click.self="handleClose"
      >
        <!-- 背景遮罩 -->
        <div
          class="fixed inset-0 card-rounded-df bg-black/40 transition-opacity duration-300 border-default-2 dark:bg-black/70"
          @click="handleClose"
        />
        <!-- 对话框 -->
        <div
          v-if="shouldRenderContent"
          ref="dialogRef"
          :style="[dialogStyle, { width: dialogWidth }]"
          class="relative"
          :class="{
            'disabled-anima': loadingAnima,
            'max-w-90vw rounded-2 sm:w-fit p-4 border-default-2 dialog-bg-color shadow': !contentClass,
            [contentClass]: contentClass,
            'text-center': center,
          }"
          v-bind="$attrs"
        >
          <!-- 标题区 -->
          <div class="relative pr-4">
            <slot name="title">
              <div mb-4>
                {{ title }}
              </div>
            </slot>
            <span
              v-if="showClose"
              class="absolute right-0 top-0 cursor-pointer btn-danger"
              @click="handleClose"
            >
              <i
                i-carbon:close p-2.8
                title="关闭"
              />
            </span>
          </div>
          <!-- 内容区 -->
          <slot />
          <!-- 底部 -->
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
/* .dialog-popper-enter-active,
.dialog-popper-leave-active {
  transition: opacity var(--duration, 0.3s) ease;
}

.dialog-popper-enter-from,
.dialog-popper-leave-to {
  opacity: 0;
} */
.disabled-anima {
  * {
    transition: none !important;
  }
}
</style>
