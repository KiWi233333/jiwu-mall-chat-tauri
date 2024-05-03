<script lang="ts" setup>
import * as qiniu from "qiniu-js";
import { OssFileType, deleteOssFile, getOssErrorCode, getResToken, uploadOssFileSe } from "@/composables/api/res";

const props = withDefaults(
  defineProps<{
    modelValue?: string
    pathList?: string[]
    uploadImage?: boolean
    autoSave?: boolean
  }>(),
  {
    modelValue: "",
    uploadImage: false,
    autoSave: false,
  },
);
const emit = defineEmits(["update:modelValue", "update:pathList", "submit"]);

const preIamgePath = "https://api.jiwu.kiwi2333.top/res/";
const user = useUserStore();
const rawPathList = ref<string[]>([]);

/**
 * 详情信息-图片上传
 */
function onUploadDescImage(e: Event, insertImage: (obj: object) => void, files: File[]) {
  files.forEach(async (p) => {
    if (!p)
      return;
    // 1、获取凭证
    const res = await getResToken(OssFileType.IMAGE, user.getToken);
    // 2、上传
    if (res.code === StatusCode.SUCCESS) {
      qiniu.compressImage(p, { // 压缩
        quality: 0.6,
        noCompressIfLarger: true,
      }).then((d) => {
        // 2）上传 监视器
        qiniuUpload(d.dist as File, res.data.key, res.data.uploadToken, () => {
        // 3、插入markdown
          insertImage({
            url: `${preIamgePath}${res.data.key}`,
            desc: p.name,
            width: "100%",
          });
          // 添加上传文件
          rawPathList.value.push(res.data.key);

          // 自动保存
          if (props.autoSave)
            onSave();
          emit("update:pathList", rawPathList.value);
        });
      });
    }
    else {
      ElMessage.warning("网络错误，请稍后再试！");
    }
  });
}
// 封装上传处理
function qiniuUpload(file: File, key: string, token: string, callback: () => void) {
  const observable = uploadOssFileSe(file, key, token);
  observable.subscribe({
    next() {
    },
    error(e) {
      const err = e as any;
      if (err?.code)
        ElMessage.error(getOssErrorCode(err?.code));

      else ElMessage.error("上传失败，稍后再试！");
    },
    complete() {
      callback && callback();
    },
  });
}
// 加载
const isDescLoading = ref(false);

const valueModel = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit("update:modelValue", val);
  },
});


/**
 * 文件删除
 */
function onClickDescImage(images: string, currentIndex: number) {
  if (isDescLoading.value)
    return;

  if (images[currentIndex]) {
    ElMessageBox.confirm("是否删除该图片？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      lockScroll: false,
      center: true,
      callback: async (res: string) => {
        if (res === "confirm") {
          const res = await deleteOssFile(images[currentIndex]?.replace(preIamgePath, ""), user.getToken);
          isDescLoading.value = true;
          const regex = new RegExp(`!\\[.*?\\]\\((${images[currentIndex]})\\){{{width="100%"}}}`);
          // 删除输入框插入的图片
          rawPathList.value.splice(rawPathList.value.findIndex(p => p === images[currentIndex]), 1);
          emit("update:modelValue", props.modelValue.replace(regex, ""));
          emit("update:pathList", rawPathList.value);
          if (res.code === StatusCode.SUCCESS) {
            ElNotification.success({
              title: "删除提示",
              message: "删除成功！",
            });
          }
          else {
            ElNotification.closeAll();
            ElMessage.closeAll("error");
          }
          setTimeout(() => {
            // false
            isDescLoading.value = false;
            // 自动保存
            if (props.autoSave)
              onSave();
          }, 300);
        }
      },
    });
  }
}

/**
 * 保存
 */
function onSave() {
  if (isDescLoading.value)
    return;

  isDescLoading.value = true;
  emit("submit", props.modelValue);
  setTimeout(() => {
    isDescLoading.value = false;
  }, 300);
}

defineExpose({
  pathList: () => rawPathList.value,
});
</script>

<template>
  <v-md-editor
    v-bind="$attrs"
    v-model="valueModel"
    v-loading="isDescLoading"
    placeholder="请输入详情"
    :toc-nav-position-right="true"
    height="60vh"
    :disabled-menus="[]"
    :include-level="[2, 3, 4, 5]"
    left-toolbar="undo redo clear | italic strikethrough quote | ul ol table hr | link image code | save"
    @save="onSave"
    @upload-image="onUploadDescImage"
    @image-click="onClickDescImage"
  />
</template>

<style lang="scss" scoped>
.v-md-editor {
    box-shadow: none;
  }
</style>
