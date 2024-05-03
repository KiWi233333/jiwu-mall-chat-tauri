<script lang="ts" setup>
const { width } = defineProps({
  width: {
    required: false,
    default: 350,
    type: Number,
  },
});
</script>

<template>
  <swiper
    class="overflow-hidden"
    effect="cards"
    :cards-effect="{
      slideShadows: false,
      perSlideRotate: 0,
    }"
    :width="width"
    :slides-per-view="1"
    :autoplay="{
      delay: 5000,
    }"
    :grab-cursor="true"
    :mousewheel="true"
    :loop="true"
    :modules="[SwiperEffectCards, SwiperParallax, SwiperMousewheel]"
  >
    <slot>
      <swiper-slide>
        <UserWalCard class="wall-card" />
      </swiper-slide>
      <swiper-slide>
        <UserWalWxCard class="wall-card" />
      </swiper-slide>
      <swiper-slide>
        <UserWalAliCard class="wall-card" />
      </swiper-slide>
    </slot>
  </swiper>
</template>

<style lang="scss" scoped>
.wall-card {
  --at-apply: "h-180px w-9/10 transition-300 hover:translate-x-2"
}
</style>
