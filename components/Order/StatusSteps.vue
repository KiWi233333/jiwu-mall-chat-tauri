<script lang="ts" setup>
import { OrdersStatus } from "~/composables/api/orders";

const props = defineProps<{
  active: OrdersStatus | number
  date: string
  color: string
}>();
const order = useOrderStore();
// 获取颜色
const getColorClass = computed(() => {
  return `color:var(--el-color-${props.color})`;
});
function delayOrder() {
  order.status = OrdersStatus.DELAY_CANCELED;
  order.orderInfo.status = OrdersStatus.DELAY_CANCELED;
  order.orderInfo.updateTime = useDateFormat(Date.now(), "YYYY-MM-DD HH:mm:ss").value.toString();
}
</script>

<template>
  <section class="mb-3 flex flex-col">
    <!-- 步骤条 -->
    <el-steps
      v-if="props.active > OrdersStatus.READY && props.active < OrdersStatus.CANCELED"
      class="mt-4"
      :style="getColorClass"
      :active="props.active + 1"
      align-center
    >
      <el-step
        title="提交订单"
        :icon="ElIconShoppingCartFull"
      />
      <el-step :icon="ElIconMoney">
        <template #icon>
          <i
            :class="{
              'text-[var(--el-color-danger)] ': active === OrdersStatus.UN_PAID,
            }"

            i-solar:sale-broken p-3.4
          />
        </template>
        <template #title>
          <strong
            :class="{
              'text-[var(--el-color-danger)] ': active === OrdersStatus.UN_PAID,
            }"
          >
            待支付
          </strong>
        </template>
        <template #description>
          <OrderDelayTimer
            v-if="active === OrdersStatus.UN_PAID"
            :date="new Date(props.date)"
            class="font-600 text-[var(--el-color-danger)]"
            @delay="delayOrder"
          />
        </template>
      </el-step>
      <el-step
        title="待发货"
        description="48小时内发货"
        :icon="ElIconCreditCard"
      />
      <el-step
        title="待收货"
        :icon="ElIconVan"
      />
      <el-step
        title="待评价"
        :icon="ElIconChatDotSquare"
      />
    </el-steps>
    <!-- 3、发货信息 -->
    <section
      v-if="props.active === OrdersStatus.DELIVERED"
      class="mt-4 border-0 border-t-1px rounded-0 pl-2 pt-4 border-default md:pl-12"
    >
      <OrderTimeLine :order-info="order.orderInfo" />
    </section>
    <!-- 5、6订单取消 -->
    <section
      v-if="props.active === OrdersStatus.DELAY_CANCELED || props.active === OrdersStatus.CANCELED"
      class="text-[var(--el-color-primary)]"


      flex items-center px-3 leading-2em
    >
      <i


        i-solar:clock-circle-broken mx-4 mr-6 p-4
      />
      <div class="flex flex-1 flex-col">
        <h3 v-if="props.active === OrdersStatus.DELAY_CANCELED">
          订单已超时 自动取消，欢迎下次选购！
        </h3>
        <h3 v-if="props.active === OrdersStatus.CANCELED">
          订单已取消，欢迎下次选购！
        </h3>
        <small>{{ order.orderInfo.updateTime }}</small>
      </div>
    </section>
    <!-- 8、退款中 -->
    <section
      v-if="props.active === OrdersStatus.REFUND"
      flex
      flex-col
      leading-1.6em
    >
      <h3 mb-2>
        退款中，请等待商家处理！
      </h3>
      <small>最后更新：{{ order.orderInfo.updateTime }}</small>
    </section>
    <!-- 9、退款成功 -->
    <section
      v-if="props.active === OrdersStatus.REFUND_SUCCESS"
      flex
      flex-col
      leading-1.6em
    >
      <h3 mb-2>
        退款成功，请注意查收退款金额！
      </h3>
      <small>退款时间：{{ order.orderInfo.updateTime }}</small>
    </section>
  </section>
</template>

<style scoped lang="scss">
:deep(.el-step) {
  .is-finish {
    &,
    * {
      font-weight: 500;
      color: inherit;
      border-color: inherit;
    }
    opacity: 0.9;
    .el-step__line {
      border: 1px solid;
      height: 1px;
      overflow: hidden;
      opacity: 0.8;
      background-color: transparent;
    }
  }
  .is-process {
    &,
    * {
      color: inherit;
      border-color: inherit;
      font-weight: 700;
    }
    transform: scale(1.06);
  }
}

@media screen and (max-width: 768px) {
  :deep(.el-step__main) {
    .el-step__title {
      font-size: 0.8rem;
    }
    .el-step__description {
      transform: scale(0.8);
      text-align: center;
      white-space: nowrap;
      padding: 0;
    }
  }
}
</style>
