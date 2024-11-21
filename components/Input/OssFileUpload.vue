<script lang="ts" setup>
import { deleteOssFile, getOssErrorCode, getResToken, OssFileType, uploadOssFileSe } from "@/composables/api/res";
import { StatusCode } from "@/types/result";
import * as qiniu from "qiniu-js";

const {
  limit = 1,
  size,
  draggable = false,
  preClass = "",
  errorClass = "",
  inputClass = "",
  multiple = false,
  showEdit = true,
  showDelete = true,
  required = false,
  isAnimate = true,
  disable = false,
  modelValue = [] as OssFile[],
  accept = "image/*",
  acceptDesc = ["image/jpeg", "image/png", "image/bmp", "image/webp", "image/jpg", "image/tiff", "image/tif", "image/ico", "image/x-icon"],
  uploadType = OssFileType.IMAGE,
  uploadQuality = 0.4,
  preview = true,
} = defineProps<Props>();
// emit
const emit = defineEmits<{
  (e: "submit", newKey: string, pathList: string[], fileList: OssFile[]): any
  (e: "errorMsg", errorStr: string): any
  (e: "update:modelValue", date: OssFile[]): any
}>();

interface Props {
  limit?: number
  multiple?: boolean
  showEdit?: boolean
  showDelete?: boolean
  required?: boolean
  modelValue?: OssFile[]
  preview?: boolean
  disable?: boolean
  isAnimate?: boolean
  uploadQuality?: number
  /**
   * 文件类型
   * @default 'image/*'
   */
  accept?: string
  acceptDesc?: string[]
  uploadType?: OssFileType
  /**
   * 文件大小限制 单位：Byte
   */
  size?: number
  draggable?: boolean
  preClass?: string
  errorClass?: string
  inputClass?: string
}

const user = useUserStore();

// 已上传文件列表 (public)
const fileList = ref<OssFile[]>(modelValue || []);
const pathList = computed(() => {
  return getNewPathList(fileList.value);
});

function getNewPathList(list: OssFile[]) {
  const pathList: string[] = [];
  if (list) {
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p && p.key)
        pathList.push(p.key);
    }
  }
  return pathList;
}

// 错误信息
const error = ref<string>("");
// 输入框ref
const inputRef = ref();

// 1、文件改变
async function hangdleChange(e: Event) {
  if (disable)
    return;
  const t = e.target as HTMLInputElement;
  if (!t.files?.length)
    return;
  // 单文件
  if (limit === 1) {
    if (fileList.value.length)
      fileList.value.splice(0);
    await onUpload(
      {
        // id: URL.createObjectURL(t.files[0]),
        id: URL.createObjectURL(t.files[0] as Blob | MediaSource),
        key: undefined,
        status: "",
        percent: 0,
        file: t.files[0],
      },
    );
  }
  else {
    // 多文件
    if (t.files.length > limit || fileList.value.length + t.files.length > limit) {
      emit("errorMsg", `最多只能上传${limit}个文件`);
      return error.value = `最多只能上传${limit}个文件`;
    }
    else {
      error.value = "";
    }
    const data = [...t.files].map((p) => {
      return {
        id: uploadType === OssFileType.IMAGE ? URL.createObjectURL(p) : BaseUrlVideo + p,
        key: undefined,
        status: "",
        percent: 0,
        file: p,
      };
    }) as OssFile[];
    for (const p of data)
      onUpload(p);
  }
}

/**
 * 上传文件
 * @param file
 */
