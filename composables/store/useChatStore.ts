import type { ChatContactVO } from "../api/chat/contact";
import type { ChatMemberVO } from "../api/chat/room";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { acceptHMRUpdate, defineStore } from "pinia";

enum FriendOptType {
  Empty = -1,
  User = 0,
  NewFriend = 1,
  GroupFriend = 2,
}

export interface PlaySounder {
  state?: "play" | "pause" | "stop" | "loading" | "error"
  url?: string
  msgId?: number
  currentSecond?: number
  duration?: number
  audio?: HTMLAudioElement
}

export interface AtChatMemberOption {
  label: string
  value: string
  userId: string
  username: string
  nickName?: string
  avatar?: string
}

// @unocss-include
export const defaultLoadingIcon = `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12" opacity=".1"/><path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3"/></g></svg>`;
// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useChatStore = defineStore(
  "chat",
  () => {
    /** ***************************** 发送消息 */
    const msgForm = ref<ChatMessageDTO>({
      roomId: -1,
      msgType: MessageType.TEXT, // 默认
      content: undefined,
      body: {
      },
    });
    /** ***************************** 撤回的消息map */
    const recallMsgMap = ref<Record<number, ChatMessageVO>>({});
    /** ***************************** 会话 */
    const isOpenContact = ref(true);
    const contactMap = ref<Record<number, ChatContactVO>>({});
    const contactList = computed(() => Object.values(contactMap.value));
    const searchKeyWords = ref("");
    const getContactList = computed(() => {
      const contacts = Object.values(contactMap.value);
      const sortedContacts = contacts.sort((a, b) => {
        const pinDiff = (b.pinTime || 0) - (a.pinTime || 0);
        if (pinDiff !== 0)
          return pinDiff; // 如果 pinTime 不同，直接返回结果
        return b.activeTime - a.activeTime; // 否则按 activeTime 排序
      });
      if (searchKeyWords.value) {
        const lowerCaseSearchKey = searchKeyWords.value.toLowerCase(); // 避免重复调用 toLowerCase
        return sortedContacts.filter(item =>
          item.name.toLowerCase().includes(lowerCaseSearchKey),
        );
      }
      return sortedContacts;
    });
    const unReadContactList = computed(() => {
      const list = contactList.value.filter(p => p.unreadCount);
      localStorage.setItem("unReadContactList", JSON.stringify(list));
      return list;
    });
    const isNewMsg = computed(() => contactList.value.filter(p => p.unreadCount).length > 0);
    const isVisible = ref(false); // 是否可见
    const isMsgListScroll = ref(false); // 消息列表是否滚动
    const theContact = ref<ChatContactDetailVO>({
      activeTime: 0,
      avatar: "",
      roomId: 0,
      hotFlag: 1,
      name: "",
      text: "",
      type: 1,
      selfExit: 1,
      unreadCount: 0,
      // 消息列表
      msgList: [],
      unreadMsgList: [],
      roomGroup: undefined,
      member: undefined,
    });
    const playSounder = ref<PlaySounder>({
      state: "stop",
      url: "",
      msgId: 0,
      currentSecond: 0,
      duration: 0,
      audio: undefined,
    });

    // store
    const ws = useWs();
    const user = useUserStore();
    const updateContactList = ref< { [key: number]: boolean }>({});
    // 消息列表滚动
    const scrollBottom = (animate = true) => {
      mitter.emit(MittEventType.MSG_LIST_SCROLL, {
        type: "scrollBottom",
        payload: {
          animate,
        },
      });
    };
    // 改变会话
    async function setContact(vo?: ChatContactVO) {
      if (!vo || !vo.roomId) {
        theContact.value = {
          activeTime: 0,
          avatar: "",
          roomId: 0,
          hotFlag: 1,
          name: "",
          text: "",
          type: 1,
          selfExit: 1,
          unreadCount: 0,
          // 消息列表
          msgList: [],
          unreadMsgList: [],
          roomGroup: undefined,
          member: undefined,
        };
        return;
      }
      if (vo?.roomId)
        vo.unreadCount = 0;

      theContact.value = {
        ...(vo || {}),
        // 消息列表
        msgList: theContact.value.msgList || [],
        unreadMsgList: theContact.value.unreadMsgList || [],
      };
      useSettingStore().isOpenContact = false; // 关闭会话面板
      try {
        const res = await getChatContactInfo(vo.roomId, user.getToken, vo.type);
        if (res && res.code === StatusCode.SUCCESS) {
          theContact.value = {
            ...(res?.data || {}),
            msgList: theContact.value.msgList || [],
            unreadMsgList: theContact.value.unreadMsgList || [],
          };
        }
        else {
          setContact();
        }
      }
      catch (error) {
        console.log(error);
      }
    }
    // 重新加载会话列表
    function reloadContact(roomId: number, callBack?: (contact: ChatContactVO) => void) {
      // 重新拉取会话
      getChatContactInfo(roomId, user.getToken)?.then((res) => {
        if (res.code === StatusCode.SUCCESS) {
          contactMap.value[roomId] = res.data as ChatContactVO; // 追加前置
          callBack && callBack(res.data as ChatContactVO);
        }
      }).catch(() => {
      }).finally(() => {
        delete updateContactList.value[roomId];
      });
    }
    // 更新会话消息
    function updateContact(roomId: number, data: Partial<ChatContactVO>, callBack?: (contact: ChatContactVO) => void) {
      if (updateContactList.value[roomId])
        return;
      updateContactList.value[roomId] = true;
      if (contactMap.value[roomId]) {
        contactMap.value[roomId].text = data.text || contactMap.value[roomId].text;
        contactMap.value[roomId].unreadCount = data.unreadCount !== undefined ? data.unreadCount : contactMap.value[roomId].unreadCount;
        contactMap.value[roomId].activeTime = data.activeTime !== undefined ? data.activeTime : contactMap.value[roomId].activeTime;
        contactMap.value[roomId].avatar = data.avatar !== undefined ? data.avatar : contactMap.value[roomId].avatar;
        callBack && callBack(contactMap.value[roomId]);
        delete updateContactList.value[roomId]; // 删除正在修改的load
      }
      else {
        reloadContact(roomId);
      }
    }
    // 监听 新消息
    // 1、新消息 type=1
    mitter.on(MittEventType.MESSAGE, (data: ChatMessageVO) => {
      resolveNewMsg([data]);
    });
    // 2、撤回消息 type=2
    mitter.on(MittEventType.RECALL, (data: WSMsgRecall) => {
      resolveRevokeMsg([data]);
    });
    // 3、删除消息 type=3
    mitter.on(MittEventType.DELETE, (data: WSMsgDelete) => {
      resolveDeleteMsg([data]);
    });
    // 4、置顶会话消息
    mitter.on(MittEventType.PIN_CONTACT, (data: WSPinContactMsg) => {
      resolvePinContact(data);
    });
    // 移除监听
    function removeListeners() {
      mitter.off(MittEventType.MESSAGE);
      mitter.off(MittEventType.RECALL);
      mitter.off(MittEventType.DELETE);
    }
    onUnmounted(removeListeners);
    // onDeactivated(removeListeners);
    onBeforeMount(() => {
      // 监听消息
      setReadList(theContact.value.roomId);
    });
    /**
     * 1. 新消息处理
     * @param list 原始列表
     */
    async function resolveNewMsg(list: ChatMessageVO[]) {
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (!p)
          continue;
        const body = getBody(p) || "";
        // 1）更新会话列表
        updateContact(p.message.roomId, {
          // text: `${p.fromUser.nickName}：${body}`,
        }, (contact) => {
          // 添加未读数量
          if (p.fromUser.userId !== user.userInfo.id)
            contact.unreadCount += 1;
          contact.text = contact.type === RoomType.GROUP ? `${p.fromUser.nickName}: ${body}` : body;
          contact.activeTime = Date.now();
          if (p.message.roomId === theContact.value.roomId && p.fromUser.userId !== user.userInfo.id)
            theContact.value.unreadCount += 1;
        });
        // 2）更新消息列表
        if (p.message.roomId !== theContact.value.roomId)
          continue;
        setReadList(theContact.value.roomId);
        // 3）本房间追加消息
        const msg = findMsg(p.message.id);
        if (!msg) {
          theContact.value.msgList.push(p);
          p.message.type === MessageType.RTC && handleRTCMsg(p); // 处理rtc消息 多一步滚动
        }
      }
      ws.wsMsgList.newMsg.splice(0);
    }
    // 计算消息内容
    function getBody(msg: ChatMessageVO) {
      if (msg.message.type === MessageType.SOUND) {
        const _msg = msg as ChatMessageVO<SoundBodyMsgVO>;
        return `[语音] ${getSecondsText(_msg?.message?.body?.second || 0)}`;
      }
      else if (msg.message.type === MessageType.IMG) {
        const _msg = msg as ChatMessageVO<ImgBodyMsgVO>;
        return `[图片] ${_msg?.message.content}`;
      }
      else if (msg.message.type === MessageType.FILE) {
        const _msg = msg as ChatMessageVO<FileBodyMsgVO>;
        return `[${_msg.message.body?.fileName || "文件"}] ${_msg?.message.content}`;
      }
      else if (msg.message.type === MessageType.VIDEO) {
        const _msg = msg as ChatMessageVO<ImgBodyMsgVO>;
        return `[视频] ${_msg?.message.content}`;
      }
      else if (msg.message.type === MessageType.RTC) {
        const _msg = msg as ChatMessageVO<RtcLiteBodyMsgVO>;
        return `[${_msg.message.body?.typeText || "通讯聊天"}] ${_msg?.message.content}`;
      }

      return msg.message.content;
    }
    // 计算语音消息文本
    function getSecondsText(second?: number) {
      if (!second)
        return "";
      if (second < 60) {
        return `${second}"`;
      }
      else if (second < 3600) {
        const minute = Math.floor(second / 60);
        const second_ = second % 60;
        return `${minute}'${second_}"`;
      }
    }
    // 2. 处理rtc消息
    function handleRTCMsg(msg: ChatMessageVO) {
      const rtcMsg = msg.message.body as RtcLiteBodyMsgVO;
      // 更新滚动位置
      if (msg.message.roomId === theContact.value.roomId && rtcMsg.senderId === user.userInfo.id) {
        nextTick(() => {
          scrollBottom(true);
        });
      }
    }
    /**
     * 3. 撤回消息处理
     * @param list 列表
     */
    function resolveRevokeMsg(list: WSMsgRecall[]) {
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (!p)
          return;
        if (p.roomId !== theContact.value.roomId) {
          reloadContact(p.roomId);
          continue;
        }
        // 本房间修改状态
        const msg = findMsg(p.msgId);
        const msgContent = `${msg.fromUser.userId === user.userInfo.id ? "我" : `"${msg.fromUser.nickName}"`}撤回了一条消息`;
        // 更新会话列表
        const targetContact = contactMap.value[p.roomId];
        if (targetContact)
          targetContact.text = msgContent;
        if (msg) {
          msg.message.type = MessageType.RECALL;
          msg.message.content = msgContent;
          msg.message.body = undefined;
          ws.wsMsgList.recallMsg = ws.wsMsgList.recallMsg.filter(k => k.msgId !== p.msgId);
        }
      }
      // 消费消息
      ws.wsMsgList.deleteMsg.splice(0);
    }
    /**
     * 4. 删除消息处理
     * @param list 列表
     */
    function resolveDeleteMsg(list: WSMsgDelete[]) {
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (!p)
          return;
        if (p.roomId !== theContact.value.roomId) {
          reloadContact(p.roomId);
          continue;
        }
        // 本房间修改状态
        const msg = findMsg(p.msgId);
        const msgContent = `${p.deleteUid === user.userInfo.id ? "我删除了一条消息" : `"${msg.fromUser.nickName}"删除了一条成员消息`}`;

        // 更新会话列表
        const targetContact = contactMap.value[p.roomId];
        if (targetContact)
          targetContact.text = msgContent;
        if (msg) {
          msg.message.type = MessageType.DELETE;
          msg.message.content = msgContent;
          msg.message.body = undefined;
          ws.wsMsgList.deleteMsg = ws.wsMsgList.deleteMsg.filter(k => k.msgId !== p.msgId);
        }
      }
      // 消费消息
      ws.wsMsgList.deleteMsg.splice(0);
    }

    /**
     * 5. 置顶会话消息处理
     * @param data 数据
     */
    function resolvePinContact(data: WSPinContactMsg) {
      if (data.roomId !== theContact.value.roomId) {
        reloadContact(data.roomId);
        return;
      }
      // 本房间修改状态
      if (contactMap.value[data.roomId]) {
        contactMap.value[data.roomId]!.pinTime = data.pinTime;
      }
      else { // 主动拉取
        reloadContact(data.roomId);
      }
    }

    async function setPinContact(roomId: number, isPin: isTrue, callBack?: (contact: ChatContactVO) => void) {
      const res = await pinContact(roomId, isPin, user.getToken);
      if (res.code === StatusCode.SUCCESS && res.data) {
        resolvePinContact(res.data);
      }
    }

    // 添加消息到列表
    function appendMsg(data: ChatMessageVO) {
      if (data && data.message.id && !findMsg(data.message.id)) {
        theContact.value.msgList.push(data);
      }
    }
    function findMsg(msgId: number) {
      if (!msgId)
        return undefined;
      return theContact.value.msgList.find((k: ChatMessageVO) => k?.message?.id === msgId);
    }
    // 添加撤回消息
    function setRecallMsg(msg: ChatMessageVO) {
      if (!msg?.message?.id)
        return false;
      recallMsgMap.value[msg.message.roomId] = JSON.parse(JSON.stringify(msg));
      return true;
    }

    /**
     * 删除会话（不影响接收）
     * @param roomId 房间id
     * @param successCallBack
     */
    function deleteContactConfirm(roomId: number, successCallBack: () => void) {
      ElMessageBox.confirm("是否删除该聊天（非聊天记录）？", {
        title: "提示",
        center: true,
        type: "warning",
        confirmButtonText: "删除",
        confirmButtonLoadingIcon: defaultLoadingIcon,
        confirmButtonClass: "el-button--danger",
        cancelButtonText: "取消",
        lockScroll: false,
        callback: async (action: string) => {
          if (action === "confirm") {
            const res = await deleteContact(roomId, user.getToken);
            if (res.code === StatusCode.SUCCESS) {
              ElMessage.success("删除成功！");
              removeContact(roomId);
              successCallBack && successCallBack();
            }
          }
        },
      });
    }

    /**
     * 退出群聊
     * @param roomId 房间id
     * @param isTheGroupOwner 是否是群主
     * @param successCallBack 回调
     */
    function exitGroupConfirm(roomId: number, isTheGroupOwner: boolean = false, successCallBack: () => void) {
      ElMessageBox.confirm(isTheGroupOwner ? "是否解散该群聊？" : "是否退出该群聊？", {
        title: "提示",
        center: true,
        type: "warning",
        confirmButtonText: isTheGroupOwner ? "解散" : "退出",
        confirmButtonLoadingIcon: defaultLoadingIcon,
        confirmButtonClass: "el-button--danger",
        cancelButtonText: "取消",
        lockScroll: false,
        callback: async (action: string) => {
          if (action === "confirm") {
            const res = await exitRoomGroup(roomId, user.getToken);
            if (res.code === StatusCode.SUCCESS) {
              ElMessage.success("退出成功！");
              successCallBack && successCallBack();
            }
          }
        },
      });
    }

    // 删除会话
    async function removeContact(roomId: number) {
      if (roomId === theContact.value.roomId)
        await setContact();
      delete contactMap.value[roomId];
    }

    /** ***************************** 群聊成员 */
    const onOfflineList = ref<ChatMemberVO[]>([]);
    const roomGroupPageInfo = ref({
      cursor: null as null | string,
      isLast: false,
      size: 15,
    });

    function setGroupMember(list: ChatMemberVO[]) {
      onOfflineList.value = list;
    }


    /** ***************************** 页面状态 */
    async function isActiveWindow(): Promise<boolean> {
      const setting = useSettingStore();
      if (setting.isWeb) { // web端
        if (!isVisible.value)
          return false;
      }
      else if (setting.isDesktop) { // 桌面端
        const win = await WebviewWindow.getByLabel(MAIN_WINDOW_LABEL);
        if (!await win?.isFocused()) // 窗口未激活
          return false;
      }
      else { // 移动端 TODO:待定
        return true;
      }
      return true;
    }

    /**
     * 设置消息已读
     */
    async function setReadList(roomId?: number, lastMsg = "") {
      if (!roomId)
        return false;
      if (!await isActiveWindow()) // 窗口未激活
        return false;
      if (useRoute().path !== "/") { // 不在聊天页面
        return;
      }
      if (!user.getToken)
        return false;
      setMsgReadByRoomId(roomId, user.getToken).then((res) => {
        if (res.code !== StatusCode.SUCCESS)
          return false;

        // 标记已读
        if (roomId === theContact.value.roomId) {
          theContact.value.unreadCount = 0;
          theContact.value.unreadMsgList = [];
          theContact.value.text = lastMsg;
          if (contactMap.value[roomId]) {
            contactMap.value[roomId].unreadCount = 0;
          }
        }
        // 消费消息
        const ws = useWs();
        ws.wsMsgList.newMsg = ws.wsMsgList.newMsg.filter(k => k.message.roomId !== roomId);
      }).catch(() => {
      });
    }

    const clearAllUnread = () => {
      contactList.value.forEach((p) => {
        setReadList(p.roomId);
      });
    };

    // 页面绑定
    // 重新获取会话列表
    const onReloadContact = (size: number = 10, dto?: ContactPageDTO, isAll: boolean = true, roomId?: number) => {
    };
    const scrollTopSize = ref(0);
    const scrollReplyMsg = (msgId: number, gapCount: number = 0, isAnimated: boolean = true) => {
      mitter.emit(MittEventType.MSG_LIST_SCROLL, {
        type: "scrollReplyMsg",
        payload: { msgId, gapCount, isAnimated },
      });
    };
    const saveScrollTop = () => {
      mitter.emit(MittEventType.MSG_LIST_SCROLL, {
        type: "saveScrollTop",
        payload: {},
      });
    };
    const scrollTop = (size: number) => {
      mitter.emit(MittEventType.MSG_LIST_SCROLL, {
        type: "scrollTop",
        payload: { size },
      });
    };
      // 房间
    const onChangeRoom = async (newRoomId: number) => {
    };
    const onDownUpChangeRoomLoading = ref(false);
    // 向下/向上切换房间
    const onDownUpChangeRoom = async (type: "down" | "up") => {
      if (onDownUpChangeRoomLoading.value)
        return;
      const index = getContactList.value.findIndex(p => p.roomId === theContact.value.roomId);
      onDownUpChangeRoomLoading.value = true;
      const chat = useChatStore();
      if (index === -1 && getContactList?.value?.[0]?.roomId) {
        await onChangeRoom(getContactList?.value?.[0]?.roomId as number);
        onDownUpChangeRoomLoading.value = false;
        return;
      }
      if (type === "down") {
        // 向下
        if (index < getContactList.value.length - 1 && getContactList?.value?.[index + 1]?.roomId)
          await onChangeRoom(getContactList.value[index + 1]?.roomId as number);
      }
      else {
        // 向上
        if (index > 0 && getContactList?.value?.[index - 1]?.roomId)
          await onChangeRoom(getContactList.value[index - 1]?.roomId as number);
      }
      onDownUpChangeRoomLoading.value = false;
    };

    /** ***************************** 艾特AT人 */
    const atUserList = ref<Partial<AtChatMemberOption>[]>([]);
    const atUidListTemp = ref<string[]>([]);

    // 设置@AT人
    function setAtUid(userId: string) {
      if (!userId)
        return;


      if (!atUidListTemp.value.includes(userId))
        atUidListTemp.value.push(userId);
    }

    // 移除@人
    function removeAtByUsername(username?: string) {
      if (!username)
        return;


      atUserList.value = atUserList.value.filter(p => p.username !== username);
    }

    /** ***************************** 回复消息 */
    const replyMsg = ref<Partial<ChatMessageVO>>();

    // 回复消息
    function setReplyMsg(item: ChatMemberVO | Partial<ChatMessageVO>) {
      replyMsg.value = item;
    }


    /** ***************************** 联系人面板管理 */
    const theFriendOpt = ref<TheFriendOpt>({
      type: -1,
      data: {},
    });

    function setTheFriendOpt(type: FriendOptType, data?: any) {
      theFriendOpt.value.type = type;
      theFriendOpt.value.data = data;
    }


    // 面板删除好友|退出群聊操作
    const delUserId = ref("");
    function setDelUserId(userId: string) {
      delUserId.value = userId;
    }
    const delGroupId = ref<number | undefined>(undefined);
    function setDelGroupId(groupId: number | undefined) {
      delGroupId.value = groupId;
    }
    // 添加好友
    const isAddNewFriend = ref(false);
    function setIsAddNewFriend(val: boolean) {
      isAddNewFriend.value = val;
    }

    const showTheFriendPanel = computed({
      get: () => theFriendOpt.value.type !== FriendOptType.Empty,
      set: (val) => {
        setTheFriendOpt(FriendOptType.Empty);
      },
    }) as Ref<boolean>;

    /** ***************************** 重置 */
    function resetStore() {
      contactMap.value = {};
      theContact.value = {
        activeTime: 0,
        avatar: "",
        roomId: 0,
        hotFlag: 1,
        name: "",
        text: "",
        type: 1,
        selfExit: 1,
        unreadCount: 0,
        // 消息列表
        msgList: [],
        unreadMsgList: [],
        roomGroup: undefined,
        member: undefined,
      };
      delUserId.value = "";
      isAddNewFriend.value = false;
      isOpenContact.value = true;
      roomGroupPageInfo.value = {
        cursor: null,
        isLast: false,
        size: 15,
      };
      onOfflineList.value = [];
      playSounder.value = {
        state: "stop",
        url: "",
        msgId: 0,
        currentSecond: 0,
        duration: 0,
        audio: undefined,
      };
      isVisible.value = false;
      scrollTopSize.value = 0;
      saveScrollTop();
    }


    /** ***************************** RTC通话 */
    const showRtcCall = ref(false);
    const confirmRtcFn = ref({
      confirmCall: () => { },
      rejectCall: () => { },
    });
    const rtcCallType = ref<CallTypeEnum | undefined>(undefined);
    const webRtc = useWebRTC((type, { confirmCall, rejectCall }) => {
      rtcCallType.value = type;
      showRtcCall.value = true;
      confirmRtcFn.value = { confirmCall, rejectCall };
    });

    // 打开通话
    async function openRtcCall(roomId: number, type: CallTypeEnum, confirmOption?: { message?: string, title?: string }) {
      if (!roomId || !type)
        return;
      if (showRtcCall.value) {
        ElMessage.warning("通话中，请勿重复发起 ~");
        return;
      }
      const {
        message = "是否确认发起通话？",
        title = type === CallTypeEnum.AUDIO ? "语音通话" : "视频通话",
      } = confirmOption || {};
      if (theContact.value.type === RoomType.GROUP) {
        ElMessage.warning("群聊无法进行通话！");
        return;
      }
      ElMessageBox.confirm(message, {
        title,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        center: true,
      }).then(async (action) => {
        if (action !== "confirm" || !type) {
          return;
        }
        rtcCallType.value = type;
        await nextTick();
        // 查询是否在通话中
        const resp = await getChatRTCMessage(roomId, user.getToken);
        if (resp.code === StatusCode.SUCCESS && resp.status) { // 正在通话中
          const chat = useChatStore();
          showRtcCall.value = false;
          return false;
        }
        const res = await webRtc.startCall(roomId, type, undefined);
        if (res === false)
          showRtcCall.value = false;
        else
          showRtcCall.value = true;
      }).catch((e) => {
        console.warn(e);
      });
    }

    // 重新回滚通话
    async function rollbackCall(roomId: number, type: CallTypeEnum, msg?: ChatMessageVO) {
      openRtcCall(roomId, type, { message: "是否确认重新拨打？" });
    }
    function useChatWebRTC() {
      return webRtc;
    }


    return {
      // state
      msgForm,
      rtcCallType,
      showRtcCall,
      recallMsgMap,
      contactMap,
      contactList,
      isNewMsg,
      unReadContactList,
      searchKeyWords,
      getContactList,
      theContact,
      replyMsg,
      atUserList,
      atUidListTemp,
      theFriendOpt,
      showTheFriendPanel,
      delUserId,
      isAddNewFriend,
      isOpenContact,
      isMsgListScroll,
      roomGroupPageInfo,
      onOfflineList,
      playSounder,
      isVisible,
      delGroupId,
      // 方法
      setContact,
      setRecallMsg,
      removeContact,
      deleteContactConfirm,
      exitGroupConfirm,
      setReadList,
      clearAllUnread,
      setGroupMember,
      setIsAddNewFriend,
      setAtUid,
      removeAtByUsername,
      setReplyMsg,
      setDelUserId,
      setDelGroupId,
      setTheFriendOpt,
      onReloadContact,
      resetStore,
      openRtcCall,
      rollbackCall,
      useChatWebRTC,
      setPinContact,
      appendMsg,
      confirmRtcFn,
      // dom
      scrollTopSize,
      saveScrollTop,
      scrollReplyMsg,
      scrollBottom,
      scrollTop,
      onChangeRoom,
      onDownUpChangeRoom,
    };
  },
  {
    // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt-3.html
    persist: false,
    // persist: {
    //   storage: persistedState.localStorage,
    // },
  },
);
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));


