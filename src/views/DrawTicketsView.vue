<template>
  <div class="draw-tickets-view">
    <!-- 操作栏 -->
    <div class="action-bar">
      <t-button theme="primary" size="small" @click="showAddSheet = true">
        <template #icon><t-icon name="add" /></template>
        新增投注
      </t-button>
      <t-button size="small" @click="showGenerateSheet = true">
        <template #icon><t-icon name="refresh" /></template>
        随机生成
      </t-button>
    </div>

    <!-- 列表 -->
    <t-pull-down-refresh v-model="refreshing" @refresh="handleRefresh">
      <t-loading
        v-if="loading && !tickets.length"
        size="small"
        style="padding: 40px; text-align: center"
      />
      <t-empty v-else-if="!tickets.length" description="暂无摇奖票记录" />
      <div v-else>
        <div v-for="ticket in tickets" :key="ticket.id" class="ticket-card">
          <div class="ticket-header">
            <span class="mode-tag">{{ getModeName(ticket.modeId) }}</span>
            <span class="issue-no">{{ ticket.issueNo || "无期号" }}</span>
            <t-tag
              :theme="winTheme(ticket.winStatus)"
              size="small"
              variant="light"
            >
              {{ winLabel(ticket.winStatus, ticket.winLevel) }}
            </t-tag>
          </div>
          <div class="ticket-numbers">
            <div class="ticket-row">
              <span
                v-for="n in parseNumbers(ticket.redNumbers)"
                :key="`r${n}`"
                :class="[
                  'number-ball',
                  'number-ball--red',
                  { 'number-ball--winning': isWinningNumber(ticket, n, 'red') },
                ]"
                >{{ String(n).padStart(2, "0") }}</span
              >
              <span
                v-if="parseNumbers(ticket.blueNumbers).length"
                class="separator"
                >|</span
              >
              <span
                v-for="n in parseNumbers(ticket.blueNumbers)"
                :key="`b${n}`"
                :class="[
                  'number-ball',
                  'number-ball--blue',
                  {
                    'number-ball--winning': isWinningNumber(ticket, n, 'blue'),
                  },
                ]"
                >{{ String(n).padStart(2, "0") }}</span
              >
            </div>
          </div>
          <div class="ticket-footer">
            <span>¥{{ Number(ticket.betAmount).toFixed(2) }}</span>
            <span v-if="ticket.winStatus === 'WIN'" class="profit"
              >中奖 ¥{{ Number(ticket.winAmount).toFixed(2) }}</span
            >
            <t-space>
              <t-link
                theme="primary"
                size="small"
                @click="openWinDialog(ticket)"
                >设置中奖</t-link
              >
              <t-link
                theme="danger"
                size="small"
                @click="handleDelete(ticket.id)"
                >删除</t-link
              >
            </t-space>
          </div>
        </div>
        <!-- 加载更多 -->
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

    <!-- 新增投注弹窗 -->
    <t-popup
      v-model:visible="showAddSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>新增摇奖票</span>
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
                placeholder="期号（可选）"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="红球号码">
            <template #note>
              <t-input
                v-model="addForm.redNumbersInput"
                :placeholder="redPlaceholder"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell v-if="currentModeHasBlue" title="蓝球号码">
            <template #note>
              <t-input
                v-model="addForm.blueNumbersInput"
                :placeholder="bluePlaceholder"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="投注金额">
            <template #note>
              <t-input
                v-model.number="addForm.betAmount"
                type="number"
                placeholder="投注金额（元）"
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
            >保存投注</t-button
          >
        </div>
      </div>
    </t-popup>

    <!-- 随机生成弹窗 -->
    <t-popup
      v-model:visible="showGenerateSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>随机生成号码</span>
          <t-icon name="close" @click="showGenerateSheet = false" />
        </div>
        <t-cell-group bordered>
          <t-cell
            title="彩票模式"
            :note="getModeName(genForm.modeId)"
            arrow
            @click="showModePickerForGen = true"
          />
          <t-cell title="生成注数">
            <template #note>
              <t-input
                v-model.number="genForm.count"
                type="number"
                placeholder="1-100"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="期号">
            <template #note>
              <t-input
                v-model="genForm.issueNo"
                placeholder="期号（可选）"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="投注金额">
            <template #note>
              <t-input
                v-model.number="genForm.betAmount"
                type="number"
                placeholder="投注金额（元）"
                style="text-align: right"
              />
            </template>
          </t-cell>
        </t-cell-group>
        <div style="padding: 16px">
          <t-button
            theme="primary"
            block
            :loading="genLoading"
            @click="handleGenerate"
            >生成并保存</t-button
          >
        </div>
      </div>
    </t-popup>

    <!-- 设置中奖弹窗 -->
    <t-popup
      v-model:visible="showWinSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>设置中奖状态</span>
          <t-icon name="close" @click="showWinSheet = false" />
        </div>
        <t-cell-group bordered>
          <t-cell
            title="中奖状态"
            :note="
              winStatusOptions.find((o) => o.value === winForm.winStatus)
                ?.label || ''
            "
            arrow
            @click="showWinStatusPicker = true"
          />
          <template v-if="winForm.winStatus === 'WIN'">
            <t-cell
              title="中奖等级"
              :note="winForm.winLevel ? `${winForm.winLevel}等奖` : ''"
              arrow
              @click="showWinLevelPicker = true"
            />
            <t-cell title="中奖金额">
              <template #note>
                <t-input
                  v-model.number="winForm.winAmount"
                  type="number"
                  placeholder="中奖金额（元）"
                  style="text-align: right"
                />
              </template>
            </t-cell>
          </template>
        </t-cell-group>
        <div style="padding: 16px">
          <t-button
            theme="primary"
            block
            :loading="winLoading"
            @click="handleWinSubmit"
            >确认</t-button
          >
        </div>
      </div>
    </t-popup>

    <!-- 彩票模式选择器 -->
    <t-picker
      v-model:visible="showModePicker"
      :columns="modePickerColumns"
      @confirm="onModeConfirm"
    />
    <t-picker
      v-model:visible="showModePickerForGen"
      :columns="modePickerColumns"
      @confirm="onModeConfirmForGen"
    />
    <t-picker
      v-model:visible="showWinStatusPicker"
      :columns="[
        winStatusOptions.map((o) => ({ label: o.label, value: o.value })),
      ]"
      @confirm="onWinStatusConfirm"
    />
    <t-picker
      v-model:visible="showWinLevelPicker"
      :columns="[
        Array.from({ length: 8 }, (_, i) => ({
          label: `${i + 1}等奖`,
          value: i + 1,
        })),
      ]"
      @confirm="onWinLevelConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { Toast } from "tdesign-mobile-vue";
