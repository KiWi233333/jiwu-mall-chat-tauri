<!-- eslint-disable prefer-promise-reject-errors -->
<script lang="ts" setup>
import type { FormRules } from "element-plus";
import type { FormInstance } from "vant";
import { DeviceType, getRegisterCode, toLoginByPwd, toRegister } from "~/composables/api/user";
import { checkUsernameExists } from "~/composables/api/user/info";
import type { Result } from "~/types/result";
import { RegisterType } from "~/types/user/index.js";

// 注册方式
const registerType = ref<number>(RegisterType.PHONE);
// 请求加载
const isLoading = ref<boolean>(false);
const loadingText = ref<string>("");
const formRef = ref();
// 表单
const formUser = reactive({
  username: "", // 用户名
  phone: "", // 手机号 0
  email: "", // 邮箱 1
  code: "", // 验证码
  password: "", // 密码
});
const rules = reactive<FormRules>({
  username: [
    { required: true, message: "用户名不能为空！", trigger: "blur" },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{0,}$/,
      message: "英文开头、字母数字下划线组成",
      trigger: "change",
    },
    { min: 6, max: 30, message: "长度在6-30个字符！", trigger: "change" },
    {
      asyncValidator: async () => {
        return await checkUsername();
      },
      message: "该用户名已被使用！",
      trigger: "change",
    },
  ],
  password: [
    { required: true, message: "密码不能为空！", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度为6-20字符！", trigger: "change" },
    {
      pattern: /^\w{6,20}$/,
      message: "密码字母数字下划线组成",
      trigger: "change",
    },
  ],
  code: [
    {
      required: true,
      message: "验证码6位组成！",
      trigger: "change",
    },
  ],
  email: [
    { required: true, message: "邮箱不能为空！", trigger: "blur" },
    {
      pattern:
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: "邮箱格式不正确！",
      trigger: ["blur", "change"],
    },
  ],
  phone: [
    { required: true, message: "手机号不能为空！", trigger: "blur" },
    {
      pattern:
        /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$/,
      message: "手机号格式不正确！",
      trigger: "change",
    },
  ],
});

// 验证码有效期
const phoneTimer = ref(-1);
const emailTimer = ref(-1);
const emailCodeStorage = ref<number>(0);
const phoneCodeStorage = ref<number>(0);
/**
 * 获取验证码
 * @param type
 */
async function getRegCode(type: RegisterType) {
  try {
    if (isLoading.value)
      return;
    let data;
    // 获取邮箱验证码
    if (type === RegisterType.EMAIL) {
      // 简单校验
      if (formUser.email.trim() === "")
        return;
      if (!checkEmail(formUser.email))
        return ElMessage.error("邮箱格式不正确！");

      isLoading.value = true;

      // 请求验证码
      data = await getRegisterCode(formUser.email, DeviceType.EMAIL);
      // 成功
      if (data.code === 20000) {
        ElMessage.success({
          message: "验证码已发送至您的邮箱，5分钟有效！",
          duration: 5000,
        });
        useInterval(emailTimer, emailCodeStorage, 60, -1);
      }
    }
    // 获取手机号验证码
    else if (type === RegisterType.PHONE) {
      if (formUser.phone.trim() === "")
        return;
      if (!checkPhone(formUser.phone))
        return ElMessage.error("手机号格式不正确！");

      isLoading.value = true;
      data = await getRegisterCode(formUser.phone, DeviceType.PHONE);
      if (data.code === 20000) {
        // 开启定时器
        formUser.code = data.data;
        useInterval(phoneTimer, phoneCodeStorage, 60, -1);
        ElMessage.success({
          message: data.message,
          duration: 5000,
        });
      }
    }
  }
  catch (err) { }
  finally {
  // 关闭加载
    isLoading.value = false;
  }
}
/**
 *
 * @param timer 本地定时器
 * @param num 计数对象
 * @param target 开始秒数
 * @param step 自增自减
 * @param fn 回调
 */
function useInterval(timer: any,
  num: Ref<number>,
  target?: number,
  step: number = -1,
  fn?: () => void) {
  num.value = target || timer.value;
  timer.value = setInterval(() => {
    num.value += step;
    // 清除定时器
    if (num.value <= 0) {
      num.value = -1;
      timer.value = -1;
      clearInterval(timer.value);
      fn && fn();
    }
  }, 1000);
}
const store = useUserStore();
/**
 * 注册
 * @param formEl 表单实例
 */
async function onRegister(formEl: FormInstance) {
  if (!formEl)
    return;
  // @ts-expect-error
  await formEl.validate((valid) => {
    isLoading.value = true;
    if (valid)
      onRegisterHandle();
    else
      isLoading.value = false;
  });
}
async function onRegisterHandle() {
  let data: Result<string> = { code: 20001, message: "注册失败，请稍后重试！", data: "" };
  switch (registerType.value) {
    case RegisterType.PHONE:
      data = await toRegister({
        username: formUser.username,
        phone: formUser.phone,
        password: formUser.password,
        code: formUser.code,
        type: registerType.value,
      });
      break;
    case RegisterType.EMAIL:
      data = await toRegister({
        username: formUser.username,
        password: formUser.password,
        code: formUser.code,
        email: formUser.email,
        type: registerType.value,
      });
      break;
  }

  if (data.code === StatusCode.SUCCESS) {
    // 注册成功
    if (data.data !== "") {
      ElMessage.success({
        message: "恭喜，注册成功 🎉",
        duration: 3000,
      });
      // 登录
      let count = 3;
      const timers = setInterval(() => {
        isLoading.value = true;
        loadingText.value = `${count}s后自动登录...`;
        if (count <= 0) {
          (async () => {
            const data = await toLoginByPwd(formUser.username, formUser.password);
            // 自动登录成功
            store.$patch({
              token: data.data,
              showLoginForm: false,
              showRegisterForm: false,
              isLogin: true,
            });
            ElMessage.success({
              message: "登录成功！",
            });
            store.onUserLogin(data.data);
            isLoading.value = false;
            // 清除
            clearInterval(timers);
          })();
        }
        count--;
      }, 1000);
    }
  }
  else {
    ElMessage.error({
      message: data.message || "抱歉，注册出了点问题！",
      duration: 4000,
    });
    // store
    store.$patch({
      token: "",
      isLogin: false,
    });
  }
}

