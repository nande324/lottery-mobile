<template>
  <div class="default-numbers-view">
    <!-- 头部 -->
    <div class="page-header">
      <h1>我的号码</h1>
      <t-button theme="primary" size="small" @click="showAddSheet = true">
        <template #icon><t-icon name="add" /></template>
        添加
      </t-button>
    </div>

    <!-- 列表 -->
    <t-loading
      v-if="loading && !defaultNumbers.length"
      size="small"
      style="padding: 40px"
    />
    <t-empty
      v-else-if="!defaultNumbers.length"
      description="暂无收藏号码，点击上方添加"
    />
    <div v-else class="numbers-list">
      <div v-for="num in defaultNumbers" :key="num.id" class="number-item">
        <div class="item-header">
          <span class="item-name">{{ num.name }}</span>
          <span class="item-mode">{{ getModeName(num.modeId) }}</span>
        </div>
        <div class="item-numbers">
          <span
            v-for="n in parseNumbers(num.redNumbers)"
            :key="`r${n}`"
            class="number-ball number-ball--red"
            >{{ String(n).padStart(2, "0") }}</span
          >
          <span v-if="parseNumbers(num.blueNumbers).length" class="separator"
            >|</span
          >
          <span
            v-for="n in parseNumbers(num.blueNumbers)"
            :key="`b${n}`"
            class="number-ball number-ball--blue"
            >{{ String(n).padStart(2, "0") }}</span
          >
        </div>
        <div class="item-actions">
          <t-button variant="outline" size="small" @click="editNumber(num)"
            >编辑</t-button
          >
          <t-button
            theme="danger"
            variant="outline"
            size="small"
            @click="deleteNumber(num)"
            >删除</t-button
          >
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <t-popup
      v-model:visible="showAddSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', height: '70%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>{{ editingNumber ? "编辑号码" : "添加号码" }}</span>
          <t-icon name="close" @click="closeAddSheet" />
        </div>
        <div class="form-content">
          <t-cell-group>
            <t-cell title="号码名称">
              <template #note>
                <t-input
                  v-model="form.name"
                  placeholder="如：生日号、幸运数字"
                />
              </template>
            </t-cell>
            <t-cell title="彩票模式" @click="openModePicker">
              <template #note>
                <span class="picker-value">{{
                  getModeName(form.modeId) || "请选择"
                }}</span>
              </template>
            </t-cell>
            <t-cell title="红球号码">
              <template #note>
                <div class="number-input-wrapper">
                  <t-input
                    v-model="form.redNumbers"
                    :placeholder="redPlaceholder"
                  />
                  <t-button size="small" @click="openNumberPicker('red')"
                    >选择</t-button
                  >
                </div>
              </template>
            </t-cell>
            <t-cell title="蓝球号码">
              <template #note>
                <div class="number-input-wrapper">
                  <t-input
                    v-model="form.blueNumbers"
                    :placeholder="bluePlaceholder"
                  />
                  <t-button size="small" @click="openNumberPicker('blue')"
                    >选择</t-button
                  >
                </div>
              </template>
            </t-cell>
          </t-cell-group>
        </div>
        <div class="popup-footer">
          <t-button variant="outline" block @click="closeAddSheet"
            >取消</t-button
          >
          <t-button theme="primary" block @click="saveNumber">{{
            editingNumber ? "保存" : "添加"
          }}</t-button>
        </div>
      </div>
    </t-popup>

    <!-- 模式选择器 -->
    <t-popup v-model:visible="showModePicker" placement="bottom">
      <div class="mode-picker-header">
        <span>选择彩票模式</span>
        <t-icon name="close" @click="showModePicker = false" />
      </div>
      <t-picker
        :columns="modePickerColumns"
        @confirm="onModeConfirm"
        @cancel="showModePicker = false"
        :default-value="form.modeId ? [form.modeId] : []"
      />
    </t-popup>

    <!-- 号码选择器 -->
    <t-popup
      v-model:visible="showNumberPicker"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', height: '70%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>选择{{ pickerType === "red" ? "红球" : "蓝球" }}号码</span>
          <t-icon name="close" @click="showNumberPicker = false" />
        </div>
        <div class="number-picker-body">
          <div class="picker-header">
            <span class="picker-title"
              >请选择 {{ pickerType === "red" ? "红" : "蓝" }}球号码</span
            >
            <span class="picker-count"
              >{{ selectedNumbers.length }} / {{ requiredCount }}</span
            >
          </div>
          <div class="number-grid">
            <div
              v-for="n in availableNumbers"
              :key="n"
              :class="[
                'grid-item',
                {
                  'grid-item--selected': selectedNumbers.includes(n),
                  'grid-item--red': pickerType === 'red',
                  'grid-item--blue': pickerType === 'blue',
                },
              ]"
              @click="toggleNumber(n)"
            >
              {{ String(n).padStart(2, "0") }}
            </div>
          </div>
          <div class="picker-footer">
            <t-button variant="outline" block @click="clearNumbers"
              >清空选择</t-button
            >
            <t-button
              theme="primary"
              block
              :disabled="selectedNumbers.length !== requiredCount"
              @click="confirmNumberPicker"
              >确认选择</t-button
            >
          </div>
        </div>
      </div>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ToastPlugin } from "tdesign-mobile-vue";
