import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

interface RtcMsgVO {
  roomId: number;
  callType: CallTypeEnum;
  senderId: string;
  [key: string]: any;
}
const TURN_SERVER = import.meta.env.VITE_TURN_SERVER_URL;
const MAX_TIME_OUT_SECONDS = 30; // 拨打 超时时间
/**
 * 使用webRtc通话
 *
 * @returns 返回webRtc相关状态和方法
 */
export function useWebRTC(openDialog: (type: CallTypeEnum, { confirmCall, rejectCall }: { confirmCall: () => void, rejectCall: () => void }) => void) {
  const user = useUserStore();
  const chat = useChatStore();
  const setting = useSettingStore();
  const ws = useWs();
  const rtcMsg = ref<Partial<RtcMsgVO>>({
    roomId: undefined,
    callType: undefined,
    senderId: undefined,
  });

  const theContact = ref<Partial<ChatContactVO>>({
    activeTime: undefined,
    avatar: undefined,
    roomId: undefined,
    hotFlag: undefined,
    name: undefined,
    text: undefined,
    type: undefined,
    selfExit: undefined,
    unreadCount: undefined,
    roomGroup: undefined,
    member: undefined,
  });

  // 设备相关状态
  const audioDevices = ref<MediaDeviceInfo[]>([]);
  const videoDevices = ref<MediaDeviceInfo[]>([]);
  const selectedAudioDevice = ref<string | null>(null);
  const selectedVideoDevice = ref<string | null>(null);
  // 状态
  const connectionStatus = ref<CallStatusEnum | undefined>(undefined);
  const isSender = computed(() => rtcMsg.value.senderId === user.userId);

  // rtc状态
  const rtcStatus = ref<RTCPeerConnectionState | undefined>(undefined);
  const isRtcConnecting = computed(() => rtcStatus.value === "connecting");
  // 流相关状态
  const localStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null | undefined>(null);

  // WebRTC 连接对象
  const peerConnection = ref<RTCPeerConnection | null>(null);
  const channel = ref<RTCDataChannel | null>(null);
  const channelStatus = ref<RTCDataChannelState | undefined>(undefined);
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
    ],
  };
  // 待发送ice列表
  const pendingCandidates = ref<RTCIceCandidate[]>([]);

  if (TURN_SERVER && configuration.iceServers) {
    configuration.iceServers.push({
      urls: TURN_SERVER,
      username: import.meta.env.VITE_TURN_SERVER_USER,
      credential: import.meta.env.VITE_TURN_SERVER_PWD,
    });
  }

  // 添加铃声相关状态
  const bellAudio = ref<HTMLAudioElement | null>(null);
  const isOpenBell = computed({
    get: () => bellAudio.value?.played,
    set: (value: boolean) => {
      if (value)
        bellAudio.value?.play();
      else
        bellAudio.value?.pause();
    },
  });

  // 添加计时器引用
  const callTimer = ref<NodeJS.Timeout | null>(null);

  // 添加计时相关的变量
  const callDuration = ref(0);
  const durationTimer = ref<any>(null);

  function handleContactInfo(roomId: number) {
    if (chat.contactMap[roomId]) {
      theContact.value = chat.contactMap[roomId];
    }
    else { // 房间信息不存在，请求接口获取
      getChatContactInfo(roomId, user.getToken)?.then((res) => {
        if (res.code === StatusCode.SUCCESS) {
          if (chat.contactMap[roomId]) { // 更新
            chat.contactMap[roomId] = res.data;
          }
          else {
            chat.getContactList.unshift(res.data as ChatContactVO); // 追加前置
          }
        }
      }).catch(() => {
      });
    }
  }

  /**
   * 结束通话
   * @param status 通话状态
   * @returns Promise<boolean> 成功返回 true，失败返回 false
   */
  const endCall = async (status: CallStatusEnum | undefined = CallStatusEnum.ERROR) => {
    try {
      if (!rtcMsg.value.roomId) {
        clear();
        return true;
      }
      // console.log("结束通话 : ", rtcMsg.value.roomId, status);
      if ([CallStatusEnum.END].includes(status)) {
        const res = await hangUpRTCCall(rtcMsg.value.roomId, user.getToken);
        if (res.code !== StatusCode.SUCCESS) {
          return false;
        }
      }
      else if (status !== undefined) { // 更新通话状态
        const res = await updateChatRTCMessage(rtcMsg.value.roomId, {
          status,
          signalType: SignalTypeEnum.LEAVE,
        }, user.getToken);
        if (res.code !== StatusCode.SUCCESS) {
          return false;
        }
      }
      clear();
      return true;
    }
    catch (err) {
      clear();
      console.error("结束通话失败:", err);
    }
  };


  /**
   * 通话消息
   */
  watch(() => ws.wsMsgList.rtcMsg.length, (val) => {
  // 通话消息 type=1
    if (val) {
      // 遍历所有消息
      ws.wsMsgList.rtcMsg.forEach((msg) => {
        msg = msg ? JSON.parse(JSON.stringify(msg)) : null;
        if (msg) {
          connectionStatus.value = msg.status;
          switch (msg.signalType) {
            case SignalTypeEnum.OFFER:
              // 收到offer信令
              if (msg.senderId !== user.userId) {
                handleOffer(msg);
              }
              break;
            case SignalTypeEnum.ANSWER:
              handleAnswer(msg);
              break;
            case SignalTypeEnum.CANDIDATE:
              // 收到candidate信令
              handleCandidate(msg);
              break;
            case SignalTypeEnum.LEAVE:
              clear();
              break;
            default:
              break;
          }
        }
      });
      ws.wsMsgList.rtcMsg.splice(0); // 清空消息列表
    }
  }, {
    immediate: false,
  });

  // 获取设备列表
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      audioDevices.value = devices.filter(device => device.kind === "audioinput");
      videoDevices.value = devices.filter(device => device.kind === "videoinput");
      // console.log(audioDevices.value, videoDevices.value);

      // 默认选择第一个设备
      if (audioDevices.value.length > 0 && !selectedAudioDevice.value && audioDevices.value?.[0]?.deviceId)
        selectedAudioDevice.value = audioDevices.value[0].deviceId;
      if (videoDevices.value.length > 0 && !selectedVideoDevice.value && videoDevices.value?.[0]?.deviceId)
        selectedVideoDevice.value = videoDevices.value[0].deviceId;
      return true;
    }
    catch (err) {
      ElMessage.error("获取设备失败!");
      console.error("获取设备失败:", err);
      // connectionStatus.value = CallStatusEnum.ERROR;
      // 默认没有设备
      selectedAudioDevice.value = selectedAudioDevice.value || null;
      selectedVideoDevice.value = selectedVideoDevice.value || null;
      return false;
    }
  };

  // 获取本地媒体流
  const getLocalStream = async (type: CallTypeEnum) => {
    try {
      const constraints = {
        audio: audioDevices.value.length > 0
          ? { deviceId: selectedAudioDevice.value || undefined }
          : false,
        video: type === CallTypeEnum.VIDEO && videoDevices.value.length > 0
          ? { deviceId: selectedVideoDevice.value || undefined }
          : false,
      };
      if (!constraints.audio && !constraints.video) {
        ElMessage.error("没有可用的设备!");
        return null;
      }

      localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
      return localStream.value;
    }
    catch (err) {
      console.warn("获取本地流失败:", err);
      ElMessage.error("获取本地媒体流失败，请检查设备!");
      return false;
    }
  };


  // 创建 RTCPeerConnection
  const createPeerConnection = (roomId: number) => {
    try {
      const pc = new RTCPeerConnection(configuration);

      // 监听远程流
      pc.ontrack = (event) => {
        if (event.streams[0]) {
          remoteStream.value = event.streams[0];
        }
        else {
          remoteStream.value = null;
        }
      };

      // 添加本地流
      localStream.value?.getTracks().forEach((track) => {
        localStream.value && pc.addTrack(track, localStream.value);
      });

      // 连接状态变化 "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new";
      pc.onconnectionstatechange = (e) => {
        // console.log("RTC 连接状态变化: ", pc.connectionState);
        switch (pc.connectionState) {
          case "new":
            break;
          case "connecting":
            connectionStatus.value = CallStatusEnum.CALLING;
            break;
          case "connected":
            connectionStatus.value = CallStatusEnum.ACCEPT;
            // 开始计时
            callDuration.value = 0;
            durationTimer.value = setInterval(() => {
              callDuration.value++;
            }, 1000);
            // console.log("RTC 连接成功", CallStatusEnum.ACCEPT);
            updateChatRTCMessage(roomId, {
              status: CallStatusEnum.ACCEPT,
            }, user.getToken);
            break;
          case "disconnected":
            connectionStatus.value = CallStatusEnum.END;
            ElMessage.error("RTC通讯连接失败!");
            setTimeout(async () => {
              await endCall(CallStatusEnum.ERROR);
              ElMessage.closeAll();
            }, 500);
            break;
          case "closed":
            connectionStatus.value = CallStatusEnum.END;
            setTimeout(async () => {
              await endCall(CallStatusEnum.END);
              ElMessage.closeAll();
            }, 500);
            break;
          case "failed":
            connectionStatus.value = CallStatusEnum.ERROR;
            ElMessage.error("RTC通讯连接失败!");
            setTimeout(async () => {
              await endCall(CallStatusEnum.ERROR);
              ElMessage.closeAll();
            }, 500);
            break;
          default:
            break;
        }
        // @ts-expect-error
        rtcStatus.value = (e?.currentTarget?.connectionState || pc.connectionState) as RTCPeerConnectionState;
      };
      // 创建信道
      channel.value = pc.createDataChannel("chat");
      channel.value.onopen = () => {
        // console.log("信道已打开");
      };
      channel.value.onmessage = (event) => {
        // console.log("收到消息:", event.data);
      };
      channel.value.onerror = (event) => {
        console.error("信道出错:", event);
      };
      channel.value.onclose = () => {
        // console.log("信道已关闭");
      };
      pc.onicecandidate = async (event) => {
        if (event.candidate && roomId) {
          try {
            pendingCandidates.value.push(event.candidate);
          }
          catch (err) {
            console.error("发送ICE候选者出错:", err);
          }
        }
      };
      peerConnection.value = pc;
      return pc;
    }
    catch (err) {
      console.error("创建 PeerConnection 失败:", err);
      connectionStatus.value = CallStatusEnum.REJECT;
      throw err;
    }
  };

  // 发起通话
  const startCall = async (roomId: number, type: CallTypeEnum, uidList?: string[]) => {
    try {
      if (!roomId) {
        return false;
      }
      clear(); // 清理资源
      await getDevices();

      // 保存通话信息
      rtcMsg.value = {
        roomId,
        callType: type,
        senderId: user.userId,
        uidList: uidList || [],
      };

      // 填充房间信息 @unocss-include
      handleContactInfo(roomId);
      const loading = ElLoading.service({
        lock: true,
        text: "正在获取设备...",
        background: "rgba(0, 0, 0, 0.1)",
        customClass: "backdrop-blur",
      });
      // 设置30秒超时定时器
      callTimer.value = setTimeout(() => {
        if (connectionStatus.value === CallStatusEnum.CALLING) {
          ElMessage.warning("通话无人接听，自动挂断");
          endCall(CallStatusEnum.CANCEL);
        }
      }, MAX_TIME_OUT_SECONDS * 1000);

      if (!await getLocalStream(type)) {
        clear();
        loading.close();
        return false;
      }
      loading.close();

      // 1. 创建 RTCPeerConnection
      const pc = createPeerConnection(roomId);
      // 创建并发送 offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const res = await addChatRTCMessage(roomId, {
        callType: type,
        receiverIds: uidList,
        signalType: SignalTypeEnum.OFFER,
        data: offer,
      }, user.getToken);
      if (res.code !== StatusCode.SUCCESS) {
        return false;
      }
      else {
        const linkMsg = res?.data?.message?.body;
        if (linkMsg?.callId) {
          connectionStatus.value = CallStatusEnum.BUSY;
          ElMessage.closeAll();
          ElMessage.success("对方忙碌中...");
          return true;
        }
      }

      // 播放铃声
      bellAudio.value = new Audio("/sound/bell.mp3");
      bellAudio.value.loop = true;
      bellAudio.value.play();

      // 开始通话
      connectionStatus.value = CallStatusEnum.CALLING;
      rtcStatus.value = "new";
    }
    catch (err) {
      console.error("开始通话失败:", err);
      clear();
      return false;
    }
  };

  function clear() {
    try {
      // 停止铃声并重置
      if (bellAudio.value) {
        bellAudio.value.pause();
        bellAudio.value = null;
      }
      // 清除超时定时器
      if (callTimer.value) {
        clearTimeout(callTimer.value);
        callTimer.value = null;
      }
      // 停止计时器
      if (durationTimer.value) {
        clearInterval(durationTimer.value);
        durationTimer.value = null;
        callDuration.value = 0;
      }

      // 停止并关闭媒体流
      [localStream.value, remoteStream.value].forEach((stream) => {
        stream?.getTracks().forEach(track => track.stop());
      });

      // 重置状态
      rtcMsg.value = {
        roomId: undefined,
        callType: undefined,
        senderId: undefined,
      };
      pendingCandidates.value = [];
      audioDevices.value = [];
      videoDevices.value = [];
      selectedAudioDevice.value = null;
      selectedVideoDevice.value = null;

      localStream.value = null;
      remoteStream.value = null;
      connectionStatus.value = undefined;
      rtcStatus.value = undefined;
      // 关闭连接
      peerConnection.value?.close();
      peerConnection.value = null;
      channel.value?.close();
      channel.value = null;
      channelStatus.value = undefined;
    }
    catch (error) {
      console.error("清理资源失败:", error);
    }
  }

  // 监听 ICE 连接
  async function lisenIceCandidate(roomId: number) {
    if (!peerConnection.value) {
      return;
    }
    // 交换信令后，发送 ICE candidate 信令
    if (pendingCandidates.value.length > 0) {
      for (const candidate of pendingCandidates.value) {
        try {
          updateChatRTCMessage(roomId, {
            signalType: SignalTypeEnum.CANDIDATE,
            data: candidate,
          }, user.getToken).then(() => {
          });
        }
        catch (err) {
          console.error("发送ICE候选者出错:", err);
        }
      }
      pendingCandidates.value = [];
      peerConnection.value.onicecandidate = async (event) => {
        // console.log(user.userInfo.username, "接收端 - 收到 ICE candidate 信令:", event.candidate);
        if (event.candidate) {
          try {
            const res = await updateChatRTCMessage(roomId, {
              signalType: SignalTypeEnum.CANDIDATE,
              data: event.candidate,
            }, user.getToken);

            if (res.code !== StatusCode.SUCCESS) {
              console.error("发送ICE候选者失败:", res.message);
            }
          }
          catch (err) {
            console.error("发送ICE候选者出错:", err);
          }
        }
      };
    };
  }


  // 1. 处理收到的 offer - 接听者
  async function handleOffer({ data: offer, type, roomId }: WSRtcCallMsg) {
    try {
      connectionStatus.value = CallStatusEnum.CALLING;
      await nextTick();
      // 开启铃声
      bellAudio.value = new Audio("/sound/bell.mp3");
      bellAudio.value!.loop = true;
      bellAudio.value?.play();
      // tauri显示窗口
      if (setting.isDesktop) {
        const win = await WebviewWindow.getByLabel("main");
        if (!win)
          return;
        await win.unminimize();
        await win.show();
        await win.setFocus();
      }
      // 用户接受通话，继续原有流程
      await nextTick();
      await getDevices();
      await getLocalStream(type);

      // 等待用户确认接听
      const userConfirmed = await new Promise((resolve) => {
        // 添加确认和拒绝的方法
        const confirmCall = () => {
          resolve(true);
          connectionStatus.value = CallStatusEnum.ACCEPT;
          if (bellAudio.value) { // 停止铃声
            bellAudio.value.pause();
            bellAudio.value = null;
          }
        };
        const rejectCall = () => {
          resolve(false);
          connectionStatus.value = CallStatusEnum.REJECT;
          endCall(CallStatusEnum.REJECT);
        };
        // 获取房间信息
        handleContactInfo(roomId);
        openDialog(type, { confirmCall, rejectCall });

        // 30秒超时自动拒绝
        setTimeout(() => resolve(false), MAX_TIME_OUT_SECONDS * 1000);
      });

      if (!userConfirmed) {
        // 用户拒绝或超时
        await endCall(CallStatusEnum.REJECT);
        return false;
      }

      // 确认接听
      rtcMsg.value = {
        roomId,
        callType: type,
        senderId: offer.senderId,
      };


      // 2. 创建 RTCPeerConnection
      peerConnection.value = createPeerConnection(roomId);
      rtcStatus.value = "new";

      // 3. 设置远程描述
      await peerConnection.value.setRemoteDescription(offer);

      // 4. 创建并发送 answer
      const answer = await peerConnection.value.createAnswer();
      await peerConnection.value.setLocalDescription(answer);
      // console.log(`${user.userInfo.username}：发送 answer 信令:`, answer);
      // 监听 ICE 连接状态
      // 5. 监听 ICE candidate
      if (!roomId) {
        ElMessage.error("房间号不存在，请重新连接！");
        return false;
      }
      // 6. 发送 answer 信令到远端
      const res = await updateChatRTCMessage(roomId, {
        signalType: SignalTypeEnum.ANSWER,
        data: answer,
      }, user.getToken);
      if (res.code !== StatusCode.SUCCESS) {
        return false;
      }
      lisenIceCandidate(roomId);
      connectionStatus.value = CallStatusEnum.ACCEPT;
    }
    catch (error) {
      console.error("处理 offer 失败:", error);
      endCall();
    }
  }

  // 2. 处理收到的 answer 发起者 收到的回信
  async function handleAnswer({ data: answer, roomId }: WSRtcCallMsg) {
    try {
      if (peerConnection.value) {
        // 清除超时定时器
        if (callTimer.value) {
          clearTimeout(callTimer.value);
          callTimer.value = null;
        }
        // console.log(`${user.userInfo.username}收到 answer 信令:`, answer);

        // 2. 停止铃声
        if (bellAudio.value) {
          bellAudio.value.pause();
          bellAudio.value = null;
        }

        // 3. 通知服务器通话已建立
        if (isSender.value) {
          if (!roomId) {
            ElMessage.error("房间号不存在，请重新连接！");
            endCall();
            return;
          }
          // 4. 发起者 - 设置远程描述
          await peerConnection.value.setRemoteDescription(answer);

          lisenIceCandidate(roomId);
          //   // 5. 监听 ICE 连接状态
          //   peerConnection.value.onicecandidate = async (event) => {
          //     console.log(user.userInfo.username, "收到 ICE candidate 信令:", event.candidate);
          //     if (event.candidate && roomId) {
          //       try {
          //         const res = await updateChatRTCMessage(roomId, {
          //           signalType: SignalTypeEnum.CANDIDATE,
          //           data: event.candidate,
          //         }, user.getToken);

        //         if (res.code !== StatusCode.SUCCESS) {
        //           console.error("发送ICE候选者失败:", res.message);
        //         }
        //       }
        //       catch (err) {
        //         console.error("发送ICE候选者出错:", err);
        //       }
        //     }
        //   };
        }
      }
    }
    catch (error) {
      console.error("处理 answer 失败:", error);
      connectionStatus.value = CallStatusEnum.ERROR;
      endCall();
    }
  }
  // 3. 处理 ICE candidate
  async function handleCandidate({ data: candidate, roomId }: WSRtcCallMsg) {
    try {
      if (peerConnection.value && candidate && candidate.candidate) {
        // console.log("收到 candidate 信令:", candidate.candidate);
        await peerConnection.value.addIceCandidate(candidate);
      }
    }
    catch (error) {
      console.error("处理 candidate 失败:", error);
    }
  }

  /** ****************************功能函数 */
  // 切换静音
  function toggleMute() {
    if (localStream.value) {
      const audioTrack = localStream.value.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  // 切换音频设备
  async function switchAudioDevice(deviceId: string) {
    try {
      selectedAudioDevice.value = deviceId;
      if (localStream.value) {
        const newStream = await navigator?.mediaDevices?.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
          video: rtcMsg.value.callType === CallTypeEnum.VIDEO ? (selectedVideoDevice.value ? { deviceId: { exact: selectedVideoDevice.value || undefined } } : false) : false,
        });
        // 替换现有轨道
        const newAudioTrack = newStream.getAudioTracks()[0];
        const oldAudioTrack = localStream.value.getAudioTracks()[0];

        if (newAudioTrack) {
          if (!oldAudioTrack) {
            localStream.value.addTrack(newAudioTrack);
            peerConnection.value?.addTrack(newAudioTrack, localStream.value);
            return;
          }
          peerConnection.value?.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === "audio") {
              sender?.replaceTrack?.(newAudioTrack);
            }
          });
          oldAudioTrack && localStream.value.removeTrack(oldAudioTrack);
          localStream.value.addTrack(newAudioTrack);
        }
        else {
          ElMessage.error("切换设备不存在或不支持，请重新选择！");
        }
      }
    }
    catch (error) {
      ElMessage.error("切换音频设备失败！");
      console.error("切换音频设备失败:", error);
    }
  }

  // 切换视频设备
  async function switchVideoDevice(deviceId: string) {
    try {
      selectedVideoDevice.value = deviceId;
      if (localStream.value && localStream.value.getVideoTracks().length > 0) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDevice.value ? { deviceId: { exact: selectedAudioDevice.value || undefined } } : false,
          video: { deviceId: { exact: deviceId } },
        });

        // 替换现有轨道
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.value.getVideoTracks()[0];
        // console.log(oldVideoTrack, newVideoTrack);

        if (newVideoTrack) {
          if (!oldVideoTrack) {
            localStream.value.addTrack(newVideoTrack);
            peerConnection.value?.addTrack(newVideoTrack, localStream.value);
            return;
          }
          peerConnection.value?.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === "video") {
              sender.replaceTrack(newVideoTrack);
            }
          });
          oldVideoTrack && localStream.value.removeTrack(oldVideoTrack);
          localStream.value.addTrack(newVideoTrack);
        }
        else {
          ElMessage.error("切换设备不存在或不支持，请重新选择！");
        }
      }
    }
    catch (error) {
      ElMessage.error("切换视频设备失败！");
      console.error("切换视频设备失败:", error);
    }
  }

  // 切换视频开关
  function toggleVideo() {
    if (localStream.value) {
      const videoTrack = localStream.value.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  // 清理资源
  onUnmounted(() => {
    endCall();
  });
  onDeactivated(() => {
    endCall();
  });

  return {
    theContact,
    rtcMsg,
    isSender,
    isRtcConnecting,
    rtcStatus,
    callDuration, // 添加通话时长
    peerConnection,
    channel,

    // 设备相关
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,

    // 状态相关
    connectionStatus,
    localStream,
    remoteStream,
    isOpenBell,

    // 方法
    startCall,
    endCall,
    getDevices,
    toggleMute,
    switchAudioDevice,
    toggleVideo,
    switchVideoDevice,
  };
}
