<script lang="ts" setup>
const {
  modelValue,
  callType,
} = defineProps<{
  modelValue: boolean,
  callType: CallTypeEnum | null | undefined,
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "update:callType", value: CallTypeEnum): void
}>();
const setting = useSettingStore();
const chat = useChatStore();
const user = useUserStore();
// 从useWebRTC获取状态和方法
const {
  rtcStatus,
  isRtcConnecting,
  callDuration,
  isSender,
  theContact,
  // peerConnection,
  // channel,
  // 设备相关
  audioDevices,
  selectedAudioDevice,
  selectedVideoDevice,
  videoDevices,

  // 状态相关
  connectionStatus,
  localStream,
  remoteStream,

  // 方法
  endCall,
  toggleMute,
  toggleVideo,
  switchAudioDevice,
  switchVideoDevice,
} = chat.useChatWebRTC();
enum MaxVideoObjEnum {
  CONTAIN = "object-contain",
  COVER = "object-cover",
  FILL = "object-fill",
}
const maxVideoObjMap = {
  [MaxVideoObjEnum.CONTAIN]: {
    className: MaxVideoObjEnum.CONTAIN,
    detailText: "原始比例",
  },
  [MaxVideoObjEnum.COVER]: {
    className: MaxVideoObjEnum.COVER,
    detailText: "全面屏",
  },
  [MaxVideoObjEnum.FILL]: {
    className: MaxVideoObjEnum.FILL,
    detailText: "拉伸",
  },
};

// 通话状态
const isConnected = computed(() => connectionStatus.value === CallStatusEnum.ACCEPT || rtcStatus.value === "connected");
const isConnectClose = computed(() => [undefined, CallStatusEnum.END, CallStatusEnum.CANCEL, CallStatusEnum.REJECT, CallStatusEnum.BUSY, CallStatusEnum.ERROR].includes(connectionStatus.value));

// 设置
// @unocss-include
const isMaxVideoClass = ref<MaxVideoObjEnum>(MaxVideoObjEnum.CONTAIN); // 最大化视频
const isSelfMinView = ref(false); // 切换视频流
const minWindStream = computed(() => callType === CallTypeEnum.VIDEO ? isSelfMinView.value ? localStream.value : remoteStream.value : null); // 小窗口的视频流
const maxWindStream = computed(() => callType === CallTypeEnum.VIDEO ? (!isSelfMinView.value ? localStream.value : remoteStream.value) : remoteStream.value); // 大窗口的视频流
const audioVolume = ref(1); // 最小音量 默认扬声器音量
const minWindStreamProps = computed(() => ({ muted: !isSelfMinView.value, volume: !isSelfMinView.value ? 0 : audioVolume.value })); // 非本人视频静音
const maxWindStreamProps = computed(() => ({ muted: isSelfMinView.value, volume: isSelfMinView.value ? 0 : audioVolume.value }));// 本人视频静音
const isMinWind = ref(false); // 最小化

// 拖拽
const dragRef = ref<HTMLDivElement>();
const dragRefStyle = ref({
  maxWidth: 0,
  maxHeight: 0,
});
const disableDrag = computed(() => setting.isMobileSize && !isMinWind.value);
const { x, y, style } = useDraggable(dragRef, {
  disabled: disableDrag,
  stopPropagation: true,
  onMove: (position) => {
    const { innerWidth, innerHeight } = window;
    // 限制不移出屏幕边缘
    const newX = Math.min(Math.max(position.x, 0), innerWidth - (dragRef?.value?.offsetWidth || 0));
    const newY = Math.min(Math.max(position.y, 0), innerHeight - (dragRef?.value?.offsetHeight || 0));
    if (dragRef.value) {
      if (newX <= 20 || newY <= 20) {
        //
      }
      else if (newX >= innerWidth - (dragRefStyle.value.maxWidth || dragRef.value.offsetWidth) || newY >= innerHeight - (dragRefStyle.value.maxHeight || dragRef.value.offsetHeight)) {
        if (!isMinWind.value) {
          dragRefStyle.value.maxWidth = Math.max(dragRef.value.offsetWidth, dragRefStyle.value.maxWidth);
          dragRefStyle.value.maxHeight = Math.max(dragRef.value.offsetHeight, dragRefStyle.value.maxHeight);
          isMinWind.value = true;
        }
      }
      position.x = newX;
      position.y = newY;
    }
  },
  onEnd: (position) => {
    const { innerWidth, innerHeight } = window;
    // 限制不移出屏幕边缘
    const newX = Math.min(Math.max(position.x, 0), innerWidth - (dragRef?.value?.offsetWidth || 0));
    const newY = Math.min(Math.max(position.y, 0), innerHeight - (dragRef?.value?.offsetHeight || 0));
    if (dragRef.value) {
      if (setting.isMobileSize) {
        isMinWind.value = true;
      }
      else if (newX <= 40 || newY <= 40) {
        isMinWind.value = true;
      }
      else if (newX >= (innerWidth - dragRef.value.offsetWidth - 40) || newY >= (innerHeight - dragRef.value.offsetHeight - 40)) {
        isMinWind.value = true;
      }
      else {
        isMinWind.value = false;
      }
    }
  },
});
watch(() => setting.isMobileSize, (val) => {
  if (val) {
    y.value = 0;
    x.value = 0;
  }
});

