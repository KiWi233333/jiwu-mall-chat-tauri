<script lang="ts" setup>
import type { CalendarDateType, CalendarInstance } from "element-plus";
import type { BillsInfoVO } from "@/composables/api/user/bills";
import { getBillsPage } from "@/composables/api/user/bills";

// 数据
const user = useUserStore();
const selectDay = ref<Date>(new Date());
const selectDayFormat = computed(() => {
  return useDateFormat(selectDay.value, "YYYY年M月DD日").value;
});
// 选中的月份开始和结束时间
const monthStartEndStr = computed((): string[] => {
  return getMonthStartEnd(selectDay.value).map(
    p => useDateFormat(p, "YYYY-MM-DD HH:mm:ss").value,
  );
});
const dayStartEndStr = computed((): string[] => {
  const date = new Date(selectDay.value.getTime());
  date.setHours(0, 0, 0, 0);
  return [
    useDateFormat(date, "YYYY-MM-DD HH:mm:ss").value,
    useDateFormat(date.setDate(date.getDate() + 1), "YYYY-MM-DD HH:mm:ss").value,
  ];
});

// 实例
const calendar = ref<CalendarInstance>();
function selectDate(val: CalendarDateType) {
  if (!calendar.value)
    return;
  calendar.value.selectDate(val);
}
// 筛选
const opt = reactive({
  isNowDay: false,
});

// 账单数据分页
const isLoading = ref<boolean>(false);
const isRefresh = ref<boolean>(false);
const page = ref<number>(0);
const size = ref<number>(6);
const billsList = ref<BillsInfoVO[]>([]);
const billsPage = ref<IPage<BillsInfoVO>>({
  records: [],
  total: -1,
  pages: -1,
  size: -1,
  current: -1,
});

const noMore = computed(() => {
  return billsPage.value.total > 0 && billsPage.value.pages === billsPage.value.current;
});
const isEmpty = computed(() => {
  return page.value > 0 && billsList.value.length === 0;
});
const dto = computed(() => {
  return opt.isNowDay
    ? { startTime: dayStartEndStr.value[0], endTime: dayStartEndStr.value[1] }
    : { startTime: monthStartEndStr.value[0], endTime: monthStartEndStr.value[1] };
});

const loadBills = useThrottleFn((scroll: { scrollTop: number; scrollLeft: number }) => {
  if (scroll?.scrollTop && scroll.scrollTop < 200 * page.value)
    return;
  getBillsPageApi();
}, 250);

/**
 * 请求api
 */
async function getBillsPageApi() {
  if (isLoading.value || noMore.value)
    return;

  isLoading.value = true;
  // 1、页数+1
  page.value++;
  // 2、请求
  const { data, code } = await getBillsPage(
    page.value,
    size.value,
    { ...dto.value },
    user.getToken,
  );
  isLoading.value = false;
  // 3、结果
  if (code === StatusCode.SUCCESS) {
    billsPage.value = { ...data };
    billsList.value.push(...data.records);
  }
}
// 重新加载
async function reloadBills() {
  isRefresh.value = true;
  billsList.value.splice(0);
  billsPage.value = {
    records: [],
    total: -1,
    pages: -1,
    size: -1,
    current: -1,
  };
  size.value = 6;
  page.value = 0;
  await getBillsPageApi();
  setTimeout(() => {
    isRefresh.value = false;
  }, 400);
}
watch(selectDay, () => {
  if (isLoading.value)
    return;
  opt.isNowDay = true;
  page.value = -1;
  reloadBills();
});
watch(
  opt,
  () => {
    if (isLoading.value)
      return;

    page.value = -1;
    reloadBills();
  },
  { deep: true },
);
onMounted(() => {
  getBillsPageApi();
});
</script>

