<script lang="ts" setup>
const props = defineProps<{
	modelValue: {
		showUpdatePwd: boolean;
		showUpdateEmail: boolean;
		showUpdatePhone: boolean;
	};
}>();
const close = () => {
	props.modelValue.showUpdateEmail = false;
	props.modelValue.showUpdatePhone = false;
	props.modelValue.showUpdatePwd = false;
};
</script>
<template>
	<transition name="popup">
		<div
			v-if="
				modelValue.showUpdatePwd || modelValue.showUpdateEmail || modelValue.showUpdatePhone
			"
			class="flex-row-c-c overflow-hidden fixed top-0 left-0 z-1000 w-full h-100vh"
		>
			<div
				class="w-full h-full absolute bg-[#b4b4b459] dark:bg-[#1d1d1d80] backdrop-blur-5px"
				@click="close"
			></div>
			<UserSafePwdForm v-if="modelValue.showUpdatePwd" @close="close()" />
			<UserSafePhoneForm v-if="modelValue.showUpdatePhone" @close="close()" />
			<UserSafeEmailForm v-if="modelValue.showUpdateEmail" @close="close()" />
		</div>
	</transition>
</template>
<style scoped lang="scss"></style>
