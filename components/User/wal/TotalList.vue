<script lang="ts" setup>
import type { LineWalletDataType } from "./TotalCard.vue";
import type { BillsTotalVO } from "@/composables/api/user/bills";
import { getBillsTotal } from "@/composables/api/user/bills";
import { getUserLeave } from "@/composables/utils";

const user = useUserStore();
const isLoading = ref<boolean>(true);
// 账单统计
const totalData = reactive<TotalVO>({ totalIn: 0, totalOut: 0, monthTotal: 0 });

interface TotalVO extends BillsTotalVO {
  monthTotal?: number
}
const monthTime = getMonthStartEnd();
// 获取总消费和总收入
async function getAllTotals() {
  const { data, code } = await getBillsTotal(
    {
      currencyType: 0,
    },
    user.getToken,
  );
  if (code === StatusCode.SUCCESS) {
    if (data?.totalIn)
      totalData.totalIn = data?.totalIn;
    if (data?.totalOut)
      totalData.totalOut = data?.totalOut;
  }
}

// 获取月份的统计
async function getMonthTotals() {
  const { data, code } = await getBillsTotal(
    {
      type: 0,
      currencyType: 0,
      startTime: useDateFormat(monthTime[0], "YYYY-MM-DD hh:mm:ss").value,
      endTime: useDateFormat(monthTime[1], "YYYY-MM-DD hh:mm:ss").value,
    },
    user.getToken,
  );
  if (code === StatusCode.SUCCESS) {
    // 本月支出
    if (data?.totalOut)
      totalData.monthTotal = data?.totalOut;
  }
}
async function reloadData() {
  isLoading.value = true;
  await getAllTotals();
  await getMonthTotals();
  isLoading.value = false;
}
await reloadData();
// 监听重新查询
watch(
  user.userWallet,
  async () => {
    await reloadData();
  },
  { deep: true, immediate: true },
);

// 列表配置项
const list = ref<LineWalletDataType[]>([
  {
    title: "总支出",
    name: "支出",
    amount: computed(() => totalData.totalOut),
    percentage: computed(() => {
      const sum = ((totalData.totalOut || 0) / 10000) * 100;
      return sum >= 100 ? 100 : sum;
    }),
    isIncreAnimate: true,
    isInt: false,
    lightColor: "var(--el-color-error)",
    class: "  dark:bg- dark:text-bluegray-2",
  },

  {
    title: "总收入",
    name: "收入",
    amount: computed(() => totalData.totalIn),
    percentage: computed(() => {
      const sum = ((totalData.totalIn || 0) / 10000) * 100;
      return sum >= 100 ? 100 : sum;
    }),
    isIncreAnimate: true,
    isInt: false,
    lightColor: "var(--el-color-info)",
    class: "   dark:text-bluegray-2",
  },
  {
    title: "本月消费",
    name: `${monthTime[0].getMonth() + 1}月`,
    amount: computed(() => totalData.monthTotal),
    percentage: (monthTime[0].getMonth() + 1) / 12,
    isIncreAnimate: true,
    isInt: false,
    class: "  dark:text-bluegray-2",
  },
]);
const pointsData = ref({
  title: "积分剩余",
  name: computed(() => {
    return `${getUserLeave(user.userWallet.points)}级`;
  }),
  amount: computed(() => user.userWallet.points || 0),
  percentage: computed(() => {
    return (getUserLeave(user.userWallet.points) / 6) * 100;
  }),
  isIncreAnimate: true,
  isInt: true,
  lightColor: "#facc15",
  class: "  dark:text-bluegray-2",
});
</script>

<template>
  <div class="cards">
    <UserWalTotalCard
      v-for="p in list"
      :key="p.title"
      class="v-card w-full cursor-pointer rounded-14px shadow-sm transition-200 hover:scale-104"
      :data="p"
    />
    <!-- 积分 -->
    <UserWalTotalCard
      class="w-full cursor-pointer rounded-14px shadow-sm transition-200 hover:scale-104"
      :data="pointsData"
    >
      <template #default>
        <el-popover
          :width="160"
          trigger="hover"
        >
          <template #reference>
            <small


              mt-2 cursor-pointer text-bluegray underline
            >
              如何获取积分?
            </small>
          </template>
          <li>1、通过钱包额度充值</li>
          <li>2、通过每日签到</li>
        </el-popover>
      </template>
    </UserWalTotalCard>
  </div>
</template>

<style scoped lang="scss"></style>
