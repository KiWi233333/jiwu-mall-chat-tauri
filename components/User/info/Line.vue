<script lang="ts" setup>
import type { UploadProps } from "element-plus";
import { type UpdateInfo, updateInfoByDTO } from "@/composables/api/user/info";
import { compareObjects } from "@/composables/utils";

const { data } = defineProps<{
  data: Partial<UserInfoVO>
  isEdit?: boolean
}>();

const user = reactive<Partial<UserInfoVO>>(data);
const store = useUserStore();
const formData = new FormData();
// 表单
const avatatRef = ref();
const avatarUrl = computed({
  get() {
    return user?.avatar;
  },
  set(val) {
    user.avatar = val;
  },
});
const isLoading = ref<boolean>(false);
/**
 * 上传之前验证类型
 */
const imageTypeList = ref<string[]>(["image/png", "image/jpg", "image/jpeg", "image/svg"]);
const beforeUpload: UploadProps["beforeUpload"] = (rawFile) => {
  isLoading.value = true;
  if (!imageTypeList.value.includes(rawFile.type)) {
    isLoading.value = false;
    ElMessage.error("文件格式不是图片格式!");
    return false;
  }
  else if (rawFile.size / 1024 / 1024 > 2) {
    isLoading.value = false;
    ElMessage.error("头像需要小于2MB!");
    return false;
  }
  // check success
  formData.append("file", rawFile);
  return true;
};
/**
 * 更新头像
 */
const updateSucess: UploadProps["onSuccess"] = async (data, file) => {
  isLoading.value = false; // check success
  avatatRef.value?.clearFiles();
  if (data.code === StatusCode.SUCCESS) {
    user.avatar = data.data;
    avatarUrl.value = data.data || "";
    ElMessage.success("更换头像成功！");
  }
  else {
    ElMessage.error(data.message);
  }
};

const genderList = ref<string[]>(["男", "女", "保密"]);
// 用户基本信息
const userCopy = reactive<UpdateInfo>({
  nickname: user?.nickname,
  slogan: user?.slogan,
  gender: user?.gender,
  birthday: user?.birthday,
});

// 是否开启slogan编辑
const isEditSlogan = ref<boolean>(false);
const isEditNickname = ref<boolean>(false);

/**
 * 更新用户基本信息
 * @param key dto key
 */
async function submitUpdateUser(key: string) {
  // 判空
  if (Object.keys(userCopy).includes(key)) {
    if (!JSON.parse(JSON.stringify(userCopy))[key])
      return ElMessage.error("内容不能为空！");
    if (isLoading.value)
      return;

    // 网络请求
    const { code, message } = await updateInfoByDTO(
      compareObjects({
        nickname: user?.nickname,
        slogan: user?.slogan,
        gender: user?.gender,
        birthday: user?.birthday,
      }, { ...userCopy }),
      store.getToken,
    );
    if (code === StatusCode.SUCCESS) {
      ElMessage.success("修改成功！");
      store.$patch({
        userInfo: {
          ...userCopy,
        },
      });
    }
    else {
      ElMessage.error(message || "修改失败，请稍后重试！");
    }
    // 关闭
    isEditNickname.value = false;
    isEditSlogan.value = false;
  }
}

/**
 * 邀请方法
 */
function showInvitation() {
  useAsyncCopyText(`${document.URL}?id=${user?.id}`)
    .then(() => {
      ElMessage.success("链接已复制到剪切板！");
    })
    .catch(() => {
      ElMessage.error("链接分享失败！");
    });
}

function onBlur() {
  setTimeout(() => {
    isEditNickname.value = false;
  }, 300);
}

onMounted(() => {
  nextTick(() => {
    userCopy.slogan = user?.slogan;
    userCopy.birthday = user?.birthday;
    userCopy.gender = user?.gender;
  });
});
</script>

