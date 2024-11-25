<script lang="ts" setup>
import {
  DeviceType,
  getLoginCodeByType,
  toLoginByEmail,
  toLoginByPhone,
  toLoginByPwd,
} from "~/composables/api/user";
import { LoginType } from "~/types/user/index.js";

const user = useUserStore();
const loginType = useLocalStorage<LoginType>("loginType", LoginType.EMAIL);
const isLoading = ref<boolean>(false);
const autoLogin = ref<boolean>(true);
// 表单
const userForm = useLocalStorage("userForm", {
  username: "",
  password: "",
  code: "", // 验证码
  email: "", // 邮箱登录
  phone: "", // 手机登录
});
onMounted(() => {
  userForm.value.code = "";
});
const rules = reactive({
  username: [
    { required: true, message: "该项不能为空！", trigger: "blur" },
    { min: 6, max: 30, message: "长度在6-30个字符！", trigger: "blur" },
  ],
  password: [
    { required: true, message: "密码不能为空！", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度6-20位！", trigger: "blur" },
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
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/i,
      message: "邮箱格式不正确！",
      trigger: "blur",
    },
  ],
  phone: [
    { required: true, message: "手机号不能为空！", trigger: "blur" },
    {
      pattern:
        /^(?:(?:\+|00)86)?1(?:3\d|4[5-79]|5[0-35-9]|6[5-7]|7[0-8]|8\d|9[1589])\d{8}$/,
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
async function getLoginCode(type: LoginType) {
  let data;
  try {
    // 获取邮箱验证码
    if (type === LoginType.EMAIL) {
    // 简单校验
      if (userForm.value.email.trim() === "")
        return;
      if (!checkEmail(userForm.value.email)) {
        isLoading.value = false;
        return ElMessage.error("邮箱格式不正确！");
      }
      // 开启
      isLoading.value = true;
      // 请求验证码
      data = await getLoginCodeByType(userForm.value.email, DeviceType.EMAIL);
      // 成功
      if (data.code === StatusCode.SUCCESS) {
        ElMessage.success({
          message: "验证码已发送至您的邮箱，5分钟有效！",
          duration: 3000,
        });
        useInterval(emailTimer, emailCodeStorage, 60, -1);
      }
    }
    // 获取手机号验证码
    else if (type === LoginType.PHONE) {
      if (userForm.value.phone.trim() === "")
        return;
      if (!checkPhone(userForm.value.phone)) {
        isLoading.value = false;
        ElMessage.closeAll("error");
        return ElMessage.error("手机号格式不正确！");
      }
      isLoading.value = true;
      data = await getLoginCodeByType(userForm.value.phone, DeviceType.PHONE);
      if (data.code === 20000) {
      // 开启定时器
        useInterval(phoneTimer, phoneCodeStorage, 60, -1);
        ElMessage.success({
          message: data.message,
          duration: 5000,
        });
      // userForm.value.code = data.data;
      }
      else {
        ElMessage.closeAll("error");
        ElMessage.error(data.message);
      }
    }
  }
  catch (error) {
    isLoading.value = false;
  }
  // 关闭加载
  isLoading.value = false;
}
/**
 * 定时器
 * @param timer 本地定时器
 * @param num 计数对象
 * @param target 开始秒数
 * @param step 自增自减
 * @param fn 回调
 */
function useInterval(timer: any, num: Ref<number>, target?: number, step = -1, fn?: () => void) {
  num.value = target || timer.value;
  timer.value = setInterval(() => {
    num.value += step;
    // 清除定时器
    if (num.value <= 0) {
      num.value = -1;
      clearInterval(timer.value);
      timer.value = -1;
    }
    fn && fn();
  }, 1000);
}

// 关闭定时器
onUnmounted(() => {
  onCloseTimer();
});
onDeactivated(() => {
  onCloseTimer();
});
// 关闭定时器
function onCloseTimer() {
  if (emailTimer.value !== -1) {
    clearInterval(emailTimer.value);
    emailTimer.value = -1;
  }
  if (phoneTimer.value !== -1) {
    clearInterval(phoneTimer.value);
    phoneTimer.value = -1;
  }
}


const store = useUserStore();
function toRegister() {
  store.showLoginForm = false;
  store.showRegisterForm = true;
}

const formRef = ref();
function done() {
  isLoading.value = false;
  user.isOnLogining = false;
}
/**
 * 登录
 * @param formEl 表单示例
 */
async function onLogin(formEl: any | undefined) {
  if (!formEl || isLoading.value)
    return;
  formEl.validate(async (valid: boolean) => {
    if (!valid)
      return;
    isLoading.value = true;
    user.isOnLogining = true;
    let res = { code: 20001, data: "", message: "登录失败！" };
    try {
      switch (loginType.value) {
        case LoginType.PWD:
          res = await toLoginByPwd(userForm.value.username, userForm.value.password);
          break;
        case LoginType.PHONE:
          res = await toLoginByPhone(userForm.value.phone, userForm.value.code);
          break;
        case LoginType.EMAIL:
          res = await toLoginByEmail(userForm.value.email, userForm.value.code);
          break;
        case LoginType.ADMIN:
          res = await toLoginByPwd(userForm.value.username, userForm.value.password, true);
          break;
      }
    }
    catch (error) {
      done();
    }
    if (res.code === 20000) {
      // 登录成功
      if (res.data) {
        await store.onUserLogin(res.data, autoLogin.value);
        setTimeout(async () => {
          done();
          await navigateTo("/", { replace: true });
        }, 500);
      }
      // 登录失败
      else {
        ElMessage.error({
          message: res.message,
          duration: 3000,
        });
        // store
        store.$patch({
          token: "",
          isLogin: false,
        });
        done();
      }
    }
    else {
      done();
    }
  });
}

const options = [
  { label: "手机登录", value: LoginType.PHONE },
  { label: "邮箱登录", value: LoginType.EMAIL },
  { label: "密码登录", value: LoginType.PWD },
];
</script>

<template>
  <!-- 登录 -->
  <el-form
    ref="formRef"
    :disabled="isLoading"
    label-position="top"
    hide-required-asterisk
    :rules="rules"
    :model="userForm"
    style="border: none;"
    class="form"
  >
    <template v-if="!user.isLogin">
      <h4 mb-4 tracking-0.2em op-80>
        聊你所想，聊天随心✨
      </h4>
      <p
        mb-4 text-0.8em tracking-0.1em op-70
      >
        还没有账户？
        <span
          cursor-pointer color-emerald transition-300 hover:font-700
          @click="toRegister"
        >
          立即注册
        </span>
        <span
          flex-1
          class="transition-all btn-info"
          @click="loginType = loginType === LoginType.ADMIN ? LoginType.PHONE : LoginType.ADMIN"
        >
          {{ loginType !== LoginType.ADMIN ? "管理员" : "用户" }}
        </span>
      </p>
      <!-- 切换登录 -->
      <el-segmented
        v-show="loginType !== LoginType.ADMIN"
        v-model="loginType"
        class="toggle-login grid grid-cols-3 mb-4 w-full gap-2 card-default dark:bg-dark-300" :options="options"
      />
      <!-- 验证码登录(客户端 ) -->
      <!-- 邮箱登录 -->
      <el-form-item
        v-if="loginType === LoginType.EMAIL"
        prop="email"
        class="animated"
      >
        <el-input
          v-model.trim="userForm.email"
          type="email"
          autocomplete="off"
          prefix-icon="Message"
          size="large"
          placeholder="请输入邮箱"
          @keyup.enter="getLoginCode(loginType)"
        >
          <template #append>
            <el-button
              type="primary"
              :disabled="emailCodeStorage > 0 || isLoading"
              @click="getLoginCode(loginType)"
            >
              {{ emailCodeStorage > 0 ? `${emailCodeStorage}s后重新发送` : "获取验证码" }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <!-- 手机号登录 -->
      <el-form-item
        v-if="loginType === LoginType.PHONE"
        type="tel"
        prop="phone"
        class="animated"
      >
        <el-input
          v-model.trim="userForm.phone"
          prefix-icon="Iphone"
          size="large"
          type="tel"
          placeholder="请输入手机号"
          @keyup.enter="getLoginCode(loginType)"
        >
          <template #append>
            <el-button
              type="primary"
              :disabled="phoneCodeStorage > 0 || isLoading"
              @click="getLoginCode(loginType)"
            >
              {{ phoneCodeStorage > 0 ? `${phoneCodeStorage}s后重新发送` : "获取验证码" }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item
        v-if="loginType === LoginType.EMAIL || loginType === LoginType.PHONE"
        prop="code"
        class="animated"
      >
        <el-input
          v-model.trim="userForm.code"
          prefix-icon="ChatDotSquare"
          autocomplete="off"
          size="large"
          placeholder="请输入验证码"
          @keyup.enter="onLogin(formRef)"
        />
      </el-form-item>
      <!-- 密码登录 -->
      <el-form-item
        v-if="loginType === LoginType.PWD || loginType === LoginType.ADMIN "
        label=""
        prop="username"
        class="animated"
      >
        <el-input
          v-model.trim="userForm.username"
          autocomplete="off"
          prefix-icon="user"
          size="large"
          placeholder="请输入用户名、手机号或邮箱"
          @keyup.enter="onLogin(formRef)"
        />
      </el-form-item>
      <el-form-item
        v-if="loginType === LoginType.PWD || loginType === LoginType.ADMIN"
        type="password"
        show-password
        label=""
        prop="password"
        class="animated"
      >
        <el-input
          v-model.trim="userForm.password"
          prefix-icon="Lock"
          autocomplete="off"
          size="large"
          placeholder="请输入密码"
          show-password
          type="password"
          @keyup.enter="onLogin(formRef)"
        />
      </el-form-item>
      <el-form-item mt-5>
        <el-button
          type="primary"
          class="submit w-full tracking-0.2em shadow"
          style="padding: 20px"
          :loading="user.isOnLogining"
          @keyup.enter="onLogin(formRef)"
          @click="onLogin(formRef)"
        >
          登录
        </el-button>
      </el-form-item>
    </template>
    <template v-else>
      <div class="mt-16 flex-row-c-c flex-col gap-8">
        <CardElImage :src="BaseUrlImg + user.userInfo.avatar" class="h-8rem w-8rem border-default card-default" />
        <div text-center>
          <span>
            {{ user.userInfo.username || "未登录" }}
          </span>
          <br>
          <small op-80 el-color-info>（{{ user.userInfo.username ? "已登录" : "请登录" }}）</small>
        </div>
        <div>
          <BtnElButton
            type="primary"
            transition-icon
            :loading="user.isOnLogining"
            icon-class="i-solar-alt-arrow-left-bold"
            @click="navigateTo('/')"
          >
            {{ user.isOnLogining ? "登录中..." : "前往" }}
          </BtnElButton>
          <BtnElButton
            type="danger"
            transition-icon plain
            icon-class="i-solar:logout-3-broken"
            @click="user.exitLogin"
          >
            注销
          </BtnElButton>
        </div>
      </div>
    </template>
  </el-form>
</template>

<style scoped lang="scss">
.form {
  display: block;
  overflow: hidden;
  animation-delay: 0.1s;

  :deep(.el-input__wrapper) {
    padding: 0.3em 1em;
  }

  // 报错信息
  :deep(.el-form-item) {
    padding: 0.3em 0.1em;


    .el-form-item__error {
      padding-top: 0;
    }
  }
}

:deep(.el-button) {
  padding: 0.3em 1em;
}

.animate__animated {
  animation-duration: 0.5s;
}

// label总体
:deep(.el-form-item) {
  margin-bottom: 1.25rem;
}

// 切换登录
:deep(.toggle-login.el-segmented) {
  --el-segmented-item-selected-color: var(--el-text-color-primary);
  // --el-segmented-item-selected-bg-color: #ffd100;
  --el-border-radius-base: 6px;
  height: 2.6rem;
  padding: 0.4rem;
  .el-segmented__item:hover:not(.is-selected) {
    background: transparent;
  }
  .el-segmented__item.is-selected {
    color: #fff;
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
