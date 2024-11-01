<script lang="ts" setup>
import type { FormInstance } from "element-plus/es/components/form";

const emits = defineEmits(["close"]);
const [formAnimateRef, enter] = useAutoAnimate({
  duration: 200,
});

const setting = useSettingStore();
onMounted(() => {
  enter(!setting.settingPage.isCloseAllTransition);
});
enum CheckTypeEnum {
  PHONE = DeviceType.PHONE,
  EMAIL = DeviceType.EMAIL,
  OLD_PASSWORD = 2,
}

const user = useUserStore();
const isLoading = ref<boolean>(false);
const codeStorage = ref<number>(0);
const chooseType = ref<CheckTypeEnum | undefined>(user.userInfo.isEmailVerified ? CheckTypeEnum.EMAIL : user.userInfo.isPhoneVerified ? CheckTypeEnum.PHONE : undefined);
const checkTypeValue = computed(() => chooseType.value === CheckTypeEnum.PHONE ? user.userInfo.phone : user.userInfo.email);

// 表单
const userForm = reactive({
  code: "", // 旧密码
  password: "",
  newPassword: "", // 密码
});
const isSecondCheck = computed(() => chooseType.value === CheckTypeEnum.EMAIL || chooseType.value === CheckTypeEnum.PHONE);
const rules = reactive(isSecondCheck.value
  ? {
      code: [
        { required: true, message: "请输入验证码", trigger: "blur" },
        { min: 6, max: 6, message: "验证码长度错误", trigger: "blur" },
      ],
      newPassword: [
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
    }
  : {
      password: [
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
      newPassword: [
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
 */
async function onUpdatePwd(formEl: FormInstance | undefined) {
  if (!formEl || isLoading.value)
    return;
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
  if (chooseType.value === undefined)
    return;
  let res;
  if (chooseType.value === CheckTypeEnum.OLD_PASSWORD) {
    res = await updatePwdByToken(
      { oldPassword: userForm.password, newPassword: userForm.newPassword },
      user.getToken,
    );
  }
  else {
    res = await updatePwdByCode(
      chooseType.value as any,
      { code: userForm.code, newPassword: userForm.newPassword },
      user.getToken,
    );
  }
  if (res && res.code === StatusCode.SUCCESS) {
    // 修改成功
    ElMessage.success({
      message: "修改成功，下次登录请用新密码！",
      duration: 2000,
    });
    emits("close");
  }
  return true;
}

// 二步验证
async function getCheckCodeReq(type?: CheckTypeEnum) {
  if (type === undefined)
    return;

  const key = type === CheckTypeEnum.EMAIL ? user.userInfo.email : user.userInfo.phone;
  if (codeStorage.value > 0)
    return;

  if (key && (type === CheckTypeEnum.PHONE || type === CheckTypeEnum.EMAIL)) {
    const res = await getCheckCode(key, type as any, user.getToken);
    if (res.code === StatusCode.SUCCESS) {
      ElMessage({
        message: "发送成功，请查收！",
        type: "success",
        duration: 2000,
      });
      codeStorage.value = 60;
      const timer = setInterval(() => {
        codeStorage.value--;
        if (codeStorage.value === 0)
          clearInterval(timer);
      }, 1000);
    }
  }
}
</script>

<template>
  <el-form
    ref="userFormRefs"
    :disabled="isLoading"
    label-position="top"
    hide-required-asterisk
    :rules="rules"
    :model="userForm"
    class="form"
  >
    <h3 mb-4 mt-2 text-center tracking-0.2em>
      密码修改
    </h3>
    <transition-group :name="setting.settingPage.isCloseAllTransition ? '' : 'group-list'" mode="ease-in-out" class="relative">
      <!-- 二步验证 -->
      <el-form-item v-if="isSecondCheck" type="password" :label="`${chooseType === CheckTypeEnum.PHONE ? '手机号' : '邮箱'}`" prop="password" class="animated">
        <el-input
          v-model:model-value="checkTypeValue"
          disabled
          prefix-icon="User"
          size="large"
          :placeholder="`请输入${chooseType === CheckTypeEnum.PHONE ? '手机号' : '邮箱'}`"
          required
          :type="chooseType === CheckTypeEnum.PHONE ? 'phone' : 'email'"
          @keyup.enter="onUpdatePwd(userFormRefs)"
        >
          <template #append>
            <el-button type="primary" :disabled="codeStorage > 0" @click="getCheckCodeReq(chooseType)">
              {{ codeStorage > 0 ? `${codeStorage}s后重新发送` : "获取验证码" }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item
        v-if="isSecondCheck"
        type="text" label="验证码" prop="code" class="animated"
      >
        <el-input
          v-model.trim="userForm.code"
          prefix-icon="Unlock"
          :maxlength="6"
          :minlength="6"
          size="large"
          placeholder="请输入验证码"
          required
          type="text"
          @keyup.enter="onUpdatePwd(userFormRefs)"
        />
      </el-form-item>
      <!-- 新旧密码 -->
      <el-form-item v-else type="password" label="旧密码" prop="password" class="animated">
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
      <el-radio-group v-model="chooseType" size="small" class="check-type-list w-full pt-2">
        <el-radio v-if="user.userInfo.isPhoneVerified" :value="CheckTypeEnum.PHONE">
          手机号
        </el-radio>
        <el-radio v-if="user.userInfo.isEmailVerified" :value="CheckTypeEnum.EMAIL">
          邮箱
        </el-radio>
        <el-radio v-if="user.userInfo.isPasswordVerified" :value="CheckTypeEnum.OLD_PASSWORD">
          原密码
        </el-radio>
      </el-radio-group>
      <el-form-item mt-1em>
        <el-button
          type="danger"
          class="submit mb-4 w-full"
          style="padding: 1em 0"
          @keyup.enter="onUpdatePwd(userFormRefs)"
          @click="onUpdatePwd(userFormRefs)"
        >
          修 改
        </el-button>
      </el-form-item>
    </transition-group>
  </el-form>
</template>

<style scoped lang="scss">
.form {
	width: 360px;
	display: block;
	padding: 1em 0;
	background-color: #ffffff98;
	border-radius: var(--el-border-radius-base);
	backdrop-filter: blur(5px);
	border: 1px solid rgba(109, 109, 109, 0.2);
	box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 4px;
	overflow: hidden;
	animation-delay: 0.1s;

	:deep(.el-input__wrapper) {
		padding: 0 1em;
	}
   :deep(.check-type-list.el-radio-group) {
    display: flex;
    justify-content: right;
    margin-left: auto;
    .el-radio {
      height: fit-content;
      border-right: 1px solid #ffffff98;
      padding-right: 1em;
      &:nth-last-child(1) {
        border: none;
        padding-right: 2.4em;
    }
      margin-right: 0;
        .el-radio__input {
          display: none;
        }
      }
    }

	:deep(.el-form-item) {
		padding: 0.2em 2em;
    width: 100%;
    box-sizing: border-box;
    // 报错信息
		.el-form-item__error {
      position: static;
      padding-top: 0.2em;
		}
	}
}

:deep(.el-button) {
	padding: 0 1em;
}

.dark .form {
	background-color: #161616d8;
}

.animate__animated {
	animation-duration: 0.5s;
}

// label总体
:deep(.el-form-item) {
	margin-bottom: 0;
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
			font-weight: 600;
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
