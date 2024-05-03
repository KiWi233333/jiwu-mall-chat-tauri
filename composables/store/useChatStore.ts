/* eslint-disable @stylistic/js/spaced-comment */
import { acceptHMRUpdate, defineStore } from "pinia";
import type { ChatContactVO } from "../api/chat/contact";
import type { ChatContactPageDTO } from "~/components/Chat/ContactTabs.vue";

enum FriendOptType {
  Empty = -1,
  User = 0,
  NewFriend = 1,
  GroupFriend = 2,
}

// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useChatStore = defineStore(
  "chat",
  () => {
    /******************************* 会话 *********************************/
    const isOpenContact = ref(true);
    const contactList = ref<ChatContactVO[]>([]);
    const theContact = ref<ChatContactDetailVO>({
      activeTime: 0,
      avatar: "",
      roomId: 1,
      hotFlag: 1,
      name: "",
      text: "",
      type: 1,
      unreadCount: 0,
      // 消息列表
      msgList: [],
      unreadMsgList: [],
      roomGroup: undefined,
      member: undefined,
    });
    // 改变会话
    function setContact(vo?: ChatContactVO, list: ChatMessageVO[] = [], unReadList: ChatMessageVO[] = []) {
      if (vo)
        vo.unreadCount = 0;
      theContact.value = vo || {
        activeTime: 0,
        avatar: "",
        roomId: 1,
        hotFlag: 1,
        name: "",
        text: "",
        type: 1,
        unreadCount: 0,
        // 消息列表
        msgList: [],
        unreadMsgList: [],
      };
      if (list)
        theContact.value.msgList = list;
      if (unReadList)
        theContact.value.unreadMsgList = unReadList;
    }
    /******************************* 群聊成员 *********************************/
    const onOfflineList = ref<ChatMemberVO[]>([]);
    function setGroupMember(list: ChatMemberVO[]) {
      onOfflineList.value = list;
    }

    /**
     * 设置消息已读
     */
    function setReadList(roomId: number, lastMsg = "") {
      const user = useUserStore();
      setMsgReadByRoomId(roomId, user.getToken).then((res) => {
        if (res.code !== StatusCode.SUCCESS)
          return false;
        // 标记已读
        const ctx = contactList.value.find(p => p.roomId === roomId);
        if (ctx) {
          ctx.unreadCount = 0;
          if (lastMsg)
            ctx.text = lastMsg;
        }

        // 消费消息
        const ws = useWs();
        ws.wsMsgList.newMsg = ws.wsMsgList.newMsg.filter(k => k.message.roomId !== roomId);
      }).catch(() => {
      }); ;
    }

    // 页面绑定
    // 重新获取会话列表
    const onReloadContact = (size: number = 10, dto?: ChatContactPageDTO, isAll: boolean = true, roomId?: number) => {
    };
    // 消息列表滚动
    const scrollBottom = () => {
    };
    const scrollTopSize = ref(0);
    const scrollReplyMsg = (msgId: number, gapCount: number = 0) => {};
    const saveScrollTop = () => {};
    const scrollTop = (size: number) => {};


    /******************************* 艾特AT人 *********************************/
    const atUserList = ref<string[]>([]);
    // 设置@AT人
    function setAtUid(userId: string) {
      const find = atUserList.value.includes(userId);
      if (!find)
        atUserList.value.push(userId);
    }
    // 移除ai人
    function removeAtUid(userId: string) {
      return atUserList.value = atUserList.value.filter(p => p === userId);
    }

    /******************************* 回复消息 *********************************/
    const replyMsg = ref<Partial<ChatMessageVO>>();
    // 回复消息
    function setReplyMsg(item: ChatMemberVO | Partial<ChatMessageVO>) {
      replyMsg.value = item;
    }


    /******************************* 联系人面板管理 *********************************/
    const theFriendOpt = ref<TheFriendOpt>({
      type: -1,
      data: {},
    });

    function setTheFriendOpt(type: FriendOptType, data?: any) {
      theFriendOpt.value.type = type;
      theFriendOpt.value.data = data;
    }
    const delUserId = ref("");
    function setDelUserId(userId: string) {
      delUserId.value = userId;
    }

    const isAddNewFriend = ref(false);
    function setIsAddNewFriend(val: boolean) {
      isAddNewFriend.value = val;
    }
    const showTheFriendPanel = computed({
      get: () => theFriendOpt.value.type !== FriendOptType.Empty,
      set: (val) => {
        if (!val)
          setTheFriendOpt(FriendOptType.Empty);
      },
    });

    /******************************* 消息相关 *********************************/

    return {
      // state
      contactList,
      theContact,
      replyMsg,
      atUserList,
      theFriendOpt,
      showTheFriendPanel,
      delUserId,
      isAddNewFriend,
      isOpenContact,
      onOfflineList,
      // 方法
      setContact,
      setReadList,
      setGroupMember,
      setIsAddNewFriend,
      setAtUid,
      removeAtUid,
      setReplyMsg,
      setDelUserId,
      setTheFriendOpt,
      onReloadContact,
      // dom
      scrollTopSize,
      saveScrollTop,
      scrollReplyMsg,
      scrollBottom,
      scrollTop,

    };
  },
  {
    // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt-3.html
    persist: {
      // storage: persistedState.localStorage,
      storage: false,
    },
  },
);
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));

