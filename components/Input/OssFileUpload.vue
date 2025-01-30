<script lang="ts" setup>
import type { OssFile } from "@/composables/api/res";
import { deleteOssFile, getOssErrorCode, getResToken, OssFileType, uploadOssFileSe } from "@/composables/api/res";
import { StatusCode } from "@/types/result";
import * as qiniu from "qiniu-js";

const {
  limit = 1,
  size,
  minSize,
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
  minSize?: number
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
const inputRef = useTemplateRef("inputRef");

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
    if (t.files.length > limit || (fileList.value.length + t.files.length) > limit) {
      emit("errorMsg", `最多只能上传${limit}个文件`);
      await nextTick();
      resetInput();
      return error.value = `最多只能上传${limit}个文件`;
    }
    else {
      error.value = "";
    }
    const data = [...t.files].map((p) => {
      return {
        id: URL.createObjectURL(p as Blob | MediaSource),
        // id: uploadType === OssFileType.IMAGE ? URL.createObjectURL(p) : BASE_OSS_PATH + p,
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
 * @param ossFile 文件对象
 */
async function onUpload(ossFile: OssFile) {
  // 文件校验
  if (fileList.value.length + 1 > limit) { // 限制上传数量
    error.value = `最多只能上传${limit}个文件`;
    emit("errorMsg", error.value);
    await nextTick();
    resetInput();
    return;
  }
  if (size !== undefined && ossFile?.file?.size && ossFile?.file?.size > size) {
    error.value = `文件大小不能超过${formatFileSize(size)}`;
    emit("errorMsg", error.value);
    resetInput();
    return;
  }
  if (minSize !== undefined && ossFile?.file?.size && ossFile?.file?.size < minSize) {
    error.value = `文件大小不能小于${formatFileSize(minSize)}`;
    emit("errorMsg", error.value);
    resetInput();
    return;
  }
  else {
    error.value = "";
  }
  // 1）获取凭证
  const upToken = await getResToken(uploadType, user.getToken);
  if (upToken.code !== StatusCode.SUCCESS) {
    error.value = upToken.message;
    ossFile.status = "warning";
    return;
  }
  // 保存上传凭证
  ossFile.key = upToken.data.key;
  const options = {
    quality: uploadQuality || 0.6,
    noCompressIfLarger: true,
  };
  if (!ossFile?.file)
    return;

  // ------------添加到队列-----------
  // 上传中 只能压缩图片
  if (uploadType === OssFileType.IMAGE && acceptDesc.includes(ossFile.file.type)) {
    // console.log("文件大小 before:", file?.file?.size);
    qiniu.compressImage(ossFile?.file, options).then((res) => {
      // 2）上传 监视器
      // console.log("after:", res.dist.size);
      qiniuUpload(res.dist as File, ossFile?.key || "", upToken.data.uploadToken, ossFile);
    }).catch((e) => {
      console.warn(e);
      ossFile.status = "warning";
      error.value = "图片压缩失败，请稍后再试！";
      emit("errorMsg", error.value);
    }).finally(() => {
      if (!error.value)
        fileList.value.push(ossFile);
    });
  }
  else if (uploadType === OssFileType.VIDEO && ossFile?.file) { // 视频先获取一帧，作为封面
    // 2. 获取封面
    generateVideoThumbnail(ossFile.file, { quality: 0.4, mimeType: "image/png" }).then(async ({
      blob,
      width,
      height,
      duration,
      size,
    }: VideoFileInfo) => {
      const coverUrl = URL.createObjectURL(blob);
      const coverFileRaw = new File([blob], "cover.png", { type: blob.type }) as File;
      const coverFile = ref<OssFile>({
        id: coverUrl,
        key: undefined,
        status: "",
        percent: 0,
        file: coverFileRaw,
        duration,
        thumbWidth: width,
        thumbHeight: height,
        thumbSize: size,
      });
      ossFile.children = [ // 封面复制
        coverFile.value,
      ];
      // 1. 先上传封面图片
      const coverRes = await getResToken(OssFileType.IMAGE, user.getToken);
      fileList.value.push(ossFile);
      if (coverRes.code !== StatusCode.SUCCESS || !ossFile.file) {
        error.value = coverRes.message;
        ossFile.status = "warning";
        return;
      }
      coverFile.value.key = coverRes.data.key;
      // 图片文件上传
      qiniuUpload(coverFile?.value?.file as File, coverFile.value.key as string, coverRes.data.uploadToken, coverFile.value, false, (theCover) => {
        if (ossFile.status === "success") {
          ossFile.status = theCover.status;
        }
      });
      // 2. 上传视频
      qiniuUpload(ossFile.file, ossFile?.key || "", upToken.data.uploadToken, ossFile);
    }).catch((e) => {
      console.warn(e);
      ossFile.status = "warning";
      error.value = "视频封面获取失败，请稍后再试！";
      emit("errorMsg", error.value);
    });
  }
  else {
    qiniuUpload(ossFile.file, ossFile?.key || "", upToken.data.uploadToken, ossFile);
    fileList.value.push(ossFile);
  }
}
// 封装上传处理
function qiniuUpload(dist: File, key: string, token: string, file: OssFile, isPush = true, done?: (theFile: OssFile) => void) {
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
      done && done(current);
      resetRawInp();
      isPush && emit("update:modelValue", fileList.value);
      isPush && emit("submit", current.key!, pathList.value, fileList.value);
    },
  });
  file.subscribe = subscribe;
}

function resetRawInp() {
  if (inputRef?.value?.value) {
    inputRef.value.value = "";
    error.value = "";
  }
}

function resetInput() {
  if (inputRef?.value?.value) {
    inputRef.value.value = "";
    fileList.value = [];
    error.value = "";
  }
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
      file.subscribe?.unsubscribe(); // 取消上传
    }
    const files = [t, ...(t.children || [])];
    files.forEach(async (item) => {
      if (!item.key) {
        return;
      }
      const res = await deleteOssFile(item.key, user.getToken);
      if (res.code === StatusCode.SUCCESS) {
        fileList.value.splice(
          fileList.value.findIndex(item => item.key === t.key),
          1,
        );
        flag = true;
      }
      else if (res.code === StatusCode.DELETE_NOEXIST_ERR) {
        fileList.value.splice(
          fileList.value.findIndex(item => item.key === t.key),
          1,
        );
      }
    });
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

// 单文件时
// :on-exceed="handleExceed"
// const handleExceed: UploadProps["onExceed"] = (files) => {
//   if (!multiple || limit === 1) {
//     // inputRef.value!.clearFiles();
//     const file = files[0] as UploadRawFile;
//     // inputRef.value!.handleStart(file);
//   }
// };
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
            class="pre-group-hover absolute left-0 top-0 h-full w-full flex-row-c-c gap-1 opacity-0 backdrop-blur-20px transition-300 card-default"
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
            class="pre-group-hover absolute left-0 top-0 h-full w-full flex-row-c-c gap-1 opacity-0 backdrop-blur-20px transition-300 card-default"
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
