<script lang="ts" setup>
import { graphic } from "echarts";
import VChart, { THEME_KEY } from "vue-echarts";
import type {
  BillsTimeTotalDTO,
  BillsTimeTotalVO,
} from "@/composables/api/user/bills";
import {
  BillsType,
  CurrencyType,
  TimeType,
  getBillsTotalTable,
} from "@/composables/api/user/bills";


provide(THEME_KEY, useColorMode());
const user = useUserStore();
// 参数
const dto = reactive<BillsTimeTotalDTO>({
  currencyType: CurrencyType.BALANCE,
  // type: null,
  timeType: TimeType.Day,
});
// 获取统计信息
const tableData = ref<BillsTimeTotalVO[]>([]);
const inData = computed(() => tableData.value.filter(p => p.type === BillsType.IN));
const outData = computed(() => tableData.value.filter(p => p.type === BillsType.OUT));
// 筛选
const timeTypeList = ref([
  { label: "按日", value: TimeType.Day },
  { label: "按月", value: TimeType.Month },
  { label: "按年", value: TimeType.Year },
]);

// echarts配置 图表数据
const option = ref<any>({
  color: ["#0bdb85", "#fc2929"],
  title: {
    textStyle: {
      fontFamily: "Alimama",
    },
  },
  tooltip: { trigger: "axis" },
  toolbox: {
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: {
    boundaryGap: false,
    type: "category",
    data: computed(() => [...new Set(tableData.value.map(p => p.time))]),
  },
  yAxis: {
    name: "金额（￥）",
    type: "value",
  },
  backgroundColor: "transparent",
  dataZoom: { type: "inside" },
  grid: {
    top: "14%",
    left: "9%",
    right: "9%",
    bottom: "9%",
    containLabel: false,
  },
  legend: {
    data: ["收入", "支出"],
  },
  series: [
    {
      name: "收入",
      data: computed(() => inData.value.map(p => p.total)),
      type: "line",
      smooth: true,
      areaStyle: {
        opacity: 0.8,
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: "rgba(11, 219, 133,0.5)",
          },
          {
            offset: 1,
            color: "rgba(22, 219, 133,0.1)",
          },
        ]),
      },
      stack: "x",
    },
    {
      name: "支出",
      data: computed(() => outData.value.map(p => p.total)),
      type: "line",
      areaStyle: {
        opacity: 0.8,
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: "rgba(252, 41, 41,0.4)",
          },
          {
            offset: 1,
            color: "rgba(252, 41, 41,0.1)",
          },
        ]),
      },
      smooth: true,
      stack: "x",
    },
  ],
});

// 加载
const isLoading = ref<boolean>(false);

/**
 * 重新加载
 */
async function onReload() {
  isLoading.value = true;
  tableData.value.splice(0);
  const { data, code } = await getBillsTotalTable({ ...dto }, user.getToken);
  // 懒加载
  const timer = setTimeout(() => {
    isLoading.value = false;
    if (code === StatusCode.SUCCESS)
      tableData.value.push(...data);

    clearTimeout(timer);
  }, 300);
}
onReload();
</script>

<template>
  <div class="h-full w-full flex flex-col rounded-14px p-5 shadow transition-300 v-card">
    <h3
      mb-2 flex md:mb-0
    >
      <i class="i-solar:align-bottom-bold-duotone mr-2 p-3" />
      账单统计
      <!-- 排序 -->
      <div class="z-1 ml-a">
        <el-select
          v-model="dto.timeType"
          :placeholder="dto.timeType || '按日'"
          size="small"
          class="select w-6em opacity-90"
          @change="onReload"
        >
          <el-option
            v-for="p in timeTypeList"
            :key="p.value"
            :label="p.label"
            :value="p.value"
          />
        </el-select>
      </div>
    </h3>
    <div
      v-if="!isLoading"
      h-380px min-w-300px flex-row-c-c overflow-hidden rounded-12px
    >
      <!-- 表格 -->
      <VChart
        v-loading="isLoading"
        autoresize
        class="h-full w-full flex-row-c-c rounded-3"
        :option="option"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.select {
  :deep(.el-input__wrapper) {
    box-shadow: none;
    .el-input__inner {
      color: var(--el-menu-text-color);
    }
  }
}
</style>
