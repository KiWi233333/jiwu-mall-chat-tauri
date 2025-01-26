import ContextMenu from "@imengyu/vue3-context-menu";
import { save } from "@tauri-apps/plugin-dialog";
import { appName } from "~/constants";

// @unocss-include
export function onMsgContextMenu(e: MouseEvent, data: ChatMessageVO, onDownLoadFile?: () => any) {
  const chat = useChatStore();
  const user = useUserStore();
  const setting = useSettingStore();
  const colorMode = useColorMode();
  const showTranslation = ref(false);

  // 显示右键菜单
  e.preventDefault();
  // 是否是自己
  const isSelf = user.userInfo.id === data.fromUser.userId;
  // 权限检查
  const isTheGroupPermission = computed(() => {
    return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN;
  });

  // @ts-expect-error
  const ctxName = String(e?.target?.getAttribute?.("ctx-name") as DOMTokenList | undefined || "");
  if (!ctxName) {
    return;
  }
  // 右键菜单项配置
  // 默认有文字类型的右键菜单
  const defaultContextMenu = [
    {
      label: "撤回",
      hidden: !isSelf,
      customClass: "group",
      icon: "i-solar:backspace-broken group-btn-danger",
      onClick: () => refundMsg(data, data.message.id),
    },
    {
      label: "删除",
      customClass: "group",
      icon: "i-solar:trash-bin-minimalistic-outline group-btn-danger",
      hidden: !isTheGroupPermission.value,
      onClick: () => deleteMsg(data, data.message.id),
    },
    {
      label: "回复",
      icon: "i-solar:arrow-to-down-right-line-duotone -rotate-90 group-btn-info",
      onClick: () => chat.setReplyMsg(data),
    },
  ];
  const contextMenuType: Record<string, any> = {
    content: [// 文本内容
      {
        label: "复制",
        hidden: !data.message.content,
        customClass: "group",
        icon: "i-solar-copy-line-duotone group-btn-info",
        onClick: () => useCopyText(data.message.content as string),
      },
      ...defaultContextMenu,
    ],
    img: [// 图片内容
      {
        label: "复制",
        customClass: "group",
        hidden: !data.message.body.url,
        icon: "i-solar:copy-line-duotone group-btn-info",
        onClick: async () => {
          const img = await getImgBlob(BaseUrlImg + data.message.body.url);
          if (!img)
            return ElMessage.error("图片加载失败！");
          const { copy, isSupported } = useClipboardItems({
            read: false,
            source: [new ClipboardItem({ [img.type]: img })],
            copiedDuring: 1200,
          });
          if (isSupported)
            copy().catch(() => ElMessage.error("复制失败！"));
          else ElMessage.error("当前设备不支持复制图片！");
        },
      },
      {
        label: "保存图片",
        customClass: "group",
        hidden: !data.message.body.url,
        icon: "i-solar-download-minimalistic-broken group-btn-info",
        onClick: async () => {
          let path: string | undefined | null = "";
          const fileName = path.split("\\").pop() || `${Date.now()}.png`;
          if (setting.isWeb) { // 非web端
            downloadFile(BaseUrlFile + data.message.body.url, fileName, { targetPath: path }, () => {
              ElMessage.success(setting.isWeb ? "图片已保存" : `图片已保存到 ${path}`);
            });
            return;
          }
          path = await save({
            title: setting.isDesktop ? `${appName} - 保存图片` : undefined,
            filters: [{ name: "图片文件", extensions: ["png", "jpeg", "jpg", "svg", "webp"] }],
            defaultPath: fileName,
          });
        },
      },
      {
        label: "撤回",
        hidden: !isSelf,
        customClass: "group",
        icon: "i-solar:backspace-broken group-btn-danger",
        onClick: () => refundMsg(data, data.message.id),
      },
      {
        label: "回复",
        icon: "i-solar:arrow-to-down-right-line-duotone -rotate-90 group-btn-info",
        onClick: () => chat.setReplyMsg(data),
      },
    ],
    file: [// 文件内容
      {
        label: setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url] ? "打开文件" : "下载文件",
        hidden: setting.isWeb || data.message.type !== MessageType.FILE,
        customClass: "group",
        icon: setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url] ? "i-solar-file-line-duotone group-btn-info" : "i-solar-download-minimalistic-broken group-btn-info",
        onClick: () => onDownLoadFile && onDownLoadFile(),
      },
      {
        label: "文件夹打开",
        hidden: setting.isWeb || data.message.type !== MessageType.FILE || !setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url],
        customClass: "group",
        icon: "i-solar:folder-with-files-line-duotone group-btn-info",
        onClick: () => setting.openFileFolder(setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url] as FileItem),
      },
      ...defaultContextMenu,
    ],
    sound: [// 语音内容
      {
        label: showTranslation.value ? "折叠转文字" : "转文字",
        hidden: data.message.type !== MessageType.SOUND || !data.message.body?.translation,
        customClass: "group",
        icon: "i-solar-text-broken group-btn-info",
        onClick: () => (showTranslation.value = !showTranslation.value),
      },
      ...defaultContextMenu,
    ],
    nickname: [// 昵称内容
      {
        label: "复制",
        hidden: !data.fromUser.nickName,
        customClass: "group",
        icon: "i-solar-copy-line-duotone group-btn-info",
        onClick: () => useCopyText(data.fromUser.nickName as string),
      },
      {
        label: "个人资料",
        icon: "i-solar:user-broken group-btn-info",
        customClass: "group",
        hidden: isSelf,
        onClick: () => {
          chat.setTheFriendOpt(FriendOptType.User, { id: data.fromUser.userId });
          navigateTo("/friend");
        },
      },
      {
        label: "TA",
        icon: "i-solar:mention-circle-broken group-btn-info",
        customClass: "group",
        hidden: isSelf || chat.theContact.type === RoomType.SELFT,
        onClick: () => chat.setAtUid(data.fromUser.userId),
      },
    ],
    avatar: [// 头像内容
      {
        label: isSelf ? "查看自己" : "个人资料",
        icon: "i-solar:user-broken group-btn-info",
        customClass: "group",
        onClick: () => {
          if (isSelf) {
            navigateTo("/user");
          }
          else {
            chat.setTheFriendOpt(FriendOptType.User, { id: data.fromUser.userId });
            navigateTo("/friend");
          }
        },
      },
      {
        label: "TA",
        icon: "i-solar:mention-circle-broken group-btn-info",
        customClass: "group",
        hidden: isSelf || chat.theContact.type === RoomType.SELFT,
        onClick: () => chat.setAtUid(data.fromUser.userId),
      },
    ],
    rtc: [// RTC通话内容
      {
        label: "重新拨打",
        icon: "i-solar:call-dropped-bold p-2.6 group-btn-warning",
        customClass: "group",
        onClick: () => chat.rollbackCall(data.message.roomId, data.message.body?.type, data),
      },
      {
        label: "回复",
        icon: "i-solar:arrow-to-down-right-line-duotone -rotate-90 group-btn-info",
        onClick: () => chat.setReplyMsg(data),
      },
    ],
  };
  const getContextMenuItems = (ctxName: string, isSelf: boolean) => {
    return contextMenuType[ctxName] || [];
  };

  const items = getContextMenuItems(ctxName, isSelf);
  if (items.length === 0)
    return;

  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items,
  });
}