<template>
  <div>
    <div
      v-loading="isLoading"
      class="avatar shadow-md"
    >
      <!-- 上传 -->
      <el-upload
        ref="avatatRef"
        :disabled="isEdit"
        class="avatar-uploader"
        drag
        :action="`${BaseUrl}/user/info/avatar`"
        :headers="{ Authorization: store.token }"
        method="PUT"
        :limit="1"
        :multiple="false"
        auto-upload
        :show-file-list="false"
        list-type="picture"
        :before-upload="beforeUpload"
        :on-success="updateSucess"
      >
        <div class="group relative flex-row-c-c">
          <img
            v-if="avatarUrl"
            alt="Design By Kiwi23333"
            :src="BaseUrlImg + avatarUrl"
            class="avatar-mark h-6em w-6em overflow-hidden object-cover p-0 transition-300 group-hover:filter-blur-4"
          >
          <ElIconPlus
            v-else
            size="2em"
          />
          <i
            class="i-solar:camera-broken absolute p-5 opacity-0 transition-300 group-hover:opacity-60"
          />
        </div>
      </el-upload>
    </div>
    <div class="text inline-flex flex-col items-start px-2">
      <div v-auto-animate tag="div" class="my-2">
        <!-- 原 -->
        <h2
          v-show="!isEditNickname"
          key="nickname1"
          class="group"
        >
          <span @click="isEditNickname = true">{{ user?.nickname }}</span>
          <span
            v-if="isEdit"
            class="i-solar:ruler-cross-pen-bold-duotone ml-2 cursor-pointer bg-bluegray p-3 group-hover:bg-[var(--el-color-success)]"
            @click="isEditNickname = true"
          />
          <el-button
            type="info"
            class="ml-4em opacity-0 border-default group-hover:opacity-100"
            @click="showInvitation"
          >
            分 享
          </el-button>
        </h2>
        <!-- 昵称 -->
        <div
          v-show="isEditNickname"
          v-if="isEdit"
          key="nickname-input"
          class="flex-row-c-c"
        >
          <el-input
            v-model.lazy="userCopy.nickname"
            class="mr-2"
            style="font-size: 0.9em; font-weight: 700"
            placeholder="修改用户昵称"
            @focus="isEditNickname = true"
            @blur="onBlur()"
            @keyup.enter="submitUpdateUser('nickname')"
          />
          <el-button
            style="padding: 0 1.5em"
            type="primary"
            @click="submitUpdateUser('nickname')"
          >
            修改
          </el-button>
        </div>
      </div>

      <!-- id -->
      <small class="group small-input cursor-pointer opacity-60">
        ID：{{ user?.id }}
        <el-tooltip
          v-if="user?.id"
          content="复制 ID"
          placement="bottom"
          popper-class="el-popper-init"
        >
          <span
            v-copying.toast="user?.id"
            class="i-solar:copy-broken mx-2 cursor-pointer bg-blueGray p-2 transition-300 hover:bg-[var(--el-color-success)]"
          />
        </el-tooltip>
      </small>
      <div mt-4 flex flex-row flex-col flex-wrap gap-2 op-80 transition-200 hover:op-100>
        <!-- 个性签名 -->
        <div class="small-input mt-3 flex items-center justify-start">
          <small>签名：</small>
          <el-input
            v-if="isEdit"
            v-model.lazy="userCopy.slogan"
            class="mr-1"
            size="small"
            type="text"
            style="width: 14em"
            placeholder="展示你的个性签名吧~ ✨"
            @keyup.enter="submitUpdateUser('slogan')"
            @focus="isEditSlogan = true"
            @blur="isEditSlogan = false"
          />
          <el-button
            v-show="isEditSlogan"
            key="isEditSlogan-btn"
            icon="Select"
            size="small"
            type="primary"
            @click="submitUpdateUser('slogan')"
          />
        </div>
        <!-- 生日 -->
        <div class="small-input mt-3 flex-row-c-c justify-start">
          <small>生日：</small>
          <el-date-picker
            v-model.lazy="userCopy.birthday"
            type="date"
            placeholder="Pick a day"
            size="small"
            @change="submitUpdateUser('birthday')"
          />
        </div>
        <!-- 性别 -->
        <div class="small-input mt-3 flex-row-c-c justify-start">
          <!-- <i i-solar:adhesive-plaster-linear p-1 mr-2></i> -->
          <small>性别：</small>
          <el-select
            v-model="userCopy.gender"
            placeholder="Select"
            style="width: 10.5em"
            size="small"
            @change="submitUpdateUser('gender')"
          >
            <el-option
              v-for="item in genderList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.avatar {
  width: 6em;
  height: 6em;
  border-radius: 50%;

  :deep(.el-upload) {
    overflow: hidden;
    width: 6em;
    height: 6em;
    border-radius: 50%;

    .el-upload-dragger {
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      width: 6em;
      height: 6em;
      border-width: 2px;
      border-radius: 50%;
      transition: $transition-delay;
    }
  }
}
/* stylelint-disable-next-line selector-class-pattern */
.small-input :deep(.el-input__wrapper) {
  &.is-focus {
    box-shadow: 0 0 0 1px var(--el-input-foucs-border-color) inset;
  }

  box-shadow: none;
}

.el-popper-init {
  padding: 2px 4px;
}
:deep(.el-input) {
  .el-input__wrapper {
    background-color: transparent;
  }
}
</style>
