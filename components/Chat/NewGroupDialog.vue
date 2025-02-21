<script lang="ts" setup>
/**
 * 添加群聊dialog
 */
const {
  modelValue = false,
  form: formData,
} = defineProps<{
  modelValue: boolean
  form?: {
    roomId: number | null | undefined
    uidList: string[]
  }
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>();

// 会话store
const user = useUserStore();
const setting = useSettingStore();

const [autoAnimateRef, enable] = useAutoAnimate({});
onMounted(() => {
  enable(!setting.settingPage.isCloseAllTransition);
});

const show = computed({
  get() {
    return modelValue;
  },
  set(val) {
    if (val) {
      reset();
      reload();
    }
    emit("update:modelValue", val);
  },
});

// 好友用户列表
const isLoading = ref<boolean>(false);
const pageInfo = ref({
  size: 5,
  page: 0,
  total: -1,
});
const dto = ref<ChatUserFriendPageDTO>({
  keyWord: "",
});
const friendList = ref<ChatUserFriendVO[]>([]);
const friendMaps = new Map<string, ChatUserFriendVO>();
const filterFriendList = computed(() => {
  if (!dto.value.keyWord?.trim()) {
    return friendList.value;
  }
  return friendList.value.filter(item => item.nickName?.toLowerCase().includes(dto.value.keyWord || ""));
});
const imgStep = ref(false);
// 表单相关
const form = ref<{
  roomId: number | null | undefined
  avatar: string | null | undefined
  uidList: string[]
}>({
  roomId: undefined,
  avatar: undefined,
  uidList: [],
});
const formRef = ref();
watch(() => formData, (val) => {
  form.value.roomId = val?.roomId;
  form.value.uidList = val?.uidList || [];
});
const notMore = computed(() => friendList.value.length === pageInfo.value.total);

// 添加群聊
function addGroupApply() {
  formRef?.value?.validate(async (valid: boolean) => {
    if (!valid)
      return;
    // 请求
    let res;
    if (form.value.roomId) { // 1、邀请好友
      res = await addGroupMember({
        ...form.value as AddGroupMemberDTO,
      }, user.getToken);
    }
    else { // 2、新建群聊
      res = await addNewGroupRoom({
        ...form.value as NewGroupRoomDTO,
      }, user.getToken);
    }
    if (res.code !== StatusCode.SUCCESS)
      return;

    show.value = false;
    const diff = form.value.uidList.length - (+res?.data || form.value.uidList.length);
    ElMessage({
      type: !diff ? "success" : "warning",
      message: !diff ? "群聊邀请已发送！" : `部分邀请未送达（${res.data || 0}/${form.value.uidList.length}）！`,
    });
    reset();
  });
}

// 加载数据
async function loadData() {
  if (isLoading.value || notMore.value || !show.value)
    return;
  isLoading.value = true;
  pageInfo.value.page += 1;
  const { data } = await getChatFriendPageV2(pageInfo.value.page, pageInfo.value.size, dto.value, user.getToken);
  if (!data)
    return;
  friendList.value.push(...data.records);
  data.records.forEach((item) => {
    friendMaps.set(item.userId, item);
  });
  pageInfo.value = {
    size: 5,
    page: data.current,
    total: data.total,
  };
  isLoading.value = false;
}

const getCheckList = computed(() => form.value.uidList.map(item => friendMaps.get(item) || { userId: item, nickName: "未填写", avatar: "" }));

function remove(id: string) {
  form.value.uidList = form.value.uidList.filter(item => item !== id);
}

// 上传头像
const inputOssFileUploadRef = ref();
function onSubmitImages(key: string, pathList: string[], fileList: OssFile[]) {
  form.value.avatar = key;
}

// 重载
function reload() {
  loadData();
}

// 重载
function reset() {
  form.value = {
    roomId: undefined,
    avatar: undefined,
    uidList: [],
  };
  imgStep.value = false;
  friendList.value = [];
  pageInfo.value = {
    size: 5,
    page: 0,
    total: -1,
  };
}

const search = useDebounceFn(() => {
  imgStep.value = false;
  friendList.value = [];
  pageInfo.value = {
    size: 5,
    page: 0,
    total: -1,
  };
  loadData();
}, 300);

// 下一步fn
function next() {
  if (form.value.roomId) {
    addGroupApply();
  }
  else {
    if (form.value.uidList.length <= 0)
      return ElMessage.warning("请选择成员");
    imgStep.value = true;
  }
}

// 暴露
defineExpose({
  form,
  reload,
  reset,
});
</script>

<template>
  <el-dialog
    v-model="show"
    :title="form.roomId ? '邀请成员' : '新建群聊'"
    width="fit-content"
    class="overflow-hidden"
    center
    append-to-body
    destroy-on-close
  >
    <el-form
      ref="formRef"
      label-position="top"
      :model="form"
      class="relative"
    >
      <div ref="autoAnimateRef">
        <div v-show="!imgStep" key="first" class="mt-4 w-84vw flex flex flex-col gap-4 px-4 md:w-800px md:flex-row">
          <!-- 未选列表 -->
          <el-form-item
            class="left flex-1"
          >
            <template #label>
              <div class="w-full flex-row-bt-c">
                好友列表
                <el-input
                  v-model.lazy="dto.keyWord"
                  class="w-10em"
                  size="small" placeholder="搜索" clearable
                  type="text"
                  @keydown.enter.prevent="search()"
                />
              </div>
            </template>
            <el-checkbox-group v-model="form.uidList" class="w-full">
              <div class="max-h-200px flex flex-col overflow-y-auto sm:max-h-300px sm:pr-2">
                <ListAutoIncre
                  :immediate="false"
                  :auto-stop="false"
                  :no-more="notMore"
                  @load="loadData"
                >
                  <el-checkbox v-for="p in filterFriendList" :key="p.userId" class="check-item mb-2" :value="p.userId" :label="p.userId" style="width: 100%;height: fit-content;">
                    <div class="w-full flex items-center gap-2">
                      <div class="avatar-icon">
                        <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" />
                      </div>
                      <span class="truncate text-color">{{ p.nickName || "未填写" }}</span>
                    </div>
                  </el-checkbox>
                </ListAutoIncre>
              </div>
            </el-checkbox-group>
          </el-form-item>
          <!-- 已选列表 -->
          <el-form-item
            label="已选好友"
            prop="uidList"
            :rules="[
              {
                required: true,
                trigger: ['blur'],
                message: '群成员不能为空！',
              }]"
            class="right h-fit flex-1"
            style="display: flex;;flex-direction: column;"
          >
            <ListTransitionGroup v-show="getCheckList.length > 0" tag="div" class="grid grid-cols-3 mt-0 max-h-200px min-h-200px w-full items-start gap-col-2 overflow-y-auto card-rounded-df p-2 sm:(grid-cols-4 max-h-300px min-h-300px) bg-color-2">
              <div v-for="p in getCheckList" :key="p.userId" class="item" :label="p.userId">
                <i i-solar:close-circle-bold p-2 btn-primary class="absolute right-2px top-2px z-1" @click="remove(p.userId)" />
                <div class="avatar-icon">
                  <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" />
                </div>
                <span class="block max-w-18 truncate">{{ p.nickName || "未填写" }}</span>
              </div>
            </ListTransitionGroup>
            <!-- 空白 -->
            <div v-show="getCheckList.length <= 0" class="h-200px w-full flex-row-c-c card-rounded-df sm:h-300px bg-color-2 text-small-50">
              <i i-solar:user-plus-broken mr-2 p-2.5 />
              <p>未选择成员</p>
            </div>
            <div mt-8 w-full flex-row-c-c>
              <el-button class="w-1/3" @click="show = false">
                取消
              </el-button>
              <el-button
                class="w-1/3"
                :disabled="form.uidList.length <= 0"
                :type="form.roomId ? 'warning' : 'info'" @click="next()"
              >
                {{ form.roomId ? '邀请' : '下一步' }}
              </el-button>
            </div>
          </el-form-item>
        </div>
        <div
          v-if="imgStep"
          key="2" class="h-250px w-90vw flex-row-c-c flex-col md:w-280px sm:h-300px"
        >
          <!-- 选择头像 -->
          <el-form-item
            label=""
            class="avatar"
            prop="avatar"
            :rules="[
              {
                required: true,
                trigger: ['blur'],
                message: '群头像不能为空！',
              }]"
            style="height: fit-content;margin: auto;margin-bottom: 0;"
          >
            <div class="flex-row-c-c flex-col">
              <InputOssFileUpload
                ref="inputOssFileUploadRef"
                key="inputOssFileUploadRef"
                :multiple="false"
                :limit="1"
                input-class="w-7rem h-7rem flex-row-c-c flex-shrink-0  card-default"
                :upload-quality="0.4"
                @error-msg="(msg:string) => {
                  ElMessage.error(msg)
                }"
                @submit="onSubmitImages"
              />
              <div class="mb-4 text-center">
                群头像
              </div>
            </div>
          </el-form-item>
          <div mb-4 mt-a w-full flex-row-c-c>
            <el-button class="mr-2 w-5rem" @click="imgStep = false">
              上一步
            </el-button>
            <el-button class="w-5rem" :type="form.roomId ? 'warning' : 'info'" @click=" addGroupApply()">
              完成
            </el-button>
          </div>
        </div>
      </div>
    </el-form>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-checkbox-group) {
  font-size: 1em;
  line-height: 1.1em;
}
:deep(.el-form-item) {
  .el-form-item__label {
    display: block;
    width: 100%;
  }
  .el-form-item__content {
    align-items: start;
  }
  .el-input {
    .el-input__wrapper {
      --at-apply: "!shadow-none !outline-none bg-light-500 dark:bg-dark-7";
    }
  }
}
:deep(.el-checkbox__inner) {
  border-radius: 4px;
  transform: scale(1.2);
  // border-radius: 1rem;
}
.avatar-icon {
  --at-apply:"h-2.4rem card-default  w-2.4rem flex-row-c-c rounded-6px  shadow-sm border-default"
}
.item {
  --at-apply:"flex flex-col relative items-center gap-4 px-2 py-3.6 page-pointer rounded-6px hover:(bg-color-3 ) transition-300"
}
.check-item {
  --at-apply:"flex items-center px-4 gap-2 page-pointer rounded-6px p-2 hover:(bg-color-3 ) transition-300"
}
:deep(.el-checkbox.is-checked){
  --at-apply:" bg-color-3 shadow-sm"
}
.avatar {
  :deep(.el-form-item__error) {
    width: 100%;
    text-align: center;
  }
}
</style>
