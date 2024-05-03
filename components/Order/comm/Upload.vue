<script lang="ts" setup>
import type { UploadFile, UploadUserFile } from "element-plus";
import type { ResOssVO } from "~/composables/api/res/index";
import { OssFileType } from "~/composables/api/res/index";

const { isDisable } = defineProps<{
  isDisable: boolean
}>();
const user = useUserStore();

// 上传文件集合
const uploadList = ref<Omit<UploadUserFile, "key">[]>([]);
const videoList = ref<Omit<UploadUserFile, "key">[]>([]);
interface UploadFileDTO extends UploadFile {
  key: string
}
// 预览
const imgUrl = ref<string>("");
const videoUrl = ref<string>("");
const isShowPreDialog = ref<boolean>(false);
const isPicture = ref<boolean>(true);
const videoRef = ref();
function getVideoPath(file: UploadFile) {
  return file.url;
}

/**
 * 预览显示对应图片
 */
function onPreview(uploadFile: UploadFile) {
  imgUrl.value = uploadFile.url!;
  isShowPreDialog.value = true;
  isPicture.value = true;
}
function onVideoPre(file: UploadFile) {
  videoUrl.value = file.url || "";
  isShowPreDialog.value = true;
  isPicture.value = false;
}

const dto = ref<ResOssVO>({
  url: "",
  key: "",
  uploadToken: "",
  endDateTime: -1,
});

// 1、上传之前
function checkFile(rawFile: UploadFile, size: number, msg: string) {
  if (rawFile.size && rawFile.size / 1024 / 1024 > size) {
    ElMessage.error(`${msg || "文件"}大小需小于${size}MB!`);
    return false;
  }
  return true;
}
// 2、改变
async function onChange(file: UploadFile, fileList: UploadFile[]) {
  if (!checkFile(file, 3, "图片"))
    return;

  const index = uploadList.value.findIndex(p => p.uid === file.uid);
  if (index === -1) {
    // 1、获取凭证
    const { data, code } = await getResToken(OssFileType.IMAGE, user.getToken);
    if (code === StatusCode.SUCCESS) {
      // @ts-expect-error
      file.key = data.key;
      uploadList.value.push(file);
      const i = uploadList.value.length - 1;
      // 2、文件上传
      uploadOssFile(file.raw!, data.key, data.uploadToken, {
        next(res) {
          uploadList.value[i].status = "uploading";
          uploadList.value[i].percentage = Number.parseFloat(res.total.percent.toFixed(2));
          if (res.total.percent === 100)
            uploadList.value[i].status = "success";
        },
        error() {
          uploadList.value[i].status = "fail";
        },
        complete() {
          uploadList.value[i].status = "success";
        },
      });
    }
    else {
      ElMessage.error("获取上传操作频繁，请5分钟后再试");
    }
  }
  else {
    fileList.splice(fileList.length - 1, 1);
    ElMessage.warning("文件已存在！");
  }
}
async function onChangeVideo(file: UploadFile, fileList: UploadFile[]) {
  if (!checkFile(file, 6, "视频"))
    return;

  const index = videoList.value.findIndex(p => p.name === file.name);
  if (index === -1) {
    // 1、获取凭证
    const { data, code } = await getResToken(OssFileType.VIDEO, user.getToken);
    if (code === StatusCode.SUCCESS) {
      // @ts-expect-error
      file.key = data.key;
      videoList.value.push(file);
      const i = videoList.value.length - 1;
      // 2、文件上传
      uploadOssFile(file.raw!, data.key, data.uploadToken, {
        next(res) {
          videoList.value[i].status = "uploading";
          videoList.value[i].percentage = Number.parseFloat(res.total.percent.toFixed(2));
          if (res.total.percent === 100)
            videoList.value[i].status = "success";
        },
        error() {
          videoList.value[i].status = "fail";
        },
        complete() {
          videoList.value[i].status = "success";
        },
      });
    }
    else {
      ElMessage.error("获取上传操作频繁，请5分钟后再试");
    }
  }
  else {
    fileList.splice(fileList.length - 1, 1);
    ElMessage.warning("文件已存在！");
  }
}
// 5、移除
const imageRef = ref();
async function onRemove(removeFile: UploadFile) {
  const i = uploadList.value.findIndex(p => p.uid === removeFile.uid);
  if (i === -1)
    return;
  // 删除项
  const item = uploadList.value[i] as UploadFileDTO;
  // 确认删除
  ElMessageBox.confirm("确定删除该图片?", "删除提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    lockScroll: false,
  })
    .then(async () => {
      const { code } = await deleteOssFile(item.key, user.getToken);
      imageRef.value.handleRemove(removeFile);
      if (code === StatusCode.SUCCESS)
        ElMessage.success("删除成功！");
    })
    .catch(() => {});
}
const videoInputRef = ref();
function onVideoRemove(file: UploadFileDTO) {
  ElMessageBox.confirm("确定删除该视频?", "删除提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    lockScroll: false,
    type: "warning",
  })
    .then(async () => {
      const { code } = await deleteOssFile(file.key, user.getToken);
      videoList.value.splice(0);
      videoInputRef.value.handleRemove(file);
      if (code === StatusCode.SUCCESS)
        ElMessage.success("删除成功！");
    })
    .catch(() => {});
}