async function onUpload(file: OssFile) {
  // 文件校验
  if (size !== undefined && file?.file?.size && file?.file?.size > size) {
    error.value = `文件大小不能超过${size / 1024 / 1024}M`;
    return;
  }
  else {
    error.value = "";
  }
  // 1）获取凭证
  const data = await getResToken(uploadType, user.getToken);
  if (data.code !== StatusCode.SUCCESS) {
    error.value = data.message;
    file.status = "warning";
    return;
  }
  else {
    file.key = data.data.key;
  }
  const options = {
    quality: uploadQuality || 0.6,
    noCompressIfLarger: true,
  };
  if (!file?.file)
    return;

  // ------------添加到队列-----------
  // 上传中 只能压缩图片
  if (uploadType === OssFileType.IMAGE && acceptDesc.includes(file.file.type)) {
    qiniu.compressImage(file?.file, options).then((res) => {
      // 2）上传 监视器
      qiniuUpload(res.dist as File, file?.key || "", data.data.uploadToken, file);
    }).catch((e) => {
      console.warn(e);
      file.status = "warning";
      error.value = "图片压缩失败，请稍后再试！";
      emit("errorMsg", error.value);
    }).finally(() => {
      if (!error.value)
        fileList.value.push(file);
    });
  }
  else {
    qiniuUpload(file.file, file?.key || "", data.data.uploadToken, file);
    fileList.value.push(file);
  }
}
// 封装上传处理
function qiniuUpload(dist: File, key: string, token: string, file: OssFile) {
  const observable = uploadOssFileSe(dist, key, token);
  const subscribe = observable.subscribe({
    next(res) {
      const current = fileList.value.find(p => p.key === key) || file;
      current.percent = +(res.total.percent?.toFixed?.(2) || 0);
    },
    error(e) {
      const theFile = fileList.value.find(p => p.key === key) || file;
      theFile.status = "warning";
      const err = e as any;
      if (err?.code) {
        error.value = getOssErrorCode(err?.code) || "上传失败，请稍后再试！";
        emit("errorMsg", error.value);
      }
      else {
        theFile.status = "exception";
        ElMessage.error("上传失败，稍后再试！");
      }
    },
    complete() {
      const current = fileList.value.find(p => p.key === key) || file;
      current.status = "success";
      current.percent = 100;
      emit("update:modelValue", fileList.value);
      emit("submit", current.key!, pathList.value, fileList.value);
    },
  });
  file.subscribe = subscribe;
}


function resetInput() {
  if (inputRef?.value?.value)
    inputRef.value.value = "";
}
// 删除文件
async function removeItem(t: OssFile) {
  if (!t.key)
    return;
  let flag = false;
  if (t.key) {
    // 上传中
    const file = fileList.value.find(item => item.key === t.key);
    if (file && file.status !== "success") {
      file.status = "warning";
      file.subscribe?.unsubscribe();
    }
    const res = await deleteOssFile(t.key, user.getToken);
    if (res.code === StatusCode.SUCCESS) {
      fileList.value.splice(
        fileList.value.findIndex(item => item.key === t.key),
        1,
      );
      flag = true;
    }
    else if (res.code === StatusCode.DELETE_ERR) {
      fileList.value.splice(
        fileList.value.findIndex(item => item.key === t.key),
        1,
      );
    }
  }
  else {
    fileList.value.splice(
      fileList.value.findIndex(item => item.id === t.id),
      1,
    );
  }
  resetInput();
  emit("update:modelValue", fileList.value);
  emit("submit", "", pathList.value, fileList.value);
  return flag;
}

/**
 * 计算预览列表样式class
 */
const preImageClass = computed(() => {
  const arr: string[] = [];
  if (limit === 1)
    arr.push("absolute top-0 z-1");
  if (inputClass)
    arr.push(inputClass);
  if (preClass)
    arr.push(preClass);
  return arr;
});

defineExpose({
  inputRef,
  fileList,
  pathList,
  onUpload,
  removeItem,
  resetInput,
});

// 初始化文件列表
watch(() => modelValue, (val) => {
  if (val)
    fileList.value = val;
}, { immediate: true });

const getPreImage = computed(() => {
  if (preview)
    return pathList.value.map(p => BaseUrlImg + p);
  else
    return [];
});

const [autoAnimateRef, enable] = useAutoAnimate({
});
onMounted(() => {
  const setting = useSettingStore();
  enable(isAnimate && !setting.settingPage.isCloseAllTransition);
});
</script>