// 格式化通话时长
const formattedDuration = computed(() => {
  if (!callDuration.value) {
    return "连接中...";
  }
  const minutes = Math.floor(callDuration.value / 60);
  const seconds = callDuration.value % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});
const rtcCallTextMap = {
  undefined: "",
  [CallStatusEnum.CALLING]: "正在呼叫...",
  [CallStatusEnum.ACCEPT]: "通话中",
  [CallStatusEnum.END]: "通话结束",

  [CallStatusEnum.REJECT]: "对方拒绝了呼叫",
  [CallStatusEnum.CANCEL]: "对方取消了呼叫",
  [CallStatusEnum.BUSY]: "对方无应答",
  [CallStatusEnum.ERROR]: "通话错误中断",
};
const rtcDescText = computed(() => {
  if (isConnected.value) {
    return `通话时长 ${formattedDuration.value}`;
  }
  else if (isRtcConnecting.value) {
    return "正在连接中...";
  }
  else if (connectionStatus.value === CallStatusEnum.CALLING) {
    return isSender ? "正在呼叫..." : "待接听...";
  }
  else {
    return rtcCallTextMap[connectionStatus.value || "undefined"];
  }
});

// 显示状态
const show = computed({
  get() {
    return modelValue;
  },
  set(val) {
    emit("update:modelValue", val);
  },
});
watch(() => modelValue, (val) => {
  if (val) {
    nextTick(() => {
      if (dragRef.value) {
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = dragRef.value;
        const newX = (innerWidth - offsetWidth) / 2;
        const newY = (innerHeight - offsetHeight) / 2;
        x.value = newX;
        y.value = newY;
      }
    });
  }
}, { immediate: true });

function clearAll() {
  show.value = false;
  isSelfMinView.value = false;
  isMinWind.value = false;
  // isMaxVideoClass.value = MaxVideoObjEnum.CONTAIN;
  // audioVolume.value = 1;
}

watch(isConnectClose, (val) => {
  if (val) {
    setTimeout(() => {
      clearAll();
    }, 400);
  }
});
// 结束通话
function endCallFn() {
  endCall(CallStatusEnum.END);
  show.value = false;
}

// 关闭拦截
function closeDialog() {
  ElMessageBox.confirm("是否关闭当前通话？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then((action) => {
    action === "confirm" && endCallFn();
  }).catch(() => {
  });
}

function onDblClickWindow() {
  if (setting.isMobileSize) {
    x.value = 0;
    y.value = 0;
    isMinWind.value = false;
  }
}
defineExpose({
  connectionStatus,
  localStream,
  remoteStream,
  endCallFn,
});
</script>

