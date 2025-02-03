/* eslint-disable regexp/negation */
import ContextMenu from "@imengyu/vue3-context-menu";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { appName } from "~/constants";

// 剪切板支持的图片格式
const CopyImgType = ["image/png", "image/jpg", "image/svg+xml"];

// @unocss-include
export function onMsgContextMenu(e: MouseEvent, data: ChatMessageVO, onDownLoadFile?: () => any) {
  const chat = useChatStore();
  const user = useUserStore();
  const setting = useSettingStore();
  const showTranslation = ref(false);


  // @ts-expect-error
  let ctxName = String(e?.target?.getAttribute?.("ctx-name") as DOMTokenList | undefined || "");
  const isAiReplyMsg = data.message.type === MessageType.AI_CHAT_REPLY;
  if (!ctxName && !isAiReplyMsg) {
    return;
  }

  if (!ctxName && isAiReplyMsg) {
    ctxName = "aiReply";
  }
  // 显示右键菜单
  e.preventDefault();
  // 是否是自己
  const isSelf = user.userInfo.id === data.fromUser.userId;
  // 权限检查
  const isTheGroupPermission = computed(() => {
    return chat.theContact?.member?.role === ChatRoomRoleEnum.OWNER || chat.theContact?.member?.role === ChatRoomRoleEnum.ADMIN;
  });
  // 右键菜单项配置
  // 默认有文字类型的右键菜单
  const defaultContextMenu = [
    {
      label: "撤回",
      hidden: !isSelf,
      customClass: "group",
      icon: "i-solar:backspace-broken group-hover:(scale-110 i-solar:backspace-bold) group-btn-danger",
      onClick: () => refundMsg(data, data.message.id),
    },
    {
      label: "删除",
      customClass: "group",
      icon: "i-solar:trash-bin-minimalistic-outline group-hover:(shake i-solar:trash-bin-minimalistic-bold) group-btn-danger",
      hidden: !isTheGroupPermission.value,
      onClick: () => deleteMsg(data, data.message.id),
    },
    {
      label: "回复",
      icon: "i-solar:arrow-to-down-right-line-duotone -rotate-90 group-hover:(translate-x-1 translate-y-2px) group-btn-info",
      onClick: () => chat.setReplyMsg(data),
    },
  ];
  const txt = window.getSelection()?.toString() || data.message.content;
  // 移动端长按
  if (setting.isMobileSize && ctxName === "avatar" && chat.theContact?.type === RoomType.GROUP) { // 右键直接AT他
    chat.setAtUid(data.fromUser.userId);
    return;
  }
  const contextMenuType: Record<string, any> = {
    content: [// 文本内容
      {
        label: "复制",
        hidden: !txt, // 只支持文本消息
        customClass: "group",
        icon: "i-solar-copy-line-duotone group-hover:(scale-110 i-solar-copy-bold-duotone) group-btn-info",
        onClick: () => {
          // 待定是否匹配content内容
          if (!txt) {
            return ElMessage.error("复制失败，请选择文本！");
          }
          useCopyText(txt as string);
        },
      },
      {
        label: "打开链接",
        hidden: !txt || !txt?.match(/https?:\/\/[^\s]+/g)?.length,
        customClass: "group",
        icon: "i-solar:link-line-duotone group-hover:(scale-110 i-solar:link-bold-duotone) group-btn-info",
        onClick: () => {
          if (!txt) {
            return;
          }
          const utls = txt?.match(/https?:\/\/[^\s]+/g);
          if (utls?.length) {
            ElMessageBox.confirm("是否打开链接？", "打开链接", {
              confirmButtonText: "打开",
              cancelButtonText: "取消",
              center: true,
              lockScroll: false,
              callback: (action: string) => {
                if (action === "confirm" && utls?.length) {
                  window.open(utls[0], "_blank");
                }
              },
            });
          }
        },
      },
      {
        label: "搜一搜",
        hidden: !data.message.content, // 暂时只支持文本消息
        customClass: "group",
        icon: "i-solar:magnifer-linear group-hover:(rotate-15 i-solar:magnifer-bold-duotone) group-btn-success",
        onClick: () => {
          if (!txt) {
            return ElMessage.error("选择内容为空，无法搜索！");
          }
          // bing
          const bingUrl = `https://bing.com/search?q=${encodeURIComponent(txt)}`;
          window.open(bingUrl, "_blank");
        },
      },
      ...defaultContextMenu,
    ],
    img: [// 图片内容
      {
        label: "复制",
        customClass: "group",
        hidden: !data.message.body.url || setting.isMobile,
        icon: "i-solar:copy-line-duotone group-hover:(scale-110 i-solar-copy-bold-duotone) group-btn-info",
        onClick: async () => {
          let img = await getImgBlob(BaseUrlImg + data.message.body.url);
          if (!img)
            return ElMessage.error("图片加载失败！");
          if (!CopyImgType.includes(img.type)) {
            img = await convertImgToPng(img);
          }
          if (!img) {
            return ElMessage.error("图片处理失败！");
          }
          const { copy, isSupported } = useClipboardItems({
            read: false,
            source: [new ClipboardItem({ [img.type]: img })],
            // copiedDuring: 1500,
          });
          if (isSupported.value) {
            copy()
              .then(() => {
                ElMessage.success("图片已复制到剪切板！");
              })
              .catch((e) => {
                console.warn(e);
                ElMessage.error("复制失败，请手动保存！");
              });
            img = null;
          }
          else {
            ElMessage.error("当前设备不支持复制图片！");
            img = null;
          };
        },
      },
      {
        label: "保存图片",
        customClass: "group",
        hidden: !data.message.body.url,
        icon: "i-solar-download-minimalistic-broken group-hover:(translate-y-2px i-solar-download-minimalistic-bold) group-btn-success",
        onClick: async () => {
          let path: string | undefined | null = "";
          const fileName = path.split("\\").pop() || `${Date.now()}.png`;
          if (!setting.isWeb) {
            path = await saveDialog({
              title: setting.isDesktop ? `${appName} - 保存图片` : undefined,
              filters: [{ name: "图片文件", extensions: ["png", "jpeg", "jpg", "svg", "webp"] }],
              defaultPath: fileName,
            });
            if (!path) {
              return;
            }
          }

          downloadFile(BaseUrlImg + data.message.body.url, fileName, { targetPath: path }, () => {
            ElMessage.success(setting.isWeb ? "图片已保存" : `图片已保存到 ${path}`);
          });
        },
      },
      {
        label: "撤回",
        hidden: !isSelf,
        customClass: "group",
        icon: "i-solar:backspace-broken group-hover:(scale-110 i-solar:backspace-bold) group-btn-danger",
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
        icon: setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url]
          ? "i-solar-file-line-duotone group-hover:(scale-110 i-solar-file-bold-duotone) group-btn-info"
          : "i-solar-download-minimalistic-broken group-hover:(translate-y-2px i-solar-download-minimalistic-bold) group-btn-success",
        onClick: () => onDownLoadFile && onDownLoadFile(),
      },
      {
        label: "文件夹打开",
        hidden: setting.isWeb || data.message.type !== MessageType.FILE || !setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url],
        customClass: "group",
        icon: "i-solar:folder-with-files-line-duotone group-hover:(scale-110 i-solar:folder-with-files-bold-duotone) group-btn-info",
        onClick: () => setting.openFileFolder(setting.fileDownloadMap?.[BaseUrlFile + data.message.body.url] as FileItem),
      },
      ...defaultContextMenu,
    ],
    sound: [// 语音内容
      {
        label: showTranslation.value ? "折叠转文字" : "转文字",
        hidden: data.message.type !== MessageType.SOUND || !data.message.body?.translation,
        customClass: "group",
        icon: "i-solar:text-broken group-hover:(scale-110 i-solar:text-bold) group-btn-info",
        onClick: () => (showTranslation.value = !showTranslation.value),
      },
      ...defaultContextMenu,
    ],
    nickname: [// 昵称内容
      {
        label: "复制",
        hidden: !data.fromUser.nickName,
        customClass: "group",
        icon: "i-solar-copy-line-duotone group-hover:(scale-110 i-solar-copy-bold-duotone) group-btn-info",
        onClick: () => {
          const txt = window.getSelection()?.toString() || data.fromUser.nickName;
          useCopyText(txt as string);
        },
      },
      {
        label: "个人资料",
        icon: "i-solar:user-broken group-hover:(scale-110 i-solar:user-bold) group-btn-info",
        customClass: "group",
        hidden: isSelf,
        onClick: () => {
          chat.setTheFriendOpt(FriendOptType.User, { id: data.fromUser.userId });
          navigateTo("/friend");
        },
      },
      {
        label: "TA",
        icon: "i-solar:mention-circle-broken group-hover:(rotate-15 i-solar:mention-circle-bold) group-btn-info",
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
    video: [// video视频内容
      // 静音播放
      {
        label: "静音播放",
        icon: "i-solar:volume-cross-line-duotone group-hover:(scale-110 i-solar:volume-cross-bold-duotone) group-btn-warning",
        customClass: "group",
        onClick: () => {
          const body = data.message.body as VideoBodyMsgVO;
          if (!body?.url) {
            return;
          }
          mitter.emit(MittEventType.VIDEO_READY, {
            type: "play-dbsound",
            payload: {
              mouseX: e.clientX,
              mouseY: e.clientY,
              url: BaseUrlVideo + body.url,
              duration: body.duration,
              size: body.size,
              thumbUrl: BaseUrlImg + body.thumbUrl,
              thumbSize: body.thumbSize,
              thumbWidth: body.thumbWidth,
              thumbHeight: body.thumbHeight,
            },
          });
        },
      },
      // 另存视频
      {
        label: "另存视频",
        icon: "i-solar:download-line-duotone group-hover:(scale-110 i-solar:download-bold-duotone) group-btn-success",
        customClass: "group",
        onClick: async () => {
          saveDownloadVideoByUrl(BaseUrlVideo + data.message.body.url);
        },
      },
      ...defaultContextMenu,
    ],
    aiReply: [
      {
        label: "分享图片",
        icon: "i-solar:share-line-duotone group-hover:(scale-110 i-solar:share-bold-duotone) group-btn-war",
        customClass: "group",
        onClick: () => {
          ElMessage.warning("暂不支持分享图片");
          // const dom = document.getElementById(`msg-md-${data.message.id}`);
        },
      },
      {
        label: "复制",
        hidden: !txt, // 只支持文本消息
        customClass: "group",
        icon: "i-solar-copy-line-duotone group-hover:(scale-110 i-solar-copy-bold-duotone) group-btn-info",
        onClick: () => {
          // 待定是否匹配content内容
          if (!txt) {
            return ElMessage.error("复制失败，请选择文本！");
          }
          useCopyText(txt as string);
        },
      },
      {
        label: "搜一搜",
        hidden: !data.message.content, // 暂时只支持文本消息
        customClass: "group",
        icon: "i-solar:magnifer-linear group-hover:(rotate-15 i-solar:magnifer-bold-duotone) group-btn-success",
        onClick: () => {
          if (!txt) {
            return ElMessage.error("选择内容为空，无法搜索！");
          }
          // bing
          const bingUrl = `https://bing.com/search?q=${encodeURIComponent(txt)}`;
          window.open(bingUrl, "_blank");
        },
      },
      ...defaultContextMenu,
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
    theme: setting.contextMenuTheme,
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
function deleteMsg(data: ChatMessageVO<any>, msgId: number) {
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
          data.message.type = MessageType.DELETE;
          data.message.content = `${data.fromUser.userId === user.userInfo.id ? "我删除了一条消息" : `我删除了一条"${data.fromUser.nickName}"成员消息`}`;
          data.message.body = undefined;
        }
      }
    },
  });
}


/**
 * 下载视频
 * @param url 视频地址
 */
export async function saveDownloadVideoByUrl(url: string) {
  if (!url) {
    return;
  }
  const setting = useSettingStore();
  let path: string | undefined | null = "";
  const fileName = path.split("\\").pop() || `${Date.now()}.mp4`;
  if (!setting.isWeb) {
    path = await saveDialog({
      title: setting.isDesktop ? `${appName} - 保存视频` : undefined,
      filters: [{ name: "视频文件", extensions: ["mp4"] }],
      defaultPath: fileName,
    });
    if (!path) {
      return;
    }
  }
  downloadFile(url, fileName, { targetPath: path }, () => {
    ElMessage.success(setting.isWeb ? "视频已保存" : `视频已保存到 ${path}`);
  });
}