const images = ref<string[]>([]);
const video = ref<string>("");
// 视频
watchDebounced(
  videoList,
  (val) => {
    if (val.length) {
      // @ts-expect-error
      video.value = val[0].key;
    }
  },
  {
    deep: true,
  },
);
// 图片
watchDebounced(
  uploadList,
  (val) => {
    if (val.length) {
      // @ts-expect-error
      const list = val.map(p => (p.key ? p.key : false));
      images.value = list;
    }
  },
  {
    deep: true,
  },
);

defineExpose({
  images,
  video,
});
</script>

<template>
  <div class="upload-group flex">
    <el-upload
      ref="imageRef"
      :file-list="uploadList"
      multiple
      accept="image/*"
      :limit="3"
      draggable
      list-type="picture-card"
      :disabled="isDisable"
      :auto-upload="false"
      @preview="onPreview"
      @exceed="() => ElMessage.warning('只能上传3张图片！')"
      @change="onChange"
    >
      <i
        i-solar:camera-linear p-1rem opacity-70
      />
      <!-- 预览 -->
      <template #file="{ file }">
        <div class="group relative h-6rem w-6rem cursor-pointer">
          <img
            class="h-full w-full"
            style="object-fit: cover"
            :src="file.url"
            alt="预览"
            loading="lazy"
            fit="cover"
          >
          <div
            v-show="file.status === 'success'"
            class="absolute left-0 top-0 h-full w-full flex-row-c-c bg-dark-100 opacity-0 transition-300 group-hover:opacity-80"
          >
            <ElIconZoomIn
              class="h-1.2rem w-1.2rem cursor-pointer text-[#fff] hover:text-[var(--el-color-primary)]"
              @click="onPreview(file)"
            />
            <ElIconCloseBold
              class="absolute right-2 top-2 h-1rem w-1rem cursor-pointer text-[#fff] hover:text-[var(--el-color-danger)]"
              @click="onRemove(file)"
            />
          </div>
          <!-- 加载 -->
          <div
            v-show="file.status === 'uploading'"
            class="absolute top-0 z-1 h-full w-full flex-row-c-c bg-light dark:bg-dark-1"
          >
            <el-progress
              :width="60"
              indeterminate
              type="circle"
              :percentage="file.percentage"
              :status="file.status === 'success' ? 'success' : ''"
            />
          </div>
          <small class="absolute top-0 z-10 text-[var(--el-color-danger)]">上传失败</small>
        </div>
      </template>
    </el-upload>

    <!-- 视频 -->
    <el-upload
      ref="videoInputRef"
      class="upload-video ml-3"
      :file-list="videoList"
      accept="video/*"
      :limit="1"
      list-type="picture-card"
      :disabled="isDisable"
      :auto-upload="false"
      @preview="onPreview"
      @exceed="() => ElMessage.warning('只能上传一个视频！')"
      @change="onChangeVideo"
    >
      <template #default>
        <i
          i-solar:video-library-line-duotone p-1rem opacity-70
        />
      </template>
      <template #file="{ file }">
        <div class="group relative">
          <video
            :src="getVideoPath(file)"

            h-full w-full
          />
          <div
            class="absolute left-0 top-0 h-full w-full flex-row-c-c bg-dark-100 opacity-0 transition-300 group-hover:opacity-80"
          >
            <ElIconCaretRight
              class="h-1.6rem w-1.6rem cursor-pointer text-[#fff] hover:text-[var(--el-color-primary)]"
              @click="onVideoPre(file)"
            />
            <ElIconCloseBold
              class="absolute right-2 top-2 h-1rem w-1rem cursor-pointer text-[#fff] hover:text-[var(--el-color-danger)]"
              @click="onVideoRemove(file)"
            />
          </div>
        </div>
      </template>
    </el-upload>

    <Teleport to="body">
      <el-dialog v-model="isShowPreDialog">
        <img
          v-show="isPicture"
          w-full
          :src="imgUrl"
          alt="Kiwi2333 极物圈"
        >
        <video
          v-show="!isPicture"
          ref="videoRef"
          :src="videoUrl"

          preload="auto" controls h-full
          w-full
        />
      </el-dialog>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-upload-list) {
  flex-wrap: nowrap;
  .el-upload,
  .el-upload-list__item {
    width: 6rem;
    height: 6rem;
  }
}

.upload-video {
  :deep(.el-upload-list__item) {
    position: absolute;
    z-index: 1;
  }
}

:deep(.el-upload-list__item .el-progress) {
  width: auto;
}
</style>