<template>
  <div
    v-if="show" ref="dragRef" style="overflow: hidden; --el-dialog-padding-primary: 0;"
    class="rtc-dialog rounded-dialog fixed z-1099 h-fit w-fit select-none border-(1px #2d2d2d solid) bg-dark sm:(h-fit w-340px)"
    :style="style" :class="{
      'is-mini active:cursor-move': isMinWind,
      'is-mobile-mini  cursor-pointer hover:shadow-lg': setting.isMobileSize && isMinWind,
    }"
  >
    <!-- 主内容 -->
    <div
      class="rounded-dialog relative z-2 h-full flex flex-col items-center gap-4 text-light shadow-lg"
      :class="{ 'bg-dark-6 bg-op-60 backdrop-blur': callType === CallTypeEnum.AUDIO || !isConnected }"
      @dblclick.stop="onDblClickWindow"
    >
      <!-- 头部 -->
      <h4
        class="menu w-full flex cursor-move items-center p-4"
        :class="{ 'bg-linear': callType === CallTypeEnum.VIDEO && isConnected }"
      >
        <span v-if="!isConnected" mx-a>
          {{ callType === CallTypeEnum.AUDIO ? '语音通话' : '视频通话' }}
        </span>
        <template v-else>
          <!-- 视频比例控制 -->
          <el-dropdown trigger="hover">
            <i
              :class="isMaxVideoClass === MaxVideoObjEnum.COVER ? 'i-tabler:maximize' : 'i-tabler:minimize'"
              :title="isMaxVideoClass ? '视频还原' : '视频最大化'" p-2.6 btn-primary
              @click.capture="isMaxVideoClass = isMaxVideoClass === MaxVideoObjEnum.CONTAIN ? MaxVideoObjEnum.COVER : MaxVideoObjEnum.CONTAIN"
            />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in Object.values(maxVideoObjMap)" :key="option.detailText"
                  @click.capture="isMaxVideoClass = option.className"
                >
                  <i v-if="isMaxVideoClass === option.className" class="i-solar:check-circle-bold mr-2" />
                  {{ option.detailText }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span mx-a>
            {{ rtcDescText }}
          </span>
          <i i-carbon:subtract p-3 btn-primary title="缩小" @click.capture="isMinWind = true" />
          <i i-carbon:close ml-2 p-3 btn-danger title="关闭" @click.capture="closeDialog" />
        </template>
      </h4>
      <div
        class="menu-mini hidden w-full p-2 text-center text-sm"
        :class="{ 'bg-linear': callType === CallTypeEnum.VIDEO && isConnected }"
      >
        {{ rtcDescText }}
      </div>
      <!-- 中间 头像和状态区域 -->
      <div class="avatar-box my-a flex flex-col items-center truncate">
        <!-- 远程视频/头像显示 -->
        <div v-if="callType === CallTypeEnum.AUDIO || !remoteStream?.getVideoTracks()[0]?.enabled" class="relative flex-row-c-c flex-col">
          <CardElImage
            :src="BaseUrlImg + theContact.avatar"
            class="avatar mx-a h-20 w-20 select-none rounded-full shadow-lg border-default-hover"
          />
          <div class="username mt-4 text-center text-lg font-medium">
            {{ theContact.name }}
          </div>
        </div>
        <div v-if="!isConnected" class="rtc-desc mt-2 text-center text-sm">
          {{ rtcDescText }}
        </div>
      </div>
      <!-- 控制按钮区域 -->
      <div
        v-if="connectionStatus !== undefined"
        class="btns mt-a max-w-22em flex flex-wrap items-center justify-center gap-col-8 gap-row-6 px-12 py-6 sm:(gap-col-6 gap-row-6)"
      >
        <!-- 接听者的接听/拒绝按钮 -->
        <template v-if="!isSender && connectionStatus === CallStatusEnum.CALLING">
          <!-- 接听按钮 -->
          <el-button
            style="width: 3.2rem;height: 3.2rem;margin: 0;" type="success" circle size="large"
            @click.capture="chat.confirmRtcFn.confirmCall()"
          >
            <i class="i-solar:phone-calling-bold mt-1 p-3.5" />
          </el-button>
          <!-- 拒绝按钮 -->
          <el-button
            style="width: 3.2rem;height: 3.2rem;margin: 0;" type="danger" circle size="large" title="挂断"
            @click.capture="chat.confirmRtcFn.rejectCall()"
          >
            <i class="i-solar:end-call-bold mt-1 rotate-4 transform p-3.5" />
          </el-button>
        </template>

        <!-- 控制按钮 -->
        <template v-else-if="isSender || connectionStatus === CallStatusEnum.ACCEPT">
          <!-- 麦克风控制 -->
          <el-dropdown trigger="hover">
            <button
              type="button"
              style="width: 3.2rem;height: 3.2rem;margin: 0;"
              class="cursor-pointer rounded-full border-none shadow-sm hover:op-80"
              :class="localStream?.getAudioTracks()[0]?.enabled ? '!bg-light !text-dark' : '!text-light !bg-[#222d2b60] '"
              :plain="localStream?.getAudioTracks()[0]?.enabled ? false : true" size="large" @click.capture="toggleMute"
            >
              <i class="i-solar:microphone-3-bold p-3.5" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="device in audioDevices.filter(d => d.kind === 'audioinput') || []"
                  :key="device.deviceId" @click.capture="switchAudioDevice(device.deviceId)"
                >
                  <i v-if="device.deviceId === selectedAudioDevice" class="i-solar:check-circle-bold mr-2" />
                  {{ device.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 结束通话 -->
          <el-button
            style="width: 3.2rem;height: 3.2rem;margin: 0;" type="danger"
            :style="{ order: callType === CallTypeEnum.VIDEO ? 4 : 1 }" circle size="large" title="挂断"
            @click.capture="endCallFn"
          >
            <i class="i-solar:end-call-broken p-3.5" />
          </el-button>
          <!-- 扬声器控制 -->
          <el-dropdown trigger="hover" style="order: 2">
            <el-button
              style="order: 2; width: 3.2rem;height: 3.2rem;margin: 0;" type="info" circle size="large"
              title="点击快速切换音量" :plain="audioVolume < 0.5" @click="audioVolume = audioVolume === 0 ? 1 : 0"
            >
              <i
                class="p-3.5"
                :class="audioVolume === 0 ? 'i-solar:volume-cross-bold-duotone' : audioVolume < 0.5 ? 'i-solar:volume-loud-bold-duotone' : 'i-solar:volume-loud-bold '"
              />
            </el-button>
            <template #dropdown>
              <div class="w-fit flex-row-c-c py-2 pl-4 pr-8">
                音量：
                <el-slider
                  v-model.lazy="audioVolume" style="width: 12em;" :min="0" :max="1" :step="0.1"
                  :format-tooltip="(val) => `${val * 100}%`"
                />
              </div>
            </template>
          </el-dropdown>
          <!-- 视频控制 -->
          <el-dropdown v-if="callType === CallTypeEnum.VIDEO" trigger="hover" style="order: 3">
            <button
              type="button" circle style="width: 3.2rem;height: 3.2rem;margin: 0;transition: none;"
              class="cursor-pointer rounded-full border-none shadow-sm hover:op-80"
              :class="localStream?.getVideoTracks()[0]?.enabled ? 'bg-light text-dark' : 'text-light bg-[#222d2b60] '"
              :plain="localStream?.getVideoTracks()[0]?.enabled ? false : true" size="large" @click="toggleVideo"
            >
              <i class="i-solar:camera-bold p-3.5" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="device in videoDevices" :key="device.deviceId"
                  @click="switchVideoDevice(device.deviceId)"
                >
                  <i v-if="device.deviceId === selectedVideoDevice" class="i-solar:check-circle-bold mr-2" />
                  {{ device.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
      <!-- 控制按钮区域 mini -->
      <div
        v-if="connectionStatus !== undefined && isMinWind"
        class="btns-mini bottom-4 left-0 mx-a w-full flex items-center justify-around px-4 !absolute"
      >
        <!-- 接听者的接听/拒绝按钮 -->
        <template v-if="!isSender && connectionStatus === CallStatusEnum.CALLING">
          <!-- 接听按钮 -->
          <el-button
            style="width: 2.2rem;height: 2.2rem;margin: 0;" type="success" circle size="large" class="shadow"
            @click="chat.confirmRtcFn.confirmCall()"
          >
            <i class="i-solar:phone-calling-bold mt-1 p-2.8" />
          </el-button>
          <!-- 拒绝按钮 -->
          <el-button
            style="width: 2.2rem;height: 2.2rem;margin: 0;" type="danger" circle size="large" class="shadow"
            title="挂断" @click="chat.confirmRtcFn.rejectCall()"
          >
            <i class="i-solar:end-call-bold mt-1 rotate-4 transform p-2.8" />
          </el-button>
        </template>
        <!-- 控制按钮 -->
        <template v-else-if="isSender || connectionStatus === CallStatusEnum.ACCEPT">
          <!-- 结束通话 -->
          <el-button
            style="width: 2.2rem;height: 2.2rem;margin: 0;" type="danger"
            :style="{ order: callType === CallTypeEnum.VIDEO ? 4 : 1 }" circle size="large" class="shadow" title="挂断"
            @click="endCallFn"
          >
            <i class="i-solar:end-call-broken p-2.8" />
          </el-button>
        </template>
      </div>
      <!-- 本地视频小窗口 -->
      <div v-if="callType === CallTypeEnum.VIDEO" class="min-wind-stream absolute right-4 top-12">
        <video
          v-show="minWindStream?.getVideoTracks()[0]?.enabled" :srcObject="minWindStream" autoplay
          :controls="false" title="点击切换" v-bind="minWindStreamProps"
          class="h-24 w-16 cursor-pointer object-cover card-default-br border-default-hover"
          @click="isSelfMinView = !isSelfMinView"
        />
        <CardElImage
          v-show="!minWindStream?.getVideoTracks()[0]?.enabled" title="点击切换"
          :src="isSelfMinView ? BaseUrlImg + user.userInfo.avatar : BaseUrlImg + theContact.avatar"
          class="h-24 w-16 cursor-pointer select-none object-cover border-default card-default-br"
          @click="isSelfMinView = !isSelfMinView"
        />
      </div>
    </div>
    <!-- 视频区域和背景区域 -->
    <div class="rounded-dialog bg absolute left-0 top-0 z-0 h-full w-full overflow-hidden truncate">
      <video
        v-show="callType === CallTypeEnum.VIDEO && maxWindStream?.getVideoTracks()[0]?.enabled"
        :srcObject="maxWindStream" autoplay :class="isMaxVideoClass" :controls="false" v-bind="maxWindStreamProps"
        class="absolute left-0 top-0 mx-a h-full w-full"
      />
      <CardElImage
        v-show="!maxWindStream?.getVideoTracks()[0]?.enabled"
        :src="!isSelfMinView ? BaseUrlImg + user.userInfo.avatar : BaseUrlImg + theContact.avatar"
        class="absolute left-0 top-0 mx-a h-full w-full select-none filter-blur"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-linear {
  background: linear-gradient(to bottom, rgba(20, 20, 20, 1), rgba(20, 20, 20, 0.7), rgba(20, 20, 20, 0));
}
// .btns {
//   // --el-button-hover-text-color: #fff !important;
//   // :deep(.el-button) {
//   //   // &:hover {
//   //   //   // background-color: none;
//   //   // }
//   // }
// }

.rtc-dialog {
  transition: width 0.2s, height 0.2s ease, transform 0.2s;
  height: 56vh;
}

.btns-mini {
  display: none;
}

.rounded-dialog {
  border-radius: 0.6rem;
}

.rtc-dialog {
  &.is-mini {
    width: 10rem;
    height: 14rem;

    .menu,
    .min-wind-stream,
    .rtc-desc,
    .btns {
      display: none;
    }

    .avatar {
      width: 4rem;
      height: 4rem;
    }

    .avatar-box {
      margin: auto 0 !important;
    }

    .username {
      font-size: 0.9rem;
    }

    .menu-mini {
      display: block !important;
    }

    .btns-mini {
      display: flex;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover {
      .btns-mini {
        opacity: 1;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .rtc-dialog {
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    &.rounded-dialog {
      border-radius: 0;
      border: none;
    }
  }
  .rtc-dialog.is-mobile-mini {
    width: 10rem;
    height: 14rem;
    .menu,
    .min-wind-stream,
    .rtc-desc,
    .btns {
      display: none;
    }
    &.rounded-dialog {
      border-radius: 0.6rem !important;
      border: 1px solid #2d2d2d;
    }
    .avatar {
      width: 4rem;
      height: 4rem;
    }

    .avatar-box {
      margin: auto 0 !important;
    }

    .username {
      font-size: 0.9rem;
    }

    .menu-mini {
      display: block !important;
    }
    .btns-mini {
      opacity: 1;
    }
  }
}
</style>
