<script lang="ts" setup>
import type { OrderInfoVO } from "@/composables/api/orders";

const props = defineProps<{
  orderInfo: OrderInfoVO
}>();
const user = useUserStore();
const isFold = ref<boolean>(false);
// list
const list = ref<
  {
    active: number
    time: string
    title: string
  }[]
>([
  {
    active: 1,
    time: props.orderInfo.createTime,
    title: "创建订单",
  },
]);
const delivery = useAsyncData(async () => {
  const { data, code } = await getBillsPage(
    1,
    1,
    {
      orderId: props.orderInfo.id,
      type: BillsType.OUT,
    },
    user.getToken,
  );
  if (code !== StatusCode.SUCCESS)
    return;

  if (data.records.length > 0) {
    list.value.push({
      active: 2,
      title: "已支付，待发货",
      time: data.records[0].createTime,
    });
  }
  // 订单
  const delivery = await getDelivertOrders(props.orderInfo.id, user.getToken);
  return delivery.data;
});
defineExpose({
  reload: delivery.refresh,
});
</script>

<template>
  <section>
    <el-timeline>
      <el-timeline-item
        v-for="p in list"
        :key="p.active"
        color="var(--el-color-success-light-3)"
        :timestamp="p.time"
      >
        {{ p.title }}
      </el-timeline-item>
      <el-timeline-item
        v-show="delivery.data.value"
        :timestamp="delivery.data.value?.createTime"
        color="var(--el-color-success-light-3)"
      >
        <template #default>
          <div>
            <div class="el-timeline-item__content pb-1">
              已发货，
              <span
                v-copying.toast="delivery.data.value?.deliveryNum"
                class="mr-2 cursor-pointer select-none text-[var(--el-color-success)] active:underline hover:underline"
              >
                {{ delivery.data.value?.deliveryNum }}
              </span>
              <el-text
                size="small"
                class="cursor-pointer select-none active:underline hover:underline"
                :type="isFold ? 'danger' : ''"
                @click="isFold = !isFold"
              >
                {{ isFold ? "折叠" : "展开" }}
              </el-text>
            </div>
            <div
              :class="{ 'h-6em': isFold }"
              class="h-0 flex flex-col overflow-hidden rounded-6px pt-1 leading-1.4em opacity-90 transition-height"
            >
              <small>订单号：{{ delivery.data.value?.deliveryNum }}</small>
              <small>快递单号：{{ delivery.data.value?.deliveryNum }}</small>
              <small>收货地址：{{ delivery.data.value?.sendAddress }}</small>
              <small>发货地址：{{ delivery.data.value?.deliverAddress }}</small>
            </div>
          </div>
        </template>
      </el-timeline-item>
      <slot :data="delivery" />
    </el-timeline>
  </section>
</template>

<style scoped lang="scss"></style>