<template>
  <div ref="autoAnimateRef" class="input-list relative flex cursor-pointer select-none">
    <div
      key="inputs"
      flex-row-c-c
      transition-300 hover:border="[var(--el-color-primary)]"
      class="relative z-1 backdrop-blur-12px border-default-dashed hover:text-[var(--el-color-primary)]"
      :class="inputClass"
    >
      <input
        ref="inputRef"
        class="z-10 block h-full w-full cursor-pointer opacity-0 absolute-center"
        type="file"
        :multiple="multiple"
        :accept="accept"
        :required="required"
        :disabled="disable"
        :draggable="draggable"
        @change="hangdleChange"
      >
      <ElIconPlus class="h-1/3 w-1/3 absolute-center" />
    </div>
    <!-- 图片预览 -->
    <template v-if="uploadType === OssFileType.IMAGE && preview">
      <div
        v-for="(p, index) in fileList"
        :key="p.id"
        class="pre-group flex flex-shrink-0 overflow-hidden backdrop-blur-12px"
        :class="preImageClass"
      >
        <CardElImage
          loading="lazy"
          :alt="p.id"
          fit="cover"
          :src="p.id"
          load-class="none"
          :preview-src-list="preview ? getPreImage : []"
          preview-teleported
          :initial-index="index"
          class="relative h-full w-full select-none object-cover"
        />
        <div class="absolute left-0 top-0 h-full w-full flex-row-c-c">
          <!-- 加载中 -->
          <el-progress
            v-if="p.status !== 'success'"
            style="aspect-ratio: 1/1; height: 100%; padding: 16%"
            color="var(--el-color-primary)"
            class="backdrop-blur-12px"
            striped
            striped-flow
            type="circle"
            :percentage="p?.percent"
            :status="p.status || ''"
          />
          <!-- 编辑 -->
          <div
            v-else-if="showEdit"
            class="pre-group-hover absolute left-0 top-0 h-full w-full flex-row-c-c gap-1 opacity-0 backdrop-blur-20px transition-300 v-card"
          >
            <slot name="pre-btns">
              <div
                v-if="showDelete"
                class="h-full max-h-2rem max-w-2rem w-1/5 cursor-pointer hover:bg-[var(--el-color-danger)]"
                i-solar:trash-bin-trash-bold-duotone
                @click="removeItem(p)"
              />
              <!-- 取消上传 -->
              <div
                v-if="p?.percent && p?.percent < 100"
                class="h-1/5 max-h-2rem max-w-2rem w-1/5 cursor-pointer hover:bg-[var(--el-color-danger)]"
                i-solar:close-circle-bold-duotone
                @click.stop="p?.subscribe?.unsubscribe()"
              />
            </slot>
          </div>
        </div>
      </div>
    </template>
    <!-- 视频 -->
    <template v-if="uploadType === OssFileType.VIDEO && preview">
      <div
        v-for="p in modelValue"
        :key="p.id"
        class="pre-group relative flex-shrink-0 overflow-hidden backdrop-blur-12px"
        :class="preImageClass"
      >
        <video
          :src="p.id"
          controls z-0 h-full w-full select-none object-cover
        />
        <div class="absolute left-0 top-0 z-1 h-1/4 w-full flex-row-c-c">
          <!-- 加载中 -->
          <el-progress
            v-if="p.percent < 100"
            style="width: 100%; height: 100%; padding: 16%"
            color="var(--el-color-primary)"
            class="backdrop-blur-12px"
            striped
            striped-flow
            type="circle"
            :percentage="p.percent"
            :status="p.status"
          />
          <div
            v-if="!p?.percent && p?.percent < 100"
            class="z-2 h-1/5 max-h-2rem max-w-2rem w-1/5 cursor-pointer hover:bg-[var(--el-color-danger)]"
            i-solar:close-circle-bold
            @click="p?.subscribe?.unsubscribe()"
          />
          <!-- 编辑 -->
          <div
            v-else-if="showEdit"
            class="pre-group-hover absolute left-0 top-0 h-full w-full flex-row-c-c gap-1 opacity-0 backdrop-blur-20px transition-300 v-card"
          >
            <slot name="pre-btns">
              <div
                v-if="showDelete"
                class="h-full max-h-2rem max-w-2rem w-1/5 cursor-pointer hover:bg-[var(--el-color-danger)]"
                i-solar:trash-bin-trash-bold-duotone
                @click="removeItem(p)"
              />
            </slot>
          </div>
        </div>
      </div>
    </template>
    <div key="slot">
      <slot />
    </div>
    <div
      v-show="error"
      key="error"
      :class="errorClass "
      class="m-1 block w-full overflow-hidden truncate text-[var(--el-color-danger)] leading-1em opacity-80"
    >
      {{ error }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.input-list  {

  :deep(.el-progress) {
    width: 100%;
    height: 100%;
    padding: 16%;
    align-items: center;
    display: flex;
    justify-content: center;
    .el-progress-circle {
      width: 60% !important;
      height: auto !important;
    }
    .el-progress__text {
      color: #fff;
    }
  }

}
.pre-group:hover {
  .pre-group-hover{
    opacity: 100;
  }
}
.pre-btn {
  --at-applay: "h-1/5 max-h-1.4rem max-w-1.4rem  min-h-0.8rem min-w-0.8rem w-1/5 cursor-pointer"
}
</style>
