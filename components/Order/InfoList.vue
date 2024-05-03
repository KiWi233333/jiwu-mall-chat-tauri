<script lang="ts" setup>
import type { OrderInfoVO, OrdersPageDTO } from "~/composables/api/orders";
import { OrdersStatus, getAllOrderPage, getOrderPageByDTO } from "~/composables/api/orders";


// props
const props = withDefaults(
  defineProps<{
    dto?: OrdersPageDTO
    status?: OrdersStatus
  }>(),
  {
    dto: () => {
      return {};
    },
    status: () => -1,
  },
);

// 查询参数
const params = ref<Partial<OrdersPageDTO>>({
  id: undefined,
  endTime: undefined,
  startTime: undefined,
});
// store
const user = useUserStore();
const isLoading = ref<boolean>(false);
// 列表
const list = ref<OrderInfoVO[]>([]);
// 分页器
const page = ref<number>(0);
const size = ref<number>(10);
// 查询页信息
const pageInfo = ref({
  total: -1,
  pages: -1,
  current: -1,
});
// 计算
const isNotMore = computed(() => {
  return page.value === pageInfo.value.pages;
});
const isNothing = computed(() => {
  return pageInfo.value.pages === 0;
});
// 加载数据
async function loadOrdersPage() {
  if (isNotMore.value || isNothing.value || isLoading.value)
    return;
  isLoading.value = true;
  // 翻页
  page.value++;
  const { data, code }
    = props.status === -1
      ? await getAllOrderPage(page.value, size.value, params.value || {}, user.getToken)
      : await getOrderPageByDTO(
        props.status,
        page.value,
        size.value,
        params.value || {},
        user.getToken,
      );
  if (code === StatusCode.SUCCESS) {
    if (data.records.length)
      list.value.push(...data.records);
    pageInfo.value = {
      total: data.total,
      pages: data.pages,
      current: data.current,
    };
  }
  else {
    ElMessage.error({
      grouping: true,
      message: "获取失败，请稍后再试！",
    });
  }

  setTimeout(() => {
    isLoading.value = false;
  }, 120);
}
loadOrdersPage();

function reload() {
  page.value = 0;
  pageInfo.value = {
    total: -1,
    pages: -1,
    current: -1,
  };
  list.value.splice(0);
  loadOrdersPage();
}

function reloadSearch() {
  params.value.startTime = undefined;
  params.value.endTime = undefined;
  reload();
}

// 更新loading
const isUpdateLoading = ref<boolean>(false);

enum SubmitFnType {
  cancel = "cancel",
  toastDelivery = "toastDelivery",
  pushRefund = "pushRefund",
  toDelete = "toDelete",
  checkDelivery = "checkDelivery", // 确认收货
}