<template>
  <div
    v-loading="isRefresh"
    class="bills-tabs grid grid-cols-1 overflow-hidden rounded-3 border-none p-5 shadow v-card"
  >
    <div class="top">
      <!-- 头部 -->
      <h3
        mb-2 text-center
      >
        账 单
      </h3>
      <!-- 日历 -->
      <div
        class="caledar select-none rounded-3 shadow-sm v-card dark:bg-dark-5 dark:opacity-90 dark:shadow"
      >
        <el-calendar
          ref="calendar"
          v-model="selectDay"
        >
          <template #header>
            <div class="w-full flex-row-bt-c cursor-pointer">
              <i
                class="i-solar:alt-arrow-left-line-duotone p-3 hover:scale-110"
                @click="selectDate('prev-month')"
              />
              <h3
                mt-1 w-full text-center
              >
                {{ selectDayFormat }}
              </h3>
              <i
                class="i-solar:alt-arrow-right-line-duotone p-3 hover:scale-110"
                @click="selectDate('next-month')"
              />
            </div>
          </template>
        </el-calendar>
      </div>
    </div>
    <!-- 账单列表 -->
    <div
      class="overflow-hidden rounded-3"
    >
      <div
        v-show="!opt.isNowDay"
        class="my-2 text-center opacity-90"
      >
        {{ selectDay.getFullYear() }}年{{ selectDay.getMonth() + 1 }}月的账单
      </div>
      <div
        v-show="opt.isNowDay"
        class="my-2 text-center opacity-90"
      >
        {{ selectDayFormat }}的账单
      </div>
      <div class="relative pt-2 leading-1.2em tracking-0.08em">
        <!-- 按钮 -->
        <div class="btns p-2">
          <small
            v-show="billsPage.total > 0" float-right inline
            pr-2
          >
            共{{ billsPage.total }}条
          </small>
          <small
            class="mr-2 cursor-pointer select-none rounded-6px px-2 py-1 border-default"
            :class="{ 'text-[var(--el-color-primary)]': opt.isNowDay }"
            @click="opt.isNowDay = true"
          >
            按日
          </small>
          <small
            class="mr-2 cursor-pointer select-none rounded-6px px-2 py-1 border-default"
            :class="{ 'text-[var(--el-color-primary)]': !opt.isNowDay }"
            @click="opt.isNowDay = false"
          >
            按月
          </small>
        </div>
        <!-- 滚动内容 -->
        <el-scrollbar
          height="300px"
          class="relative"
          @wheel="loadBills"
        >
          <UserWalBillsCard
            v-for="p in billsList"
            :key="p.id"
            :data="p"
          />
          <small
            v-show="isLoading"
            class="my-4 block w-full select-none text-center opacity-80"
            animate-pulse
          >
            加载中...
          </small>

          <small
            v-show="noMore"
            class="my-4 block w-full select-none text-center opacity-80"
          >
            暂无更多
          </small>
          <small
            v-show="isEmpty"
            class="my-4 block h-full w-full select-none text-center opacity-80"
          >
            暂无账单
          </small>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.caledar {
  $item-height: 2em;

  :deep(.el-calendar) {
    overflow: hidden;
    border-radius: 12px;
    border: none;

    .el-calendar__body {
      padding: 0 0.8rem 0.8rem 0.8rem;
      .el-calendar-table {
        thead {
          opacity: 0.5;
        }

        .el-calendar-day {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          border-radius: 50%;
          height: 2.8em;
          padding: 0;
          transition: $transition-delay;
          background-color: transparent;
        }
        .current {
          span {
            transition: 0.2s;
            width: $item-height;
            height: $item-height;
            line-height: $item-height;
            border-radius: 50%;
          }
          span:hover {
            background-color: var(--el-color-info);
            color: #fff;
          }

          &.is-selected {
            background-color: transparent;
            span {
              background-color: var(--el-color-info);
              color: #fff;
            }
          }
          &.is-today {
            background-color: transparent;
            span {
              background-color: var(--el-color-info-light-5);
              color: #fff;
            }
          }
        }
      }
    }
    * {
      border: none;
    }
  }
}

:deep(.el-checkbox) {
  transform: scale(1.1);
}
</style>