import { drawTicketApi, lotteryModeApi, numbersApi } from "@/api";
import type { LotteryMode } from "@/types";

interface DrawTicket {
  id: number;
  modeId: number;
  issueNo: string | null;
  redNumbers: unknown;
  blueNumbers: unknown;
  betAmount: number;
  winStatus: string;
  winLevel: number | null;
  winAmount: number | null;
  winningNumbers?: any; // 中奖号码信息
}

const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const tickets = ref<DrawTicket[]>([]);
const modes = ref<LotteryMode[]>([]);
const page = ref(1);
const hasMore = ref(false);

const showAddSheet = ref(false);
const showGenerateSheet = ref(false);
const showWinSheet = ref(false);
const showModePicker = ref(false);
const showModePickerForGen = ref(false);
const showWinStatusPicker = ref(false);
const showWinLevelPicker = ref(false);
const addLoading = ref(false);
const genLoading = ref(false);
const winLoading = ref(false);
const winCurrentId = ref<number | null>(null);

const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));
const modePickerColumns = computed(() => [
  drawModes.value.map((m) => ({ label: m.name, value: m.id })),
]);

const addForm = reactive({
  modeId: null as number | null,
  issueNo: "",
  redNumbersInput: "",
  blueNumbersInput: "",
  betAmount: 2,
});
const genForm = reactive({
  modeId: null as number | null,
  count: 5,
  issueNo: "",
  betAmount: 2,
});
const winForm = reactive({
  winStatus: "PENDING",
  winLevel: null as number | null,
  winAmount: 0,
});