// 撤回消息
async function refundMsg(data: ChatMessageVO, msgId: number) {
  const oldData = JSON.parse(JSON.stringify(data));
  const user = useUserStore();
  const chat = useChatStore();
  const roomId = data.message.roomId;
  const res = await refundChatMessage(roomId, msgId, user.getToken);
  if (res.code === StatusCode.SUCCESS) {
    if (data.message.id === msgId) {
      if (data.message.content) {
        // 记录撤回的消息（提供后续撤回功能）
        chat.setRecallMsg(oldData);
      }
      data.message.type = MessageType.RECALL;
      data.message.type = MessageType.RECALL;
      data.message.content = `${data.fromUser.userId === user.userInfo.id ? "我" : `"${data.fromUser.nickName}"`}撤回了一条消息`;
      data.message.body = undefined;
    }
  }
}

// 删除消息
function deleteMsg(data: ChatMessageVO, msgId: number) {
  ElMessageBox.confirm("是否确认删除消息？", "删除提示", {
    lockScroll: false,
    confirmButtonText: "确 认",
    confirmButtonClass: "el-button--primary is-plain border-default ",
    cancelButtonText: "取 消",
    center: true,
    callback: async (action: string) => {
      if (action !== "confirm")
        return;
      const user = useUserStore();
      const roomId = data.message.roomId;
      const res = await deleteChatMessage(roomId, msgId, user.getToken);
      if (res.code === StatusCode.SUCCESS) {
        if (data.message.id === msgId) {
          data.message.type = MessageType.RECALL;
          data.message.content = `${data.deleteUid === user.userInfo.id ? "我删除了一条消息" : `"${data.fromUser.nickName}"删除了一条成员消息`}`;
          data.message.body = undefined;
        }
      }
    },
  });
}
