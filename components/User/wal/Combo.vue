<script lang="ts" setup>
import currency from "currency.js";
import type {
  AddWalletDTO,
  WalletComboVO,
} from "@/composables/api/user/wallet";
import {
  RechangeType,
  addUserWallet,
  getWalletCombo,
} from "@/composables/api/user/wallet";

const user = useUserStore();
// 套餐数据
const comboList = ref<WalletComboVO[]>([]);

async function loadData() {
  const res = await getWalletCombo(user.getToken);

  if (res.code === StatusCode.SUCCESS)
    comboList.value = res.data;
}
loadData();
// 是否loading
const isLoading = ref<boolean>(false);

// 自定义充值金额
const amount = ref<number>(0);
/**
 *充值
 */
async function onRechange() {
  if (!amount.value)
    return ElMessage.error("充值金额不能为空!");

  if (+amount?.value < 5 || +amount?.value > 10000)
    return ElMessage.error("充值金额必须在5-10000之间！");

  ElMessageBox.confirm(`是否确认充值 ￥${amount.value}?`, "自由充值", {
    confirmButtonText: "确认",
    lockScroll: false,
    cancelButtonText: "取消",
    type: "info",
  })
    .then(async (status) => {
      if (status === "confirm") {
        isLoading.value = true;
        // 请求
        if (
          await toUserRechange({
            type: RechangeType.AUTO,
            amount: +amount.value,
          })
        ) {
          isLoading.value = false;
          return ElMessage.success("充值成功，注意到账！💰");
        }
        else {
          isLoading.value = false;
          return ElMessage.error("充值失败，请稍后重试！");
        }
      }
    })
    .catch(() => {});
}
/**
 *充值套餐
 * @param obj 钱包参数
 */
function onRechangeByCombo(obj: WalletComboVO) {
  ElMessageBox.confirm(`充值${obj.amount}送${obj.points}积分！`, "套餐充值", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    lockScroll: false,
    type: "info",
  })
    .then(async (status) => {
      if (status === "confirm") {
        isLoading.value = true;
        // 请求
        if (await toUserRechange({ type: RechangeType.COMBO, id: `${obj.id}` })) {
          ElMessage.success("充值成功！");
          user.loadUserWallet(user.getToken);
        }
        else {
          ElMessage.success("充值失败，请稍后重试！");
        }
        isLoading.value = false;
      }
    })
    .catch(() => {});
}
/**
 * 充值api
 */
async function toUserRechange(dto: AddWalletDTO): Promise<boolean> {
  const { code } = await addUserWallet({ ...dto }, user.getToken);
  return code === StatusCode.SUCCESS;
}
</script>

<template>
  <div
    v-loading.fullscreen.lock="isLoading"
    class="w-full"
  >
    <h3 mt-4>
      <i
        i-solar:gamepad-charge-broken mr-2 p-3
      />
      充值套餐
    </h3>
    <small
      mb-4 mt-2 block px-1 opacity-70
    >
      充值对应套餐有优惠 💰
    </small>
    <div max-h-400px>
      <el-scrollbar :height="280" tag="div">
        <div class="grid grid-cols-3 mr-2 grid-gap-3">
          <div
            v-for="p in comboList"
            :key="p.id" style="aspect-ratio: 1/1"

            flex-row-c-c flex-col cursor-pointer border-2px rounded-14px text-bluegray-700 leading-1.8em transition-300 active:scale-95 border-default-dashed hover:border-solid dark:text-bluegray-200
            class="hover:border-[var(--el-color-success)] hover:bg-[var(--el-color-success)] hover:text-white hover:shadow-md"
            @click="onRechangeByCombo(p)"
          >
            <h3 text-center>
              ￥{{ currency(p.amount).divide(p.discount).value }}
            </h3>
            <small class="text-0.8em line-through opacity-70">原价￥{{ p.amount }}</small>
            <small class="block text-center text-0.7em leading-1.5em opacity-90 group-hover:text-[var(--el-color-warning)]">
              赠送{{ p.points }}积分
            </small>
          </div>
          <div
            class="flex-row-c-c flex-shrink-0 cursor-pointer border-2px rounded-3 p-4 text-bluegray-700 leading-2.4em transition-300 active:scale-95 border-default-dashed dark:text-bluegray-200 dark-hover:bg-dark"
          >
            期待更多
          </div>
        </div>
      </el-scrollbar>
    </div>
    <!-- 输入框充值 -->
    <small class="mx-1 mt-4 block opacity-90">自定义充值（单位：￥）</small>
    <div class="mt-4 flex items-center">
      <el-input-number
        v-model="amount"
        class="mr-4"
        :min="5"
        :max="10000"
        controls-position="right"
      />
      <el-button
        value="充 值"
        class="px-4 border-default"
        type="info"
        @click="onRechange()"
      >
        充 值
      </el-button>
      <small

        tracking-0.1em opacity-80
      >
        （5-10000元额度）
      </small>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
