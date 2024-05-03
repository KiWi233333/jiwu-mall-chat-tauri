<script lang="ts" setup>
import currency from "currency.js";
import { type OrderInfoVO } from "~/composables/api/orders";

const props = defineProps<{
  order: OrderInfoVO
}>();
const emit = defineEmits(["submit"]);
const { order } = toRefs(props);
// sotre
const store = useOrderStore();

interface BtnType {
  title?: string
  type?: any
  fn?: () => void
}
// 订单状态
const types = computed(() => {
  const data: {
    banner: string
    type: any
    btns: BtnType[]
  } = {
    banner: "",
    type: "",
    btns: [],
  };

  switch (order.value.status) {
    case OrdersStatus.UN_PAID:
      data.banner = "待付款";
      data.btns = [
        {
          title: "取 消",
          type: "default",
          fn: () => {
            emit("submit", "cancel", order.value);
          },
        },
        {
          title: "修 改",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
        {
          title: "立即付款",
          type: "danger",
          fn: () => {
            toDetail(order.value);
          },
        },
      ];
      data.type = "danger";
      break;
    case OrdersStatus.PAID:
      data.banner = "已付款，等待发货";
      data.type = "primary";
      data.btns = [
        {
          title: "退 款",
          type: "default",
          fn: () => {
            emit("submit", "pushRefund", order);
          },
        },
        {
          title: "催发货",
          type: "primary",
          fn: () => {
            emit("submit", "toastDelivery");
          },
        },
      ];
      break;
    case OrdersStatus.DELIVERED:
      data.banner = "已发货，请等待物流";
      data.type = "info";
      data.btns = [
        {
          title: "退 款",
          type: "default",
          fn: () => {
            toDetail(order.value);
            // emit("submit", "pushRefund", order);
          },
        },
        {
          title: "确认收货",
          type: "info",
          fn: () => {
            toDetail(order.value);
            // emit("submit", "checkDelivery", order);
          },
        },
      ];
      break;
    case OrdersStatus.RECEIVED:
      data.banner = "已确认收货，期待你的评价！";
      data.type = "info";
      data.btns = [
        {
          title: "再来一单",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
        {
          title: "去评价",
          type: "info",
          fn: () => {
            toCommon();
          },
        },
      ];
      break;
    case OrdersStatus.COMMENTED:
      data.banner = "已完成评论，欢迎下次光临！";
      data.type = "success";
      data.btns = [
        {
          title: "再来一单",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
      ];
      break;
    case OrdersStatus.CANCELED:
      data.banner = "订单已取消";
      data.type = "danger";
      data.btns = [
        {
          title: "删除订单",
          type: "danger",
          fn: () => {
            emit("submit", "toDelete", order.value);
          },
        },
        {
          title: "再来一单",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
      ];
      break;
    case OrdersStatus.DELAY_CANCELED:
      data.banner = "订单超时，已自动取消";
      data.type = "danger";
      data.btns = [
        {
          title: "删除订单",
          type: "danger",
          fn: () => {
            emit("submit", "toDelete", order.value);
          },
        },
        {
          title: "再来一单",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
      ];
      break;
    case OrdersStatus.REFUND:
      data.banner = "发起退款中，等等卖家处理...";
      data.type = "";
      data.btns = [
        {
          title: "处理中，请稍后",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
      ];
      break;
    case OrdersStatus.REFUND_SUCCESS:
      data.banner = "退款成功，请注意到账！";
      data.type = "info";
      data.btns = [
        {
          title: "已退款",
          type: "default",
          fn: () => {
            toDetail(order.value);
          },
        },
      ];
      break;
  }
  return data;
});

// 订单按钮样式
const priceClass = computed(() => {
  return `text-[var(--el-color-${types.value.type || "default"})]`;
});
// 1、去到详情页
function toDetail(o: OrderInfoVO = order.value) {
  store.$patch({
    orderId: o.id,
    status: o.status,
    orderInfo: { ...o },
    pushOrderItems: [
      ...o.ordersItems.map((p) => {
        return {
          skuId: p.skuId,
          quantity: p.quantity,
          // couponId: p?.couponId,
          shopId: p?.shopId,
          activityId: p?.activityId,
        };
      }),
    ],
    unPaidVO: {
      finalPrice: o.totalPrice,
      reducePrice: currency(o.totalPrice).subtract(o.spendPrice).value,
    },
  });
  setTimeout(() => {
    navigateTo(`/order/detail?id=${o.id}`, {
      open: {
        target: "_blank",
      },
    });
  }, 50);
}

// 2、去评价
function toCommon() {
  if (order.value.status !== OrdersStatus.RECEIVED)
    return;
  navigateTo({
    path: `/order/comment/${order.value.id}`,
  });
}
// 计算优惠价
const getReduce = computed(() => {
  if (order.value.spendPrice)
    return currency(order.value.totalPrice).subtract(order.value.spendPrice);
  else
    return null;
});

function delayOrder() {
  order.value.status = OrdersStatus.DELAY_CANCELED;
  order.value.updateTime = useDateFormat(Date.now(), "YYYY-MM-DD HH:mm:ss").value.toString();
}
</script>

<template>
  <div
    class="group mb-6 rounded-10px bg-white p-4 tracking-0.1em shadow-none backdrop-blur-2rem transition-300 border-default dark:bg-dark-400 active:shadow hover:shadow"
  >
    <!-- 顶部 -->
    <span class="flex items-center border-0 border-b-1px pb-2 border-default">
      <i class="i-solar:shop-bold-duotone mr-2 bg-[var(--el-color-primary)] p-2 opacity-50" />
      <small font-600>极物圈</small>
      <div ml-a>
        <el-text
          :type="types.type"
          class="flex"
        >
          <span
            v-if="order.status === OrdersStatus.UN_PAID"
            flex
            items-center
          >
            <OrderDelayTimer
              :date="new Date(order.createTime)"
              @delay="delayOrder"
            />
            ，
          </span>
          <span>{{ types.banner }}</span>
        </el-text>
      </div>
    </span>
    <!-- 子订单 -->
    <div
      v-for="p in order.ordersItems"
      :key="p.skuId"
      class="flex cursor-pointer items-center"
      my-4
      @click="toDetail(order)"
    >
      <ClientOnly>
        <card-el-image
          loading="lazy"
          fit="cover"
          :src="BaseUrlImg + p.goodsSku.image"
          class="h-4.5rem w-4.5rem overflow-hidden rounded-8px transition-300 md:h-7.2rem md:w-7.2rem border-default hover:shadow"
        />
      </ClientOnly>
      <!-- 中间 -->
      <div
        class="center flex flex-1 flex-col overflow-hidden truncate px-2 text-0.8rem leading-1.6em md:px-4 md:text-1rem md:leading-1.8em"
      >
        <strong flex-1 truncate>
          {{ p.goods.name }}
          <el-tag
            v-if="p.activityId"
            type="danger" size="small" opacity-80
          >
            活动
          </el-tag>
        </strong>
        <small truncate>
          {{ [p.goodsSku.size, p.goodsSku.color, p.goodsSku.combo].filter((p) => p).join(" | ") }}
        </small>
        <small
          ml-a inline flex flex-col justify-end
        >
          <div
            ml-a hidden line-through opacity-80 md:block
          >
            ￥{{ currency(p.goodsSku.price) }}
          </div>
          <div
            class="text-1.2em font-600"
            opacity-80
            :class="priceClass"
          >
            ￥{{ currency(p.goodsSku.price) }}
          </div>
        </small>
      </div>
      <!-- 价格 -->
      <span
        ml-4 h-full flex items-center font-600
      >
        X{{ p.quantity }}
      </span>
    </div>
    <!-- 总价 -->
    <div class="mt-4 w-full flex flex-col">
      <div flex-row-bt-c>
        <BtnCopyText
          hidden
          md:inline
          class="opacity-0 opacity-80 hover:underline group-hover:opacity-70"
          :text="order.id"
          pretext="订单号："
        />
        <small
          v-if="getReduce && getReduce.value > 0"
          class="mb-2 ml-a"
        >
          -￥{{ getReduce }}
        </small>
      </div>
      <div flex-row-bt-c>
        <!-- <small class="hidden opacity-60 md:inline">创建于{{ order.createTime }}</small> -->
        <span
          ml-a flex text-1.2rem font-600
        >
          <small text-0.85rem>总计：</small>
          <div :class="priceClass">
            ￥{{ getReduce ? currency(order.spendPrice) : currency(order.totalPrice) }}
          </div>
        </span>
      </div>
    </div>
    <!-- 按钮 -->
    <div
      mt-3
      flex-row-bt-c
      tracking-0.3em
    >
      <div class="left flex cursor-pointer items-center">
        <i
          i-solar:headphones-square-broken bg-dark p-1.8 dark:bg-light
        />
        <small class="mx-2 hover:text-[var(--el-color-primary)] hover:underline">客服</small>
      </div>
      <div class="btns">
        <el-button
          v-for="p in types.btns"
          :key="p.title"
          class="ml-2 hover:-translate-y-0.15em"
          :type="p.type || 'default'"
          @click="(p.fn || toDetail)()"
        >
          {{ p.title }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.btns {
  :deep(.el-button) {
    letter-spacing: 0.12em;
  }
}
</style>
