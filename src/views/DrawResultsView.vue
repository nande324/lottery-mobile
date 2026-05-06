<template>
  <div class="draw-results-view">
    <div class="action-bar">
      <t-button theme="primary" size="small" @click="showAddSheet = true">
        <template #icon><t-icon name="add" /></template>
        录入开奖
      </t-button>
    </div>

    <t-pull-down-refresh v-model="refreshing" @refresh="handleRefresh">
      <t-empty v-if="!results.length && !loading" description="暂无开奖记录" />
      <div v-else>
        <div v-for="result in results" :key="result.id" class="result-card">
          <div class="result-header">
            <t-tag theme="primary" variant="light" size="small">{{
              getModeName(result.modeId)
            }}</t-tag>
            <span class="issue-no">{{ result.issueNo }}</span>
            <span class="draw-date">{{ result.drawDate }}</span>
          </div>
          <div class="result-numbers">
            <div class="ticket-row">
              <span
                v-for="n in parseNumbers(result.redNumbers)"
                :key="`r${n}`"
                class="number-ball number-ball--red"
                >{{ String(n).padStart(2, "0") }}</span
              >
              <span
                v-if="parseNumbers(result.blueNumbers).length"
                class="separator"
                >|</span
              >
              <span
                v-for="n in parseNumbers(result.blueNumbers)"
                :key="`b${n}`"
                class="number-ball number-ball--blue"
                >{{ String(n).padStart(2, "0") }}</span
              >
            </div>
          </div>
          <div class="result-actions">
            <t-button
              size="small"
              theme="success"
              variant="outline"
              :loading="winCheckId === result.id"
              @click="handleWinCheck(result)"
            >
              核对中奖
            </t-button>
          </div>
        </div>
        <div v-if="hasMore" style="text-align: center; padding: 12px">
          <t-button
            variant="text"
            size="small"
            :loading="loadingMore"
            @click="loadMore"
            >加载更多</t-button
          >
        </div>
      </div>
    </t-pull-down-refresh>

    <!-- 录入开奖弹窗 -->
    <t-popup
      v-model:visible="showAddSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>录入开奖结果</span>
          <t-icon name="close" @click="showAddSheet = false" />
        </div>
        <t-cell-group bordered>
          <t-cell
            title="彩票模式"
            :note="getModeName(addForm.modeId)"
            arrow
            @click="showModePicker = true"
          />
          <t-cell title="期号">
            <template #note>
              <t-input
                v-model="addForm.issueNo"
                placeholder="请输入期号"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="开奖号码">
            <template #note>
              <t-input
                v-model="addForm.redNumbersInput"
                placeholder="红球，逗号分隔"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell v-if="currentModeHasBlue" title="蓝球号码">
            <template #note>
              <t-input
                v-model="addForm.blueNumbersInput"
                placeholder="蓝球，逗号分隔"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="开奖日期">
            <template #note>
              <t-input
                v-model="addForm.drawDate"
                placeholder="YYYY-MM-DD"
                style="text-align: right"
              />
            </template>
          </t-cell>
        </t-cell-group>
        <div style="padding: 16px">
          <t-button
            theme="primary"
            block
            :loading="addLoading"
            @click="handleAdd"
            >保存</t-button
          >
        </div>
      </div>
    </t-popup>

    <!-- 核对结果弹窗 -->
    <t-popup
      v-model:visible="showWinResult"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>中奖核对结果</span>
          <t-icon name="close" @click="showWinResult = false" />
        </div>
        <div v-if="winResult" style="padding: 16px">
          <t-cell-group bordered>
            <t-cell title="总注数" :note="String(winResult.totalTickets)" />
            <t-cell title="中奖注数" :note="String(winResult.winTickets)" />
          </t-cell-group>
        </div>
      </div>
    </t-popup>

    <t-picker
      v-model:visible="showModePicker"
      :columns="modePickerColumns"
      @confirm="onModeConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { Toast } from "tdesign-mobile-vue";
