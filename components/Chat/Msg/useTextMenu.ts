import { ContextMenu } from "@imengyu/vue3-context-menu";

export function onContextMenu(e: MouseEvent, item: ChatMessageVO, callList: MsgMenuCallType) {
  e.preventDefault();
  // 注入
  const colorMode = useColorMode();
  const user = useUserStore();
  const chat = useChatStore();
  const isSelf = user.userInfo.id === item.fromUser.userId;

  const opt = {
    x: e.x,
    y: e.y,
    theme: colorMode.preference === "dark" ? "mac dark" : "wind10",
    items: [

    ] as any[],
  };
  if (isSelf) {
    opt.items = [{
      label: "撤回",
      disabled: !isSelf,
      onClick: (): any => {
        ElMessageBox.confirm("是否确认撤回消息？", "撤回提示", {
          lockScroll: false,
          confirmButtonText: "确 认",
          confirmButtonClass: "el-button--primary is-plain border-default ",
          cancelButtonText: "取 消",
          center: true,
          callback: async (action: string) => {
            if (action !== "confirm")
              return;
            const res = await refundChatMessage(item.message.roomId, item.message.id, user.getToken);
            if (res.code === StatusCode.SUCCESS) {
              ElMessage.success("撤回成功！");
              callList?.refundMsgCall && callList?.refundMsgCall();
            }
          },
        });
      },
    },
    ];
  }
  else {
    opt.items = [{
      label: "回复",
      disabled: isSelf,
      onClick: () => {
        chat.setReplyMsg(item);
      },
    },
    {
      label: "@TA",
      disabled: isSelf,
      onClick: () => {
        chat.setAtUid(item.fromUser.userId);
      },
    }];
  }
  ContextMenu.showContextMenu(opt);
}

export interface MsgMenuCallType {
  refundMsgCall?: () => void
  atMsgCall?: () => void
  replyCall?: () => void
}
