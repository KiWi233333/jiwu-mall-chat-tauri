<script lang="ts" setup>
import type { FormInstance } from "vant";

const emits = defineEmits(["close"]);

const user = useUserStore();
const isLoading = ref<boolean>(false);

// 表单
const userForm = reactive({
  password: "", // 旧密码
  newPassword: "", // 密码
});
const rules = reactive({
  password: [
    { required: true, message: "旧密码不能为空！", trigger: "blur" },
    { min: 6, max: 20, message: "旧密码长度6-20字符！", trigger: "blur" },
    {
      pattern: /^\w{6,20}$/,
      message: "密码由字母数字下划线组成",
      trigger: "change",
    },
  ],
  newPassword: [
    { required: true, message: "新密码不能为空！", trigger: "blur" },
    { required: true, message: "新密码不能为空！", trigger: "blur" },
    {
      pattern: /^\w{6,20}$/,
      message: "密码字母数字下划线组成",
      trigger: "change",
    },
    { min: 6, max: 20, message: "新密码长度6-20字符！", trigger: "blur" },
    {
      validator: () => userForm.password !== userForm.newPassword,
      message: "新旧密码相同！",
      trigger: "change",
    },
    {
      validator: () => userForm.password !== userForm.newPassword,
      message: "新旧密码相同！",
      trigger: "blur",
    },
  ],
});
const userFormRefs = ref();

/**
 * 修改密码
 * @param type
 */
async function onUpdatePwd(formEl: FormInstance | undefined) {
  if (!formEl || isLoading.value)
    return;
  // @ts-expect-error
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true;
      try {
        const action = await ElMessageBox.confirm("是否确认修改密码?", "修改密码", {
          confirmButtonText: "确认修改",
          cancelButtonText: "取消",
          lockScroll: false,
        });
        if (action === "confirm")
          await toUpdate();
      }
      finally {
        setTimeout(() => {
          isLoading.value = false;
        }, 300);
      }
    }
  });
}

async function toUpdate() {
  const res = await updatePwdByToken(
    { oldPassword: userForm.password, newPassword: userForm.newPassword },
    user.getToken,
  );
  if (res.code === StatusCode.SUCCESS) {
    // 修改成功
    ElMessage.success({
      message: "修改成功，下次登录请用新密码！",
      duration: 2000,
    });
    emits("close");
  }
  return true;
}
</script>

<template>
  <el-form
    ref="userFormRefs"
    v-loading="isLoading"
    label-position="top"
    hide-required-asterisk
    :rules="rules"
    :model="userForm"
    class="form"
  >
    <h2 mb-5 mt-4 text-center tracking-0.2em>
      密码修改
    </h2>
    <el-form-item type="password" label="旧密码" prop="password" class="animated">
      <el-input
        v-model.trim="userForm.password"
        prefix-icon="Unlock"
        size="large"
        placeholder="请输入旧密码"
        required
        show-password
        type="password"
        @keyup.enter="onUpdatePwd(userFormRefs)"
      />
    </el-form-item>
    <el-form-item
      type="password" label="新密码" prop="newPassword" class="animated"
    >
      <el-input
        v-model.trim="userForm.newPassword"
        prefix-icon="Unlock"
        size="large"
        placeholder="请输入新密码"
        required
        show-password
        type="password"
        @keyup.enter="onUpdatePwd(userFormRefs)"
      />
    </el-form-item>
    <el-form-item mt-1em>
      <el-button
        type="danger"
        class="submit w-full"
        style="padding: 20px"
        @keyup.enter="onUpdatePwd(userFormRefs)"
        @click="onUpdatePwd(userFormRefs)"
      >
        修 改
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.form {
	width: 360px;
	display: block;
	padding: 1em 2em;
	background-color: #ffffff98;
	border-radius: var(--el-border-radius-base);
	backdrop-filter: blur(5px);
	border: 1px solid rgba(109, 109, 109, 0.2);
	box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 4px;
	overflow: hidden;
	animation-delay: 0.1s;

	:deep(.el-input__wrapper) {
		padding: 0.3em 1em;
	}

	// 报错信息
	:deep(.el-form-item) {
		padding: 0.2em;

		.el-form-item__error {
			padding-top: 0.2em;
		}
	}
}

:deep(.el-button) {
	padding: 0.3em 1em;
}

.dark .form {
	background-color: #161616d8;
}

.animate__animated {
	animation-duration: 0.5s;
}

// label总体
:deep(.el-form-item) {
	margin-bottom: 14px;
}

// 切换登录
.toggle-login {
	position: relative;
	border-radius: var(--el-border-radius-base);
	backdrop-filter: blur(10px);
	background-color: #b3b3b32a;
	padding: 0.3em;
	display: flex;

	:deep(.el-button) {
		background-color: transparent;
		transition: 0.3s;
		padding: 0em 0.6em;
		border: none;
	}

	.active {
		transition: 0.3s;
		background-color: #ffffff;
		z-index: 1;
		box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 4px;
		color: var(--el-text-color);
	}
}

.dark .active {
	background-color: var(--el-color-primary);
}

.submit {
	font-size: 1.2em;
	transition: 0.3s;
	cursor: pointer;

	:deep(.el-input__wrapper) {
		background-color: var(--el-color-danger);
		cursor: pointer;

		* {
			color: #fff;
			font-weight: 700;
			letter-spacing: 0.3em;
		}
	}
}

.dark .submit :deep(.el-input__wrapper) {
	background-color: var(--el-color-danger);
	cursor: pointer;
	color: #fff;
}
</style>
