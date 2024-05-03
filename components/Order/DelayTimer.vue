<script lang="ts" setup>
const { date } = defineProps<{
  date: Date;
}>();
/**
 * 结束时间
 */
const endDate = computed(() => {
  return date ? new Date(date.getTime() + 24 * 60 * 60 * 1000).getTime() : null;
});

/**
 * 倒计时
 */
const countdown = (
  endTime: number,
  callback: (hours: number, minutes: number, seconds: number) => void
) => {
  let animId: number;
  const update = () => {
    const currentTime = Date.now();
    const remainingTime = Math.max(endTime - currentTime, 0);

    const seconds = Math.floor((remainingTime / 1000) % 60);
    const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
    const hours = Math.floor((remainingTime / 1000 / 60 / 60) % 24);
    callback(hours, minutes, seconds);
    // 执行动画
    if (remainingTime > 0) {
      animId = requestAnimationFrame(update);
    } else {
      // 取消动画
      cancelAnimationFrame(animId);
    }
  };
  requestAnimationFrame(update);
};
const text = ref<string>("");
const emit = defineEmits(["delay"]);
watchDebounced(
  () => date,
  (val) => {
    if (val && endDate.value && Date.now() < endDate.value) {
      countdown(endDate.value, (hours, minutes, seconds) => {
        if (+hours + +minutes + +seconds <= 0) {
          text.value = "订单超时，自动取消";
          emit("delay");
          return;
        }
        text.value = `${hours < 10 ? "0" + hours : hours}:${
          minutes < 10 ? "0" + minutes : minutes
        }:${seconds < 10 ? "0" + seconds : seconds}`;
      });
    } else {
      text.value = "";
    }
  },
  {
    immediate: true,
  }
);
</script>
<template>
  <div inline>{{ text }}</div>
</template>
<style scoped lang="scss"></style>