const $toast = ToastPlugin;
import { defaultNumberApi, lotteryModeApi } from "@/api";
import type { LotteryMode } from "@/types";

// 数据
const loading = ref(false);
const defaultNumbers = ref<
  {
    id: number;
    modeId: number;
    name: string;
    redNumbers: string;
    blueNumbers: string;
  }[]
>([]);
const modes = ref<LotteryMode[]>([]);

// 弹窗状态
const showAddSheet = ref(false);
const showModePicker = ref(false);
const showNumberPicker = ref(false);
const editingNumber = ref<{
  id: number;
  modeId: number;
  name: string;
  redNumbers: string;
  blueNumbers: string;
} | null>(null);

// 表单数据
const form = reactive({
  name: "",
  modeId: null as number | null,
  redNumbers: "",
  blueNumbers: "",
});

// 号码选择器相关
const pickerType = ref<"red" | "blue">("red");
const selectedNumbers = ref<number[]>([]);

// 计算属性
const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));
const modePickerColumns = computed(() => [
  drawModes.value.map((m) => ({ label: m.name, value: m.id })),
]);

const currentMode = computed(() =>
  modes.value.find((m) => Number(m.id) === Number(form.modeId)),
);
const redPlaceholder = computed(() =>
  currentMode.value
    ? `请输入${currentMode.value.redCount}个红球号码（${currentMode.value.redMin}-${currentMode.value.redMax}）`
    : "请先选择彩票模式",
);
const bluePlaceholder = computed(() =>
  currentMode.value && currentMode.value.blueCount > 0
    ? `请输入${currentMode.value.blueCount}个蓝球号码（${currentMode.value.blueMin}-${currentMode.value.blueMax}）`
    : "无蓝球",
);

const availableNumbers = computed(() => {
  if (!currentMode.value) return [];
  const config =
    pickerType.value === "red"
      ? { min: currentMode.value.redMin, max: currentMode.value.redMax }
      : { min: currentMode.value.blueMin, max: currentMode.value.blueMax };
  return Array.from(
    { length: config.max - config.min + 1 },
    (_, i) => config.min + i,
  );
});

const requiredCount = computed(() => {
  if (!currentMode.value) return 0;
  return pickerType.value === "red"
    ? currentMode.value.redCount
    : currentMode.value.blueCount;
});

// 方法
function getModeName(modeId: number | null) {
  if (!modeId) return "请选择";
  return modes.value.find((m) => m.id === modeId)?.name || `模式${modeId}`;
}

function parseNumbers(numbers: string) {
  if (!numbers) return [];
  return numbers
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
}

async function loadData() {
  loading.value = true;
  try {
    const [modesRes, numbersRes] = await Promise.all([
      lotteryModeApi.list(),
      defaultNumberApi.list(),
    ]);
    // 解析响应数据：axios response 的 data 字段是 { code, message, data }
    const modesData = modesRes.data?.data || [];
    const numbersData = numbersRes.data?.data || [];
    // 确保是数组
    modes.value = Array.isArray(modesData) ? modesData : [];
    // 为每个默认号码添加模式名称
    defaultNumbers.value = (Array.isArray(numbersData) ? numbersData : []).map(
      (num) => ({
        ...num,
        modeName:
          modes.value.find((m) => m.id === num.modeId)?.name || "未知模式",
      }),
    );
  } catch (error) {
    console.error("Load data error:", error);
    $toast({ message: "加载失败", theme: "error" });
  } finally {
    loading.value = false;
  }
}

function closeAddSheet() {
  showAddSheet.value = false;
  editingNumber.value = null;
  form.name = "";
  form.modeId = null;
  form.redNumbers = "";
  form.blueNumbers = "";
}

function editNumber(num: (typeof defaultNumbers.value)[0]) {
  editingNumber.value = num;
  form.name = num.name;
  form.modeId = num.modeId;
  form.redNumbers = num.redNumbers;
  form.blueNumbers = num.blueNumbers || "";
  showAddSheet.value = true;
}

async function deleteNumber(num: (typeof defaultNumbers.value)[0]) {
  try {
    await defaultNumberApi.delete(num.id);
    defaultNumbers.value = defaultNumbers.value.filter((n) => n.id !== num.id);
    $toast({ message: "删除成功", theme: "success" });
  } catch (error) {
    $toast({ message: "删除失败", theme: "error" });
  }
}

