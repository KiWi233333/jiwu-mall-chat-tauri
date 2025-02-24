import ContextMenu from "@imengyu/vue3-context-menu";


export function useRoomGroupPopup(opt: { editFormField: Ref<string> }) {
  const { editFormField } = opt;

  // store
  const ws = useWsStore();
  const user = useUserStore();
  const chat = useChatStore();
  const setting = useSettingStore();


  // state
  const theUser = ref<ChatMemberVO>(); // 添加好友
  const showSearch = ref(false);
  const searchUserWord = ref("");
  const isShowApply = ref(false);
  const isGrid = useLocalStorage(`chat_room_group_member_show_type_${user.userInfo.id}`, false);
  // 计算
  const isTheGroupOwner = computed(() => chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER);
  const isTheGroupPermission = computed(() => chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN); // 是否有权限（踢出群聊、）

  const memberList = computed(() => {
    const str = searchUserWord.value.trim();
    const list = (chat.currentMemberList || []);
    if (str) {
      return list.filter(user => !!user?.nickName?.toLocaleLowerCase()?.includes(str));
    }
    return list.sort((a, b) => b.activeStatus - a.activeStatus);
  });
  const { list: vMemberList, scrollTo, containerProps, wrapperProps } = useVirtualList(
    memberList,
    {
      itemHeight: 50,
      overscan: 10,
    },
  );

  watchEffect(() => {
    if (chat.currentMemberList && chat.currentMemberList.length > 5) {
      containerProps?.onScroll?.();
    }
    else {
      chat.currentRoomCache.isReload = true;
      nextTick(() => {
        chat.currentRoomCache.isReload = false;
      });
    }
  }, {
    flush: "post",
  });

  const onScroll = useDebounceFn((e) => {
    const dom = e.target as HTMLElement;
    if (dom.scrollHeight - dom.scrollTop <= 500) {
      loadData();
    }
  }, 200);
  const isNotExistOrNorFriend = computed(() => chat.theContact.selfExist === isTrue.FALESE); // 自己不存在 或 不是好友  || chat.contactMap?.[chat.theContact.roomId]?.isFriend === 0
  const theContactClone = ref<Partial<ChatContactDetailVO>>();
  const isLord = computed(() => chat.theContact.member?.role === ChatRoomRoleEnum.OWNER);
  const TextMap = {
    name: "群名称",
    notice: "群公告",
    avatar: "群头像",
  };

  // 群头像
  const inputOssFileUploadRef = ref();
  const imgList = ref<OssFile[]>([]);
  function onSubmitImages(url: string) {
    if (url)
      submitUpdateRoom("avatar", url);
  }
  async function toggleImage() {
    if (!isLord.value) {
      ElMessage.warning("暂无权限！");
      return;
    }
    if (imgList.value.length > 0) {
      imgList.value = [];
      return;
    }
    await inputOssFileUploadRef.value?.resetInput();
  }

  /**
   * 修改群聊详情
   * @param field 修改字段
   * @param val 修改的值
   */
  async function submitUpdateRoom(field: "name" | "avatar" | "notice", val: string | undefined | null = "") {
    if (field === "name" && val && val.trim().length <= 0)
      return ElMessage.warning("请输入内容！");
    // 没有变化则不触发修改

    if ((field === "name" && chat.theContact?.[field] === val) || (field === "notice" && chat?.theContact?.roomGroup?.detail?.notice === val)) {
      editFormField.value = "";
      return;
    }
    const data = field === "notice"
      ? {
          detail: {
            [field]: val?.trim(),
          },
        }
      : {
          [field]: val?.trim(),
        } as UpdateRoomGroupDTO;

    ElMessageBox.confirm(`是否确认修改${TextMap[field]}？`, {
      title: TextMap[field] || "提示",
      center: true,
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button-primary",
      lockScroll: false,
      callback: async (action: string) => {
        if (action === "confirm") {
          const res = await updateGroupRoomInfo(chat.theContact.roomId, data, user.getToken);
          if (res.code === StatusCode.SUCCESS && res.data === 1) {
          // 更新会话
            const item = chat.contactMap[chat.theContact.roomId];
            if (field === "name") {
              if (item)
                item.name = val?.trim() as string;
              chat.theContact.name = val?.trim() as string;
            }
            else if (field === "avatar") {
              if (item)
                item.avatar = val?.trim() as string;
              chat.theContact.avatar = val?.trim() as string;
            }
            else if (field === "notice") {
              if (!chat.theContact?.roomGroup)
                return;
              if (!chat.theContact.roomGroup.detail)
                chat.theContact.roomGroup.detail = {};
              chat.theContact.roomGroup.detail.notice = val?.trim() as string;
            }
            editFormField.value = "";
          }
        }
        else {
          const data = JSON.parse(JSON.stringify(chat.theContact)) as ChatContactDetailVO;
          if (data.roomGroup && !data.roomGroup?.detail)
            data.roomGroup.detail = {};
          theContactClone.value = data;
          editFormField.value = "";
        }
      },
    });
  }

  /**
   * 加载数据
   */
  async function loadData(roomId?: number) {
    roomId = roomId || chat.theContact.roomId;
    if (chat?.roomMapCache?.[roomId]?.isLoading || chat.roomMapCache[roomId]?.isReload || chat.memberPageInfo.isLast || chat.theContact.type !== RoomType.GROUP)
      return;
    chat.roomMapCache[roomId]!.isLoading = true;
    const { data } = await getRoomGroupUserPage(roomId, chat.roomMapCache[roomId]?.pageInfo.size || 20, chat.roomMapCache[roomId]?.pageInfo.cursor || undefined, user.getToken);
    chat.memberPageInfo.isLast = data.isLast;
    chat.memberPageInfo.cursor = data.cursor || undefined;
    if (data && data.list) {
      chat?.roomMapCache?.[roomId]!.userList.push(...data.list);
    }
    await nextTick();
    chat.roomMapCache[roomId]!.isLoading = false;
  }

  /**
   * 重新加载
   * @param roomId 房间id
   */
  async function reload(roomId?: number) {
    roomId = roomId || chat.theContact.roomId;
    if (chat.roomMapCache[roomId]?.isLoading || chat.roomMapCache[roomId]?.isReload || chat.theContact.type !== RoomType.GROUP)
      return;
    chat.roomMapCache[roomId] = {
      isLoading: false,
      isReload: false,
      cacheTime: Date.now(),
      pageInfo: {
        cursor: undefined,
        isLast: false,
        size: 20,
      },
      userList: [],
    };
    // 动画
    try {
      chat.roomMapCache[roomId]!.isLoading = true;
      chat.roomMapCache[roomId]!.isReload = true;
      const { data } = await getRoomGroupUserPage(roomId, chat.roomMapCache[roomId]?.pageInfo.size || 20, chat.roomMapCache[roomId]?.pageInfo.cursor || undefined, user.getToken);
      if (roomId !== chat.theContact.roomId) {
        return;
      }
      chat.memberPageInfo.isLast = data.isLast;
      chat.memberPageInfo.cursor = data.cursor || undefined;
      if (data && data.list) {
        chat?.roomMapCache?.[roomId]!.userList.push(...data.list);
      }
      chat.roomMapCache[roomId]!.isLoading = false;
    }
    finally {
      await nextTick();
      chat.roomMapCache[roomId]!.isLoading = false;
      chat.roomMapCache[roomId]!.isReload = false;
    }
  }


  /**
   * 切换管理员角色
   * @param dto 参数
   * @param type 转化类型
   */
  function toggleAdminRole(dto: ChatRoomAdminAddDTO, type: ChatRoomRoleEnum) {
    const isAdmin = type === ChatRoomRoleEnum.ADMIN;
    ElMessageBox.confirm(`是否将该用户${isAdmin ? "设为" : "取消"}管理员？`, {
      title: "提示",
      center: true,
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      lockScroll: false,
      callback: async (action: string) => {
        if (action === "confirm") {
          const fn = isAdmin ? addChatRoomAdmin : delChatRoomAdmin;
          const res = await fn(dto, user.getToken);
          if (res.code === StatusCode.SUCCESS) {
            ElMessage.success("操作成功！");
            // 更新缓存中的角色信息
            const index = chat.currentMemberList.findIndex(p => p.userId === dto.userId);
            if (index !== -1 && chat.currentMemberList[index])
              chat.currentMemberList[index].roleType = type;
          }
        }
      },
    });
  }

  /**
   * 上下线消息
   */
  watchThrottled(() => ws.wsMsgList.onlineNotice, (list: WSOnlineOfflineNotify[] = []) => {
  // 上下线消息
    list.forEach((p) => {
      if (!p.changeList)
        return;
      for (const item of (chat.roomMapCache?.[chat.theContact.roomId]?.userList || [])) {
        for (const k of p.changeList) {
          if (k.userId === item.userId) {
            item.activeStatus = k.activeStatus;
            const find = chat.currentMemberList?.find(p => p.userId === item.userId);
            if (find)
              find.activeStatus = k.activeStatus; // 更新缓存中的状态
            break;
          }
        }
      }
    });
  }, {
    deep: true,
    immediate: true,
  });

  watch(() => chat.theContact, (val) => {
    const data = JSON.parse(JSON.stringify(val)) as ChatContactDetailVO;
    if (data.roomGroup && !data.roomGroup?.detail)
      data.roomGroup.detail = {};
    theContactClone.value = data;
  }, { deep: true, immediate: true });


  watch(() => chat.theContact.avatar, (val) => {
    if (val) {
      imgList.value = [{
        id: BaseUrlImg + val,
        key: val,
        file: {} as File,
        percent: 100,
        status: "success",
      }];
    }
    else { imgList.value = []; }
  }, { deep: true, immediate: true });

  // 监听房间变化
  watch(() => chat.theContactId, async (newRoomId) => {
    searchUserWord.value = "";
    await nextTick();
    containerProps.onScroll();
    scrollTo(0);
    if (!newRoomId) {
      return;
    }
    if (chat.roomMapCache[newRoomId]?.cacheTime && Date.now() - chat.roomMapCache[newRoomId]?.cacheTime < 300000) { // 缓存5分钟
      return;
    }
    await reload();
    await nextTick();
    containerProps.onScroll(); // 切换会话成员列表滚动条位置重置
    scrollTo(0);
  }, {
  });

  function onExitOrClearGroup() {
    if (isNotExistOrNorFriend.value) {
    // 不显示聊天
      chat.deleteContactConfirm(chat.theContact.roomId, () => {
      });
      return;
    }
    chat.exitGroupConfirm(chat.theContact.roomId, isTheGroupOwner.value, () => {
      chat.removeContact(chat.theContact.roomId);
    });
  }


  onMounted(() => {
  // 初始化加载
    reload();
    // 整个生命周期不能解除
    mitter.on(MittEventType.RELOAD_MEMBER_LIST, async ({ type, payload: { roomId, userId } }) => {
      if (chat.roomMapCache[roomId] === undefined) {
        return;
      }
      await reload(roomId);
      containerProps.onScroll(); // 触发刷新
    });
  });


  /**
   * 右键菜单
   * @param e 右键对象
   * @param item 用户
   */
  function onMemberContextMenu(e: MouseEvent, item: ChatMemberVO) {
    e.preventDefault();

    const isSelf = user.userInfo.id === item.userId;
    const roomId = chat.theContact.roomId;

    ContextMenu.showContextMenu({
      x: e.x,
      y: e.y,
      zIndex: 3000, // 高于遮罩层
      theme: setting.contextMenuTheme,
      items: [
        {
          label: "@ 他",
          customClass: "group",
          hidden: isSelf,
          onClick: () => {
            chat.setAtUid(item.userId);
          },
        },
        {
          label: "添加好友",
          customClass: "group",
          icon: "group-hover:scale-110 transition-transform i-solar:user-plus-broken btn-info",
          hidden: isSelf,
          onClick: () => {
          // 确认是否为好友
            isChatFriend({ uidList: [item.userId] }, user.getToken).then((res) => {
              if (res.code !== StatusCode.SUCCESS)
                return ElMessage.error(res.msg || "申请失败，请稍后再试！");
              const user = res.data.checkedList.find((p: FriendCheck) => p.uid === item.userId);
              if (user && user.isFriend)
                return ElMessage.warning("申请失败，和对方已是好友！");
              // 开启申请
              theUser.value = item;
              isShowApply.value = true;
            }).catch(() => {
            });
          },
        },
        {
          icon: "group-hover:scale-110 transition-transform btn-info i-solar:user-bold ",
          label: "联系他",
          customClass: "group",
          hidden: isSelf,
          onClick: () => navigateToUserDetail(item.userId),
        },
        {
          label: "管理员",
          customClass: "group",
          icon: "group-hover:scale-110 transition-transform i-solar:shield-user-bold-duotone btn-warning",
          hidden: isSelf || !isTheGroupOwner.value,
          children: [
            {
              label: "添加",
              customClass: "group",
              hidden: item.roleType === ChatRoomRoleEnum.ADMIN,
              icon: "group-hover:scale-110 transition-transform i-carbon:add-large btn-info",
              onClick: () => {
                toggleAdminRole({
                  userId: item.userId,
                  roomId: chat.theContact.roomId,
                }, ChatRoomRoleEnum.ADMIN);
              },
            },
            {
              label: "移除",
              customClass: "group",
              icon: "group-hover:scale-110 transition-transform i-solar:add-circle-linear btn-info",
              hidden: !item.roleType || item.roleType !== ChatRoomRoleEnum.ADMIN,
              onClick: () => {
                toggleAdminRole({
                  userId: item.userId,
                  roomId: chat.theContact.roomId,
                }, ChatRoomRoleEnum.MEMBER);
              },
            },
          ],
        },
        {
          label: "其他",
          customClass: "group",
          children: [
            {
              label: "分享",
              customClass: "group",
              icon: "group-hover:scale-110 transition-transform i-solar:share-line-duotone",
              onClick: async () => {
                const res = await useAsyncCopyText(`${window.location.origin}/user/info?id=${item.userId}`);
                ElMessage.success({
                  message: "成功复制至剪贴板！",
                  grouping: true,
                });
                const { isSupported, share } = useShare();
              },
            },
          ],
        },
        {
          label: "踢出群聊",
          customClass: "group",
          icon: "group-hover:scale-110 transition-transform i-solar:logout-3-broken",
          divided: "up",
          hidden: isSelf || !isTheGroupPermission.value,
          onClick: () => {
            ElMessageBox.confirm("是否将该用户踢出群聊？", {
              title: "提示",
              center: true,
              confirmButtonText: "踢出",
              cancelButtonText: "取消",
              confirmButtonClass: "btn-error",
              lockScroll: false,
              callback: async (action: string) => {
                if (action === "confirm") {
                  const res = await exitRoomGroupByUid(roomId, item.userId, user.getToken);
                  if (res.code === StatusCode.SUCCESS) {
                    ElMessage.success("踢出成功！");
                    if (!chat.roomMapCache[roomId]) {
                      return;
                    }
                    chat.roomMapCache[roomId].userList = chat.roomMapCache[roomId].userList.filter(e => e.userId !== item.userId);
                  }
                }
              },
            });
          },
        },
      ],
    });
  }

  return {
    // 群聊相关
    isTheGroupPermission,
    isTheGroupOwner,
    isLord,
    vMemberList,
    onMemberContextMenu,
    onExitOrClearGroup,
    submitUpdateRoom,

    // 搜索与用户相关
    showSearch,
    searchUserWord,
    isNotExistOrNorFriend,
    theContactClone,
    isShowApply,
    theUser,

    // 图片与上传相关
    imgList,
    inputOssFileUploadRef,
    onSubmitImages,
    toggleImage,

    // 表单与编辑相关
    editFormField,

    // 容器与布局相关
    containerProps,
    wrapperProps,

    // 数据加载与滚动相关
    loadData,
    scrollTo,
    onScroll,
    reload,
  };
}