// 订单操作集合
function submit(type: SubmitFnType, order: OrderInfoVO) {
  switch (type) {
    case SubmitFnType.cancel:
      cancel(order);
      break;
    case SubmitFnType.toastDelivery:
      toastDelivery();
      break;
    case SubmitFnType.pushRefund:
      pushRefund(order);
      break;
    case SubmitFnType.checkDelivery:
      checkDelivery(order);
      break;
    case SubmitFnType.toDelete:
      toDelete(order);
      break;
  }
}
// 1、取消订单 CANCLEL
async function cancel(order: OrderInfoVO) {
  if (order.status !== OrdersStatus.UN_PAID)
    return;
  try {
    const action = await ElMessageBox.confirm("是否确认取消订单？", "取消提示", {
      lockScroll: false,
      confirmButtonText: "确 认",
      confirmButtonClass: "el-button--primary is-plain border-default ",
      cancelButtonText: "取 消",
      center: true,
    });
    if (action === "confirm") {
      isUpdateLoading.value = true;
      // 发起退款
      const { code } = await cancelOrders(order.id, user.getToken);
      isUpdateLoading.value = false;
      // 成功
      if (code === StatusCode.SUCCESS) {
        order.updateTime = useDateFormat(Date.now(), "YYYY-MM-DD HH:mm:ss").value.toString();
        order.status = OrdersStatus.CANCELED;
        ElNotification.success({
          title: "取消成功",
          message: "订单取消成功，优惠卷等优惠也将原路退回！",
        });
        // for (let i = 0; i < list.value.length; i++) {
        //   const p = list.value[i];
        //   if (p.id === order.id) {
        //     p.updateTime = useDateFormat(Date.now(), "YYYY-MM-DD HH:mm:ss").value.toString();
        //     p.status = OrdersStatus.CANCELED;
        //     return;
        //   }
        // }
      }
      else {
        // 失败
        ElNotification.error({
          title: "订单取消失败，请稍后再试！",
        });
      }
    }
  }
  catch (e) {
    isUpdateLoading.value = false;
  }
  finally {
    isUpdateLoading.value = false;
  }
}
// 2、待发货（催发货）
function toastDelivery() {
  ElMessageBox.alert("我们已收到您的订单，将尽快处理并安排发货！", "提 醒", {
    lockScroll: false,
    confirmButtonText: "好 的",
    center: true,
  }).catch();
}
// 3、删除订单订单 DELETE
async function toDelete(order: OrderInfoVO) {
  if (
    order.status !== OrdersStatus.REFUND_SUCCESS
    && order.status !== OrdersStatus.CANCELED
    && order.status !== OrdersStatus.DELAY_CANCELED
    && order.status !== OrdersStatus.COMMENTED
  )
    return;
  try {
    const action = await ElMessageBox.confirm(
      "删除将永久移除该订单及其相关信息，是否确定删除？",
      "删除操作",
      {
        center: true,
        lockScroll: false,
        confirmButtonText: "删 除",
        confirmButtonClass: "el-button--danger border-default shadow-sm",
        cancelButtonText: "取 消",
      },
    );
    if (action === "confirm") {
      isLoading.value = true;
      // 发起退款
      const { code } = await deleteOrders(order.id, user.getToken);
      isLoading.value = false;
      if (code === StatusCode.SUCCESS) {
        // 删除
        for (let i = 0; i < list.value.length; i++) {
          if (list.value[i].id === order.id) {
            list.value.splice(i, 1);
            return;
          }
        }
        ElNotification.success({
          title: "删除提示",
          message: "订单和相关信息移除成功！",
        });
      }
      else {
        ElNotification.error({
          title: "删除失败，请稍后再试！",
        });
      }
    }
  }
  catch (e) {
    isLoading.value = false;
  }
  finally {
    isLoading.value = false;
  }
}
// 4、发起退款订单 CANCLEL
async function pushRefund(order: OrderInfoVO) {
  if (
    order.status !== OrdersStatus.PAID
    && order.status !== OrdersStatus.RECEIVED
    && order.status !== OrdersStatus.DELIVERED
  )
    return;
  try {
    const action = await ElMessageBox.confirm("确认发起退款？😢", "退款提示", {
      center: true,
      lockScroll: false,
      confirmButtonText: "退 款",
      confirmButtonClass: "el-button--danger border-default shadow-sm",
      cancelButtonText: "取 消",
    });
    if (action === "confirm") {
      isLoading.value = true;
      // 发起退款
      const { message, code } = await refundOrders(order.id, user.getToken);
      isLoading.value = false;
      if (code === StatusCode.SUCCESS) {
        order.updateTime = useDateFormat(Date.now(), "YYYY-MM-DD HH:mm:ss").value.toString();
        // 发起退款
        if (order.status === OrdersStatus.RECEIVED) {
          order.status = OrdersStatus.REFUND;
          ElNotification.success({
            title: "发起退款成功",
            message,
          });
        }
        else {
          // 未发货，直接退款
          order.status = OrdersStatus.REFUND_SUCCESS;
          ElNotification.success({
            title: "发起退款成功",
            message: "未发货，正在自动退款，请等待！",
          });
        }
      }
      else {
        ElNotification.error({
          title: "发起退款失败，请稍后再试！",
        });
      }
    }
  }
  catch (e) {
    isLoading.value = false;
  }
  finally {
    isLoading.value = false;
  }
}
// 5）确认收货 DELIVERED
async function checkDelivery(order: OrderInfoVO) {
  if (order.status !== OrdersStatus.DELIVERED)
    return;
  try {
    const action = await ElMessageBox.confirm("是否确认收货？", "收货提示", {
      center: true,
      confirmButtonText: "确 认",
      lockScroll: false,
      confirmButtonClass: "el-button--success border-default shadow-sm",
      cancelButtonText: "取 消",
    });
    if (action === "confirm") {
      isLoading.value = true;
      // 发起收货
      const { code } = await checkDeliveryOrders(order.id, user.getToken);
      isLoading.value = false;
      if (code === StatusCode.SUCCESS) {
        order.updateTime = useDateFormat(Date.now(), "YYYY-MM-DD HH:mm:ss").value.toString();
        order.status = OrdersStatus.RECEIVED;
        ElNotification.success({
          title: "收货成功",
          message: "收货确认成功！如有任何问题，请随时联系我们的客服。",
        });
      }
      else {
        ElNotification.error({
          title: "确认收货失败，请稍后再试！",
        });
      }
    }
  }
  catch (e) {
  }
  finally {
    isLoading.value = false;
  }
}
// 筛选
const isShow = ref<boolean>(false);
// 时间
const selectDate = ref("");
// 折叠收起
function changeDate() {
  const startTime = useDateFormat(selectDate.value[0], "YYYY-MM-DD HH:mm:ss").value.toString();
  const endTime = useDateFormat(selectDate.value[1], "YYYY-MM-DD HH:mm:ss").value.toString();
  params.value.startTime = startTime;
  params.value.endTime = endTime;
  reload();
}
</script>

