<script lang="ts" setup>
const props = withDefaults(defineProps<{
  modelValue: string
}>(), {
  modelValue: "",
});

const emit = defineEmits(["update:modelValue"]);
const user = useUserStore();

// 关键字
const value = ref<string>(props.modelValue);
// 商品分类
const categoryList = ref<CommCategory[]>([]);
const isCateLoading = ref<boolean>(false);
/**
 * 加载数据
 */
async function loadData() {
  const { data } = await getCommCategory();
  if (data.value?.code === StatusCode.SUCCESS)
    categoryList.value = data.value?.data || [];
}
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center border-gray-400">
      <el-select
        v-model="value"
        no-data-text="没有数据"
        :multiple="false"
        filterable
        clearable
        v-bind="$attrs"
        :placeholder="$attrs?.placeholder as string || '选择发布的圈子'"
        :loading="isCateLoading"
        @focus="loadData"
        @change="(val) => $emit('update:modelValue', val)"
      >
        <el-option
          v-for="p in categoryList"
          :key="p.id"
          :label="p.name"
          :value="p.id"
          style="height: fit-content;"
        >
          <div
            min-h-4rem flex items-center gap-2 text-center md:gap-4
          >
            <div class="h-2rem w-2rem">
              <card-el-image
                fit="cover"
                class="card-default"
                loading="lazy"
                :src="BaseUrlImg + p.image"
              />
            </div>
            <span truncate>
              {{ p?.name }}
            </span>
          </div>
        </el-option>
      </el-select>
    </div>
    <slot :data="categoryList" />
  </div>
</template>


