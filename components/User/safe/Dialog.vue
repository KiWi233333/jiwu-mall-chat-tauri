<script lang="ts" setup>
const props = defineProps<{
  modelValue: {
    showUpdatePwd: boolean
    showUpdateEmail: boolean
    showUpdatePhone: boolean
  }
}>();
function close() {
  props.modelValue.showUpdateEmail = false;
  props.modelValue.showUpdatePhone = false;
  props.modelValue.showUpdatePwd = false;
}
</script>

<template>
  <transition name="popup">
    <div
      v-if="
        modelValue.showUpdatePwd || modelValue.showUpdateEmail || modelValue.showUpdatePhone
      "
      class="fixed left-0 top-0 z-1000 h-100dvh w-full flex-row-c-c overflow-hidden"
    >
      <div
        class="absolute h-full w-full bg-[#b4b4b459] backdrop-blur-5px dark:bg-[#1d1d1d80]"
        @click="close"
      />
      <UserSafePwdForm v-if="modelValue.showUpdatePwd" @close="close()" />
      <UserSafePhoneForm v-if="modelValue.showUpdatePhone" @close="close()" />
      <UserSafeEmailForm v-if="modelValue.showUpdateEmail" @close="close()" />
    </div>
  </transition>
</template>

<style scoped lang="scss"></style>