async function saveNumber() {
  if (!form.name.trim()) {
    $toast({ message: "请输入号码名称", theme: "warning" });
    return;
  }
  if (!form.modeId) {
    $toast({ message: "请选择彩票模式", theme: "warning" });
    return;
  }
  if (!form.redNumbers.trim()) {
    $toast({ message: "请输入红球号码", theme: "warning" });
    return;
  }

  // 检查是否已存在相同号码的默认记录（同一模式下）
  const exists = defaultNumbers.value.some(
    (n) =>
      Number(n.modeId) === Number(form.modeId) &&
      n.redNumbers === form.redNumbers &&
      n.blueNumbers === form.blueNumbers &&
      n.id !== editingNumber.value?.id,
  );
  if (exists) {
    $toast({ message: "该模式下已存在相同号码的记录", theme: "warning" });
    return;
  }

  try {
    if (editingNumber.value) {
      await defaultNumberApi.update(editingNumber.value.id, {
        name: form.name,
        redNumbers: form.redNumbers,
        blueNumbers: form.blueNumbers,
      });
      const index = defaultNumbers.value.findIndex(
        (n) => n.id === editingNumber.value!.id,
      );
      if (index > -1) {
        defaultNumbers.value[index] = {
          ...defaultNumbers.value[index],
          name: form.name,
          redNumbers: form.redNumbers,
          blueNumbers: form.blueNumbers,
        };
      }
      $toast({ message: "更新成功", theme: "success" });
    } else {
      const res = await defaultNumberApi.create({
        modeId: form.modeId,
        name: form.name,
        redNumbers: form.redNumbers,
        blueNumbers: form.blueNumbers,
      });
      // 添加模式名称（注意：res.data 是 {code, message, data}，实际数据在 res.data.data 中）
      const newNumber = {
        ...res.data.data,
        modeName:
          modes.value.find((m) => m.id === form.modeId)?.name || "未知模式",
      };
      defaultNumbers.value.unshift(newNumber);
      $toast({ message: "添加成功", theme: "success" });
    }
    closeAddSheet();
  } catch (error) {
    $toast({
      message: editingNumber.value ? "更新失败" : "添加失败",
      theme: "error",
    });
  }
}

function onModeConfirm(value: (number | null)[]) {
  form.modeId = value[0] ?? null;
  form.redNumbers = "";
  form.blueNumbers = "";
  showModePicker.value = false;
}

function openModePicker() {
  if (drawModes.value.length === 0) {
    $toast({ message: "正在加载模式数据...", theme: "info" });
    return;
  }
  showModePicker.value = true;
}

function openNumberPicker(type: "red" | "blue") {
  if (!form.modeId) {
    $toast({ message: "请先选择彩票模式", theme: "warning" });
    return;
  }
  pickerType.value = type;
  const current = type === "red" ? form.redNumbers : form.blueNumbers;
  selectedNumbers.value = parseNumbers(current);
  showNumberPicker.value = true;
}

function toggleNumber(n: number) {
  const index = selectedNumbers.value.indexOf(n);
  if (index > -1) {
    selectedNumbers.value.splice(index, 1);
  } else if (selectedNumbers.value.length < requiredCount.value) {
    selectedNumbers.value.push(n);
    selectedNumbers.value.sort((a, b) => a - b);
  } else {
    $toast({
      message: `最多选择 ${requiredCount.value} 个号码`,
      theme: "warning",
    });
  }
}

function clearNumbers() {
  selectedNumbers.value = [];
}

function confirmNumberPicker() {
  if (selectedNumbers.value.length !== requiredCount.value) {
    $toast({
      message: `请选择 ${requiredCount.value} 个号码`,
      theme: "warning",
    });
    return;
  }
  if (pickerType.value === "red") {
    form.redNumbers = selectedNumbers.value.join(",");
  } else {
    form.blueNumbers = selectedNumbers.value.join(",");
  }
  showNumberPicker.value = false;
}

// 生命周期
onMounted(async () => {
  console.log("DefaultNumbersView mounted, calling loadData");
  await loadData();
});
</script>

<style lang="scss" scoped>
.default-numbers-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  h1 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
}

.numbers-list {
  padding: 16px;
}

.number-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.item-mode {
  font-size: 12px;
  color: #666;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 12px;
}

.item-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.item-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.number-ball {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;

  &--red {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  &--blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }
}

.separator {
  margin: 0 4px;
  color: #ccc;
}

.popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 600;

  .t-icon {
    font-size: 24px;
    color: #999;
  }
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.picker-value {
  color: #999;
}

.popup-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.number-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-picker-body {
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.picker-title {
  font-size: 14px;
  color: #333;
}

.picker-count {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
}

.number-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
}

.grid-item {
  width: calc((100% - 56px) / 8);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
  }

  &--red {
    &.grid-item--selected {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-color: #dc2626;
      color: #fff;
    }
  }

  &--blue {
    &.grid-item--selected {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-color: #2563eb;
      color: #fff;
    }
  }
}

.picker-footer {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
}

.mode-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px 12px 0 0;

  .t-icon {
    font-size: 24px;
    color: #999;
  }
}
</style>
