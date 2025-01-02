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
      if (searchKeyWords.value)
        return Object.values(contactMap.value).sort((a, b) => b.activeTime - a.activeTime).filter(item => item.name.toLocaleLowerCase().includes(searchKeyWords.value.toLocaleLowerCase()));
      else
        return Object.values(contactMap.value).sort((a, b) => b.activeTime - a.activeTime);
    });
    const unReadContactList = computed(() => {
      const list = contactList.value.filter(p => p.unreadCount);
      localStorage.setItem("unReadContactList", JSON.stringify(list));
      return list;
    });
    const isNewMsg = computed(() => unReadContactList.value.length > 0);
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

      try {
        const user = useUserStore();
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

    // 添加撤回消息
    function setRecallMsg(msg: ChatMessageVO) {
      if (!msg?.message?.id)
        return false;
      recallMsgMap.value[msg.message.roomId] = JSON.parse(JSON.stringify(msg));
      return true;
    }

    // 删除会话
    async function removeContact(roomId: number) {
      if (roomId === theContact.value.roomId)
        await setContact();
      Object.freeze(contactMap.value[roomId]);
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
        const win = await WebviewWindow.getByLabel("main");
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
      const user = useUserStore();
      if (!user.getToken)
        return false;
      setMsgReadByRoomId(roomId, user.getToken).then((res) => {
        if (res.code !== StatusCode.SUCCESS)
          return false;

        // 标记已读
        if (roomId === theContact.value.roomId) {
          theContact.value.unreadCount = 0;
          theContact.value.text = lastMsg;
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
      // 消息列表滚动
    const scrollBottom = (animate = true) => {
    };
    const scrollTopSize = ref(0);
    const scrollReplyMsg = (msgId: number, gapCount: number = 0, isAnimated: boolean = true) => {
    };
    const saveScrollTop = () => {
    };
    const scrollTop = (size: number) => {
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
        await chat.onChangeRoom(getContactList?.value?.[0]?.roomId as number);
        onDownUpChangeRoomLoading.value = false;
        return;
      }
      if (type === "down") {
        // 向下
        if (index < getContactList.value.length - 1 && getContactList?.value?.[index + 1]?.roomId)
          await chat.onChangeRoom(getContactList.value[index + 1]?.roomId as number);
      }
      else {
        // 向上
        if (index > 0 && getContactList?.value?.[index - 1]?.roomId)
          await chat.onChangeRoom(getContactList.value[index - 1]?.roomId as number);
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
    return {
      // state
      msgForm,
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