<template>
  <el-scrollbar
    height="70vh"
    class="group px-2"
    style="overflow: auto"
  >
    <ListAutoIncre
      :immediate="true"
      :no-more="isNotMore || isNothing"
      :loading="isLoading"
      @load="loadOrdersPage"
    >
      <div class="mb-4 ml-a flex cursor-pointer items-center opacity-60 group-hover:opacity-100">
        <small w-6rem>筛选：</small>
        <div
          class="ml-a flex-row-c-c transform-origin-right scale-x-0 truncate py-1 transition-300 transition-transform"
          :class="{ 'scale-x-100': isShow }"
        >
          <el-date-picker
            v-model="selectDate"
            format="YYYY-MM-DD HH:mm:ss"
            type="datetimerange"
            size="small"
            start-placeholder="起 始"
            :time-arrow-control="true"
            end-placeholder="结 束"
            @change="changeDate"
          />
          <el-button
            size="small"
            ml-1
            md:ml-2
            @click="reloadSearch"
          >
            重置
          </el-button>
        </div>
        <el-button
          size="small"
          ml-1
          md:ml-2
          :type="isShow ? 'danger' : 'default'"
          @click="isShow = !isShow"
        >
          {{ isShow ? "收起" : "展开" }}
        </el-button>
      </div>
      <!-- 列表 -->
      <ul
        v-auto-animate="{ duration: 300, easing: 'cubic-bezier(0.61, 0.225, 0.195, 1.19)' }"
        class="relative"
      >
        <OrderInfoLine
          v-for="p in list"
          :key="p.id"
          :order="p"
          @submit="submit"
        />
      </ul>
      <template #done>
        <p
          v-show="!isNothing"
          class="w-1/1 py-4"


          text-center text-bluegray tracking-1
        >
          暂无更多订单
        </p>
        <p
          v-show="isNothing"
          class="w-1/1 py-4"


          text-center text-bluegray tracking-1
        >
          暂无订单，快去下单吧 ~
        </p>
      </template>
    </ListAutoIncre>
  </el-scrollbar>
</template>

<style scoped lang="scss"></style>
