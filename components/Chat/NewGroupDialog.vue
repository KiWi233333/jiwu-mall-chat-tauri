<script lang="ts" setup>
/**
 * 添加群聊dialog
 */
const props = defineProps<{
  modelValue: boolean
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>();


// 会话store
const user = useUserStore();
const chat = useChatStore();

const show = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit("update:modelValue", val);
  },
});


// 表单相关
const form = ref({
  roomId: null as number | null | undefined,
  avatar: null as string | null | undefined,
  uidList: [],
});
const formRef = ref();

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
    ElNotification.success({
      title: "发起邀请提醒",
      message: +res.data === form.value.uidList.length ? "群聊邀请已发送！" : "部分邀请未送达！",
    });
  });
}


// 好友用户列表
const isLoading = ref<boolean>(false);
const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
  total: -1,
});
const userList = ref<ChatUserFriendVO[]>([]);

// 加载数据
async function loadData() {
  if (isLoading.value || pageInfo.value.isLast)
    return;
  isLoading.value = true;
  const { data } = await getChatFriendPage(pageInfo.value.size, pageInfo.value.cursor, user.getToken);
  if (data.list)
    userList.value.push(...data.list);
  pageInfo.value.isLast = data.isLast;
  pageInfo.value.cursor = data.cursor;
  isLoading.value = false;
}
loadData();

const getCheckList = computed(() => {
  const uidList = new Set(form.value.uidList);
  return userList.value.filter(item => uidList.has(item.userId as never));
});
function remove(id: string) {
  form.value.uidList = form.value.uidList.filter(item => item !== id);
}

// 上传头像
const showImg = ref(false);
const inputOssFileUploadRef = ref();
function onSubmitImages(key: string, pathList: string[], fileList: OssFile[]) {
  form.value.avatar = key;
}

// 重载
function reload(uidList = []) {
  form.value.roomId = null;
  form.value.uidList = uidList;
  form.value.avatar = null;
  showImg.value = false;
}
reload();

// 下一步fn
function next() {
  if (form.value.roomId) {
    addGroupApply();
  }
  else {
    if (form.value.uidList.length <= 0)
      return ElMessage.warning("请选择成员");

    showImg.value = true;
  }
}
// 暴露
defineExpose({
  form,
  reload,
});
</script>

<template>
  <el-dialog v-model="show" :title="form.roomId ? '邀请成员' : '新建群聊'" width="fit-content" class="overflow-hidden" center append-to-body>
    <el-form
      ref="formRef"
      label-position="top"
      :model="form"
      class="relative max-h-400px flex"
    >
      <div v-auto-animate>
        <div v-show="!showImg" key="left" class="w-90vw flex md:w-800px">
          <!-- 未选列表 -->
          <el-form-item
            label="好友列表"
            class="left flex-1"
          >
            <el-checkbox-group v-model="form.uidList" class="w-full">
              <el-scrollbar height="350px" wrap-class="pr-2 w-full">
                <div flex flex-col>
                  <ListAutoIncre
                    :immediate="true"
                    :auto-stop="true"
                    :no-more="pageInfo.isLast"
                    :loading="isLoading"
                    @load="loadData"
                  >
                    <el-checkbox v-for="p in userList" :key="p.userId" class="check-item mb-2" :value="p.userId" :label="p.userId" style="width: 100%;height: fit-content;">
                      <div class="w-full flex items-center gap-2">
                        <div class="avatar-icon">
                          <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" />
                        </div>
                        <strong truncate>{{ p.nickName || "未填写" }}</strong>
                      </div>
                    </el-checkbox>
                  </ListAutoIncre>
                </div>
              </el-scrollbar>
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
            class="right flex-1 pb-2rem"
            style="display: flex;;flex-direction: column;"
          >
            <el-scrollbar style="width: 100%;" height="300px" view-class="min-h-full bg-light items-start w-full v-card grid md:grid-cols-5 gap-4 p-2 dark:bg-dark-9 mt-0">
              <div v-for="p in getCheckList" :key="p.userId" class="item relative flex-col truncate p-2" :label="p.userId">
                <i i-solar:close-circle-bold p-2 btn-primary class="absolute right-0 top-0 z-1" @click="remove(p.userId)" />
                <div class="avatar-icon">
                  <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" />
                </div>
                <span>{{ p.nickName || "未填写" }}</span>
              </div>
            </el-scrollbar>
            <div mt-a w-full flex-row-c-c>
              <el-button class="w-1/3" @click="show = false">
                取消
              </el-button>
              <el-button class="w-1/3" :type="form.roomId ? 'warning' : 'info'" @click="next()">
                {{ form.roomId ? '邀请' : '下一步' }}
              </el-button>
            </div>
          </el-form-item>
        </div>
        <div
          v-if="showImg"
          key="2" class="h-300px w-90vw flex-row-c-c flex-col md:w-400px"
        >
          <!-- 选择头像 -->
          <el-form-item
            label="群头像"
            prop="avatar"
            :rules="[
              {
                required: true,
                trigger: ['blur'],
                message: '群头像不能为空！',
              }]"
            class="right flex-1 pb-2rem"
            style="display: flex;;flex-direction: column;"
          >
            <InputOssFileUpload
              ref="inputOssFileUploadRef"
              key="inputOssFileUploadRef"
              :multiple="false"
              :limit="1"
              input-class="w-8rem h-8rem mr-2 flex-row-c-c flex-shrink-0  v-card"
              :upload-quality="0.4"
              @error-msg="(msg:string) => {
                ElMessage.error(msg)
              }"
              @submit="onSubmitImages"
            />
          </el-form-item>
          <div mt-a w-full flex-row-c-c>
            <el-button class="w-1/5" @click="showImg = false">
              上一步
            </el-button>
            <el-button class="w-1/5" :type="form.roomId ? 'warning' : 'info'" @click=" addGroupApply()">
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
:deep(.el-form-item__content) {
  align-items: start;
}
:deep(.el-checkbox__inner) {
  border-radius: 4px;
  transform: scale(1.2);
  // border-radius: 1rem;
}
.avatar-icon {
  --at-apply:"h-2.6rem card-default  w-2.6rem flex-row-c-c rounded-6px  shadow-sm border-default"
}
.item {
  --at-apply:"flex items-center gap-4 p-2 cursor-pointer rounded-6px hover:(bg-[#b8b8b818] ) transition-300"
}
.check-item {
  --at-apply:"flex items-center px-4 gap-2 cursor-pointer rounded-6px p-2 hover:(bg-[#b8b8b818] ) transition-300"

}
:deep(.el-checkbox.is-checked){
  --at-apply:" bg-[#b8b8b818] shadow-sm"
}
</style>