/**
 * 验证是否存在该用户
 */
async function checkUsername() {
  if (formUser.username.trim() === "")
    return Promise.reject();
  const data = await checkUsernameExists(formUser.username);
  if (data.code === 20000)
    return Promise.resolve();

  return Promise.reject("该用户名已被使用！");
}

function toLoginForm() {
  store.$patch({
    showRegisterForm: false,
    showLoginForm: true,
  });
}
</script>

<template>
  <!-- 注册 -->
  <el-form
    ref="formRef" v-loading="isLoading" label-position="top"
    hide-required-asterisk :rules="rules" :model="formUser" class="form relative"
  >
    <small v-if="isLoading" class="absolute-center-center">{{ loadingText }}</small>
    <h2 mb-5 mt-4 tracking-0.2em>
      开启你的专属圈子✨
    </h2>
    <p mb-10 text-0.8em tracking-0.1em>
      已有账户？
      <span cursor-pointer color-emerald transition-300 hover:font-700 @click="toLoginForm">
        立即登录
      </span>
    </p>
    <!-- 切换注册 -->
    <div class="toggle-login" my-1em>
      <el-button
        flex-1 :class="{ active: registerType === RegisterType.PHONE }" tracking-0.1em
        @click="registerType = RegisterType.PHONE"
      >
        手机注册
      </el-button>
      <el-button
        flex-1 :class="{ active: registerType === RegisterType.EMAIL }" tracking-0.1em
        @click="registerType = RegisterType.EMAIL"
      >
        邮箱注册
      </el-button>
    </div>
    <!-- 验证码注册(客户端 ) -->
    <!-- 用户名 -->
    <el-form-item label="" prop="username" class="animated">
      <el-input v-model.lazy="formUser.username" prefix-icon="user" size="large" placeholder="请输入用户名" />
    </el-form-item>
    <!-- 邮箱 -->
    <el-form-item v-if="registerType === RegisterType.EMAIL" prop="email" class="animated">
      <el-input v-model.trim="formUser.email" type="email" prefix-icon="Message" size="large" placeholder="请输入邮箱">
        <template #append>
          <el-button type="primary" :disabled="emailCodeStorage > 0" @click="getRegCode(registerType)">
            {{ emailCodeStorage > 0 ? `${emailCodeStorage}s后重新发送` : "获取验证码" }}
          </el-button>
        </template>
      </el-input>
    </el-form-item>
    <!-- 手机号 -->
    <el-form-item v-if="registerType === RegisterType.PHONE" type="tel" prop="phone" class="animated">
      <el-input v-model.trim="formUser.phone" prefix-icon="Iphone" size="large" placeholder="请输入手机号">
        <template #append>
          <el-button type="primary" :disabled="phoneCodeStorage > 0" @click="getRegCode(registerType)">
            {{ phoneCodeStorage > 0 ? `${phoneCodeStorage}s后重新发送` : "获取验证码" }}
          </el-button>
        </template>
      </el-input>
    </el-form-item>
    <!-- 验证码 -->
    <el-form-item prop="code" class="animated">
      <el-input v-model.trim="formUser.code" prefix-icon="ChatDotSquare" size="large" placeholder="请输入验证码" />
    </el-form-item>
    <!-- 密 码 -->
    <el-form-item
      type="password" show-password label="" prop="password" class="animated"
    >
      <el-input
        v-model.trim="formUser.password" prefix-icon="Lock" size="large" placeholder="请输入密码（6-20位）" show-password
        type="password"
      />
    </el-form-item>
    <el-form-item mt-1em>
      <BtnElButton type="info" class="submit w-full tracking-0.2em" style="padding: 20px" @click="onRegister(formRef)">
        立即注册
      </BtnElButton>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.form {
  display: block;
  padding: 2em 3em;
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

// label总体
:deep(.el-form-item) {
  margin-bottom: 14px;
}

// 切换注册
.toggle-login {
  position: relative;
  border-radius: var(--el-border-radius-base);
  backdrop-filter: blur(10px);
  background-color: #dddddd2a;
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
    box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 4px;
    background-color: transparent;
    color: var(--el-text-color);
  }
}

.dark .active {
  background-color: var(--el-color-primary);
}

.submit {
  font-size: 1.2em;
  font-weight: 800;
  transition: 0.3s;
  cursor: pointer;

  :deep(.el-input__wrapper) {
    background-color: var(--el-color-primary);
    cursor: pointer;

    * {
      color: #fff;
      font-weight: 800;
      letter-spacing: 0.4em;
    }
  }

  .dark:deep(.el-input__wrapper) {
    background-color: var(--el-color-primary);
    cursor: pointer;
    color: #fff;
  }
}
</style>