const winStatusOptions = [
  { label: "待开奖", value: "PENDING" },
  { label: "未中奖", value: "NO_WIN" },
  { label: "已中奖", value: "WIN" },
];

const currentModeHasBlue = computed(() => {
  const m = modes.value.find((m) => m.id === addForm.modeId);
  return !!(m && m.blueCount && m.blueCount > 0);
});

const redPlaceholder = computed(() => {
  const m = modes.value.find((m) => m.id === addForm.modeId);
  return m
    ? `${m.redCount}个红球（${m.redMin}-${m.redMax}），逗号分隔`
    : "红球号码，逗号分隔";
});

const bluePlaceholder = computed(() => {
  const m = modes.value.find((m) => m.id === addForm.modeId);
  return m
    ? `${m.blueCount}个蓝球（${m.blueMin}-${m.blueMax}），逗号分隔`
    : "蓝球号码，逗号分隔";
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

function winTheme(status: string) {
  return status === "WIN"
    ? "success"
    : status === "NO_WIN"
      ? "danger"
      : "default";
}

function winLabel(status: string, level: number | null) {
  if (status === "WIN") return level ? `${level}等奖` : "已中奖";
  if (status === "NO_WIN") return "未中奖";
  return "待开奖";
}

/**
 * 判断指定号码是否为中奖号码
 * @param ticket 摇奖票数据
 * @param number 号码
 * @param type 号码类型：'red' 或 'blue'
 * @returns 是否为中奖号码
 */
function isWinningNumber(
  ticket: DrawTicket,
  number: number,
  type: "red" | "blue",
): boolean {
  // 如果没有中奖号码信息，返回false
  if (!ticket.winningNumbers) return false;

  // 如果winningNumbers是字符串，需要解析JSON
  let winningNumbers = ticket.winningNumbers;
  if (typeof winningNumbers === "string") {
    try {
      winningNumbers = JSON.parse(winningNumbers);
    } catch (e) {
      console.warn("解析中奖号码JSON失败:", e);
      return false;
    }
  }

  // 检查是否为中奖号码
  if (type === "red") {
    return winningNumbers.winningRedNumbers?.includes(number) || false;
  } else {
    return winningNumbers.winningBlueNumbers?.includes(number) || false;
  }
}

async function fetchTickets(reset = false) {
  if (reset) {
    page.value = 1;
    tickets.value = [];
  }
  loading.value = reset;
  loadingMore.value = !reset;
  try {
    const res = await drawTicketApi.list({ pageNum: page.value, pageSize: 20 });
    const data = res.data.data;
    if (reset) tickets.value = data.records || [];
    else tickets.value.push(...(data.records || []));
    hasMore.value = tickets.value.length < (data.total || 0);
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function handleRefresh() {
  fetchTickets(true);
}
function loadMore() {
  page.value++;
  fetchTickets();
}

function onModeConfirm({ value }: { value: (number | null)[] }) {
  addForm.modeId = value[0] ?? null;
  showModePicker.value = false;
}
function onModeConfirmForGen({ value }: { value: (number | null)[] }) {
  genForm.modeId = value[0] ?? null;
  showModePickerForGen.value = false;
}
function onWinStatusConfirm({ value }: { value: string[] }) {
  winForm.winStatus = value[0];
  showWinStatusPicker.value = false;
}
function onWinLevelConfirm({ value }: { value: number[] }) {
  winForm.winLevel = value[0];
  showWinLevelPicker.value = false;
}

async function handleAdd() {
  if (!addForm.modeId) {
    Toast({ message: "请选择彩票模式", theme: "warning" });
    return;
  }
  const redNumbers = addForm.redNumbersInput
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  if (!redNumbers.length) {
    Toast({ message: "请输入红球号码", theme: "warning" });
    return;
  }
  const blueNumbers = currentModeHasBlue.value
    ? addForm.blueNumbersInput
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [];
  addLoading.value = true;
  try {
    await drawTicketApi.create({
      modeId: addForm.modeId,
      issueNo: addForm.issueNo || undefined,
      redNumbers,
      blueNumbers: blueNumbers.length ? blueNumbers : undefined,
      betAmount: addForm.betAmount,
    });
    Toast({ message: "保存成功", theme: "success" });
    showAddSheet.value = false;
    fetchTickets(true);
  } catch {
    /* ignore */
  } finally {
    addLoading.value = false;
  }
}

async function handleGenerate() {
  if (!genForm.modeId) {
    Toast({ message: "请选择彩票模式", theme: "warning" });
    return;
  }
  genLoading.value = true;
  try {
    const res = await numbersApi.generateBatch({
      modeId: genForm.modeId,
      count: genForm.count || 5,
    });
    const generated = res.data.data || [];
    const requests = generated.map((t: { red: number[]; blue: number[] }) => ({
      modeId: genForm.modeId,
      issueNo: genForm.issueNo || undefined,
      redNumbers: t.red,
      blueNumbers: t.blue.length ? t.blue : undefined,
      betAmount: genForm.betAmount,
    }));
    await drawTicketApi.createBatch(requests);
    Toast({ message: `成功保存 ${generated.length} 注`, theme: "success" });
    showGenerateSheet.value = false;
    fetchTickets(true);
  } catch {
    /* ignore */
  } finally {
    genLoading.value = false;
  }
}

function openWinDialog(ticket: DrawTicket) {
  winCurrentId.value = ticket.id;
  Object.assign(winForm, {
    winStatus: ticket.winStatus,
    winLevel: ticket.winLevel,
    winAmount: Number(ticket.winAmount) || 0,
  });
  showWinSheet.value = true;
}

async function handleWinSubmit() {
  if (!winCurrentId.value) return;
  winLoading.value = true;
  try {
    await drawTicketApi.updateWinStatus(winCurrentId.value, {
      winStatus: winForm.winStatus,
      winLevel: winForm.winStatus === "WIN" ? winForm.winLevel : undefined,
      winAmount: winForm.winStatus === "WIN" ? winForm.winAmount : undefined,
    });
    Toast({ message: "更新成功", theme: "success" });
    showWinSheet.value = false;
    fetchTickets(true);
  } catch {
    /* ignore */
  } finally {
    winLoading.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await drawTicketApi.delete(id);
    Toast({ message: "删除成功", theme: "success" });
    fetchTickets(true);
  } catch {
    /* ignore */
  }
}

onMounted(async () => {
  const res = await lotteryModeApi.list();
  modes.value = res.data.data || [];
  addForm.modeId = drawModes.value[0]?.id || null;
  genForm.modeId = drawModes.value[0]?.id || null;
  fetchTickets(true);
});
</script>

<style scoped lang="scss">
.draw-tickets-view {
  padding-bottom: 16px;
}
.action-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
}
.ticket-card {
  background: #fff;
  margin: 8px 16px 0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.ticket-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  .mode-tag {
    font-size: 12px;
    color: #0052d9;
    background: #e8f0fe;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .issue-no {
    flex: 1;
    font-size: 13px;
    color: #333;
  }
}
.ticket-numbers {
  margin-bottom: 8px;
}
.ticket-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
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
.profit {
  color: #00a870 !important;
}

/* 号码球样式 */
.number-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.05);
  }

  &--red {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  &--blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  /* 中奖号码特殊样式 */
  &--winning {
    animation: winning-glow 2s ease-in-out infinite alternate;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.15);

    &::after {
      content: "★";
      position: absolute;
      top: -2px;
      right: -2px;
      font-size: 7px;
      color: #ffd700;
      text-shadow: 0 0 3px rgba(255, 215, 0, 0.8);
    }
  }
}

@keyframes winning-glow {
  0% {
    box-shadow:
      0 0 6px rgba(255, 215, 0, 0.6),
      0 2px 4px rgba(0, 0, 0, 0.15);
  }
  100% {
    box-shadow:
      0 0 12px rgba(255, 215, 0, 1),
      0 2px 4px rgba(0, 0, 0, 0.15);
  }
}

.separator {
  color: #d0d0d0;
  margin: 0 3px;
  font-weight: 300;
  font-size: 14px;
}

.ticket-row {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}
</style>