import { drawResultApi, lotteryModeApi } from "@/api";
import type { LotteryMode } from "@/types";

interface DrawResult {
  id: number;
  modeId: number;
  issueNo: string;
  drawDate: string;
  redNumbers: unknown;
  blueNumbers: unknown;
}

const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const results = ref<DrawResult[]>([]);
const modes = ref<LotteryMode[]>([]);
const page = ref(1);
const hasMore = ref(false);
const showAddSheet = ref(false);
const showModePicker = ref(false);
const showWinResult = ref(false);
const addLoading = ref(false);
const winCheckId = ref<number | null>(null);
const winResult = ref<Record<string, unknown> | null>(null);

const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));
const modePickerColumns = computed(() => [
  drawModes.value.map((m) => ({ label: m.name, value: m.id })),
]);
const addForm = reactive({
  modeId: null as number | null,
  issueNo: "",
  redNumbersInput: "",
  blueNumbersInput: "",
  drawDate: "",
});

const currentModeHasBlue = computed(() => {
  const m = modes.value.find((m) => m.id === addForm.modeId);
  return !!(m && m.blueCount && m.blueCount > 0);
});

function getModeName(modeId: number | null) {
  if (!modeId) return "请选择";
  return modes.value.find((m) => m.id === modeId)?.name || `模式${modeId}`;
}

function parseNumbers(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as number[];
  if (typeof val === "string")
    return val
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  return [];
}

async function fetchResults(reset = false) {
  if (reset) {
    page.value = 1;
    results.value = [];
  }
  loading.value = reset;
  loadingMore.value = !reset;
  try {
    const res = await drawResultApi.list({ pageNum: page.value, pageSize: 20 });
    const data = res.data.data;
    if (reset) results.value = data.records || [];
    else results.value.push(...(data.records || []));
    hasMore.value = results.value.length < (data.total || 0);
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function handleRefresh() {
  fetchResults(true);
}
function loadMore() {
  page.value++;
  fetchResults();
}
function onModeConfirm({ value }: { value: (number | null)[] }) {
  addForm.modeId = value[0] ?? null;
  showModePicker.value = false;
}

async function handleAdd() {
  if (!addForm.modeId || !addForm.issueNo) {
    Toast({ message: "请填写完整信息", theme: "warning" });
    return;
  }
  const redNumbers = addForm.redNumbersInput
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  const blueNumbers = currentModeHasBlue.value
    ? addForm.blueNumbersInput
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [];
  addLoading.value = true;
  try {
    await drawResultApi.create({
      modeId: addForm.modeId,
      issueNo: addForm.issueNo,
      redNumbers,
      blueNumbers: blueNumbers.length ? blueNumbers : undefined,
      drawDate: addForm.drawDate,
    });
    Toast({ message: "录入成功", theme: "success" });
    showAddSheet.value = false;
    fetchResults(true);
  } catch {
    /* ignore */
  } finally {
    addLoading.value = false;
  }
}

async function handleWinCheck(result: DrawResult) {
  winCheckId.value = result.id;
  try {
    const res = await drawResultApi.winCheck(result.id);
    winResult.value = res.data.data;
    showWinResult.value = true;
    fetchResults(true);
  } catch {
    /* ignore */
  } finally {
    winCheckId.value = null;
  }
}

onMounted(async () => {
  const res = await lotteryModeApi.list();
  modes.value = res.data.data || [];
  addForm.modeId = drawModes.value[0]?.id || null;
  fetchResults(true);
});
</script>

<style scoped lang="scss">
.draw-results-view {
  padding-bottom: 16px;
}
.action-bar {
  padding: 12px 16px;
  background: #fff;
}
.result-card {
  background: #fff;
  margin: 8px 16px 0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  .issue-no {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
  }
  .draw-date {
    font-size: 12px;
    color: #999;
  }
}
.result-numbers {
  margin-bottom: 10px;
}
.result-actions {
  display: flex;
}
.popup-content {
  padding-bottom: env(safe-area-inset-bottom);
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}
</style>
