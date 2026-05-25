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
      <t-button size="small" @click="$router.push('/default-numbers')">
        <template #icon><t-icon name="star" /></template>
        我的号码
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
                @click="openEditDialog(ticket)"
                >编辑</t-link
              >
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

    <!-- 新增/编辑投注弹窗 -->
    <t-popup
      v-model:visible="showAddSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>{{ isEditingTicket ? "编辑摇奖票" : "新增摇奖票" }}</span>
          <t-icon name="close" @click="showAddSheet = false" />
        </div>
        <t-form
          ref="addFormRef"
          :data="addForm"
          :rules="formRules"
          label-width="100px"
          @submit="handleFormSubmit"
        >
          <t-form-item label="彩票模式" name="modeId">
            <t-input
              :model-value="getModeName(addForm.modeId)"
              placeholder="请选择彩票模式"
              readonly
              borderless
              @click="showModePicker = true"
            >
              <template #suffix>
                <t-icon name="chevron-down" />
              </template>
            </t-input>
          </t-form-item>

          <t-form-item label="期号" name="issueNo">
            <t-input
              borderless
              v-model="addForm.issueNo"
              placeholder="期号（可选）"
            />
          </t-form-item>

          <t-form-item label="快捷选择">
            <div class="default-tags">
              <t-tag
                v-for="num in filteredDefaultNumbers"
                :key="num.id"
                size="small"
                :theme="
                  selectedDefaultNumberId === num.id ? 'primary' : 'default'
                "
                @click="applyDefaultNumber(num)"
              >
                {{ num.name }}
              </t-tag>
              <span v-if="!filteredDefaultNumbers.length" class="no-default">
                暂无默认号码
              </span>
            </div>
          </t-form-item>

          <t-form-item label="红球号码" name="redNumbers">
            <div class="number-input-wrapper">
              <t-input
                borderless
                v-model="addForm.redNumbersInput"
                :placeholder="redPlaceholder"
              />
              <t-button size="small" @click="openNumberPicker('red')">
                选择号码
              </t-button>
            </div>
          </t-form-item>

          <t-form-item
            v-if="currentModeHasBlue"
            label="蓝球号码"
            name="blueNumbers"
          >
            <div class="number-input-wrapper">
              <t-input
                borderless
                v-model="addForm.blueNumbersInput"
                :placeholder="bluePlaceholder"
              />
              <t-button size="small" @click="openNumberPicker('blue')">
                选择号码
              </t-button>
            </div>
          </t-form-item>

          <t-form-item label="投注金额" name="betAmount">
            <t-input
              borderless
              v-model.number="addForm.betAmount"
              type="number"
              placeholder="投注金额（元）"
            />
          </t-form-item>

          <div class="form-submit-area">
            <t-button theme="primary" block type="submit" :loading="addLoading">
              保存投注
            </t-button>
          </div>
        </t-form>
      </div>
    </t-popup>

    <!-- 彩票模式选择器 -->
    <t-popup v-model:visible="showModePicker" placement="bottom">
      <div class="mode-picker-header">
        <span>选择彩票模式</span>
        <t-icon name="close" @click="showModePicker = false" />
      </div>
      <t-picker
        :columns="modePickerColumns"
        @confirm="onModeConfirm"
        @cancel="showModePicker = false"
        :default-value="addForm.modeId ? [addForm.modeId] : []"
      />
    </t-popup>

    <!-- 随机生成弹窗 -->
    <t-popup
      v-model:visible="showGenerateSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', maxHeight: '80vh' }"
    >
      <div class="popup-content popup-content--scroll">
        <div class="popup-header">
          <span>随机生成号码</span>
          <t-icon name="close" @click="showGenerateSheet = false" />
        </div>
        <t-form ref="genFormRef" :data="genForm" label-width="100px">
          <t-form-item label="彩票模式" name="modeId">
            <t-input
              :model-value="getModeName(genForm.modeId)"
              placeholder="请选择彩票模式"
              readonly
              borderless
              @click="showModePickerForGen = true"
            >
              <template #suffix>
                <t-icon name="chevron-down" />
              </template>
            </t-input>
          </t-form-item>

          <t-form-item label="生成注数" name="count">
            <t-input
              borderless
              v-model.number="genForm.count"
              type="number"
              placeholder="1-100"
            />
          </t-form-item>

          <t-form-item label="快捷选择">
            <div class="default-tags">
              <t-tag
                v-for="num in filteredDefaultNumbers"
                :key="num.id"
                size="small"
                :theme="isGenSelected(num) ? 'primary' : 'default'"
                @click="toggleGenDefaultNumber(num)"
              >
                {{ num.name }}
              </t-tag>
              <span v-if="!filteredDefaultNumbers.length" class="no-default">
                暂无默认号码
              </span>
            </div>
          </t-form-item>

          <t-form-item label="期号" name="issueNo">
            <t-input
              borderless
              v-model="genForm.issueNo"
              placeholder="期号（可选）"
            />
          </t-form-item>

          <t-form-item label="投注金额" name="betAmount">
            <t-input
              borderless
              v-model.number="genForm.betAmount"
              type="number"
              placeholder="投注金额（元）"
            />
          </t-form-item>
        </t-form>

        <!-- 生成的号码列表 -->
        <div v-if="generatedTickets.length > 0" class="generated-list">
          <div class="list-header">
            <span>已生成 {{ generatedTickets.length }} 注</span>
            <t-button size="small" @click="generatedTickets = []"
              >清空</t-button
            >
          </div>
          <div
            v-for="(ticket, index) in generatedTickets"
            :key="index"
            class="generated-item"
            :class="{ 'generated-item--default': ticket.isDefault }"
          >
            <div class="item-header">
              <span>第 {{ index + 1 }} 注</span>
              <t-tag v-if="ticket.isDefault" size="small" theme="primary">
                {{ ticket.defaultName }}
              </t-tag>
              <div class="item-actions">
                <t-icon name="refresh" @click="regenerateSingle(index)" />
                <t-icon name="delete" @click="removeGenerated(index)" />
              </div>
            </div>
            <div class="item-numbers">
              <span
                v-for="n in parseNumbers(ticket.redNumbers)"
                :key="`r${n}`"
                class="number-ball number-ball--red"
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
                class="number-ball number-ball--blue"
                >{{ String(n).padStart(2, "0") }}</span
              >
            </div>
          </div>
        </div>

        <div style="padding: 16px">
          <t-button
            v-if="generatedTickets.length === 0"
            theme="primary"
            block
            :loading="genLoading"
            @click="handleGenerate"
            >生成号码</t-button
          >
          <template v-else>
            <t-button
              theme="default"
              block
              :loading="genLoading"
              @click="handleGenerate"
              >重新生成</t-button
            >
            <t-button
              theme="primary"
              block
              :loading="genLoading"
              style="margin-top: 12px"
              @click="saveGeneratedTickets"
              >保存投注</t-button
            >
          </template>
        </div>
      </div>
    </t-popup>

    <!-- 分享弹窗（全屏展示） -->
    <t-popup
      v-model:visible="showShareSheet"
      :style="{
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        borderRadius: '0',
        padding: '0',
      }"
    >
      <div
        class="share-fullscreen"
        :class="{ 'share-fullscreen--landscape': shareLandscape }"
      >
        <!-- 顶部工具栏 -->
        <div class="share-toolbar">
          <t-icon name="close" class="toolbar-icon" @click="closeShareSheet" />
          <span class="toolbar-title">投注分享</span>
          <t-icon
            :name="shareLandscape ? 'rotate-ccw' : 'rotate-cw'"
            class="toolbar-icon"
            @click="toggleLandscape"
          />
        </div>

        <!-- 内容区域 -->
        <div class="share-content-wrapper">
          <div class="lottery-display">
            <div class="lottery-header">
              <span class="lottery-name">{{
                getModeName(genForm.modeId)
              }}</span>
              <span v-if="genForm.issueNo" class="issue-no"
                >期号: {{ genForm.issueNo }}</span
              >
            </div>
            <div class="ticket-grid">
              <div
                v-for="(ticket, index) in generatedTickets"
                :key="index"
                class="ticket-card"
              >
                <div class="ticket-row">
                  <span
                    v-for="n in parseNumbers(ticket.redNumbers)"
                    :key="`r${n}`"
                    class="lottery-ball lottery-ball--red"
                    >{{ String(n).padStart(2, "0") }}</span
                  >
                </div>
                <div
                  v-if="parseNumbers(ticket.blueNumbers).length"
                  class="ticket-row"
                >
                  <span
                    v-for="n in parseNumbers(ticket.blueNumbers)"
                    :key="`b${n}`"
                    class="lottery-ball lottery-ball--blue"
                    >{{ String(n).padStart(2, "0") }}</span
                  >
                </div>
              </div>
            </div>
            <div class="lottery-footer">
              <span>共 {{ generatedTickets.length }} 注</span>
              <span
                >投注金额:
                {{ genForm.betAmount * generatedTickets.length }} 元</span
              >
            </div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="share-actions-bottom">
          <t-button theme="default" block @click="copyTicketText"
            >复制文本</t-button
          >
          <t-button
            theme="primary"
            block
            style="margin-top: 12px"
            @click="generateImage"
            >生成图片</t-button
          >
        </div>
      </div>
    </t-popup>

    <!-- 随机生成模式选择器 -->
    <t-popup v-model:visible="showModePickerForGen" placement="bottom">
      <div class="mode-picker-header">
        <span>选择彩票模式</span>
        <t-icon name="close" @click="showModePickerForGen = false" />
      </div>
      <t-picker
        :columns="modePickerColumns"
        @confirm="onModeConfirmForGen"
        @cancel="showModePickerForGen = false"
        :default-value="genForm.modeId ? [genForm.modeId] : []"
      />
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
                  borderless
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

    <!-- 中奖状态选择器 -->
    <t-popup v-model:visible="showWinStatusPicker" placement="bottom">
      <div class="mode-picker-header">
        <span>选择中奖状态</span>
        <t-icon name="close" @click="showWinStatusPicker = false" />
      </div>
      <t-picker
        :columns="[
          winStatusOptions.map((o) => ({ label: o.label, value: o.value })),
        ]"
        @confirm="onWinStatusConfirm"
        @cancel="showWinStatusPicker = false"
      />
    </t-popup>

    <!-- 中奖等级选择器 -->
    <t-popup v-model:visible="showWinLevelPicker" placement="bottom">
      <div class="mode-picker-header">
        <span>选择中奖等级</span>
        <t-icon name="close" @click="showWinLevelPicker = false" />
      </div>
      <t-picker
        :columns="[
          Array.from({ length: 8 }, (_, i) => ({
            label: `${i + 1}等奖`,
            value: i + 1,
          })),
        ]"
        @confirm="onWinLevelConfirm"
        @cancel="showWinLevelPicker = false"
      />
    </t-popup>

    <!-- 默认号码选择器 -->
    <t-popup
      v-model:visible="showDefaultNumberPicker"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', height: '60%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>选择默认号码</span>
          <t-icon name="close" @click="showDefaultNumberPicker = false" />
        </div>
        <div style="padding: 16px; overflow-y: auto; height: calc(100% - 56px)">
          <t-empty
            v-if="filteredDefaultNumbers.length === 0"
            description="暂无默认号码，请先添加"
          />
          <div v-else>
            <div
              v-for="num in filteredDefaultNumbers"
              :key="num.id"
              class="default-number-item"
              :class="{ 'default-number-item--selected': isGenSelected(num) }"
              @click="selectDefaultNumber(num)"
            >
              <div class="default-number-check">
                <t-icon v-if="isGenSelected(num)" name="check-circle" />
              </div>
              <div class="default-number-name">{{ num.name }}</div>
              <div class="default-number-numbers">
                <span
                  v-for="n in parseNumbers(num.redNumbers)"
                  :key="`r${n}`"
                  class="number-ball number-ball--red"
                  >{{ String(n).padStart(2, "0") }}</span
                >
                <span
                  v-if="parseNumbers(num.blueNumbers).length"
                  class="separator"
                  >|</span
                >
                <span
                  v-for="n in parseNumbers(num.blueNumbers)"
                  :key="`b${n}`"
                  class="number-ball number-ball--blue"
                  >{{ String(n).padStart(2, "0") }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </t-popup>

    <!-- 号码选择器弹窗 -->
    <t-popup
      v-model:visible="showNumberPicker"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', height: '80%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>选择{{ pickerType === "red" ? "红球" : "蓝球" }}号码</span>
          <t-icon name="close" @click="showNumberPicker = false" />
        </div>
        <div class="number-picker-body">
          <!-- 默认号码快捷选择区 -->
          <div
            v-if="filteredDefaultNumbers.length > 0"
            class="default-shortcut"
          >
            <span class="shortcut-title">快捷选择：</span>
            <div class="shortcut-list">
              <t-tag
                v-for="num in filteredDefaultNumbers"
                :key="num.id"
                size="small"
                closable
                @click="applyDefaultNumber(num)"
                @close.prevent
              >
                {{ num.name }}
              </t-tag>
            </div>
          </div>
          <div class="picker-header">
            <span class="picker-title">
              请选择 {{ pickerType === "red" ? "红" : "蓝" }}球号码
            </span>
            <span class="picker-count">
              {{ selectedNumbers.length }} / {{ requiredCount }}
            </span>
          </div>
          <div class="number-grid">
            <div
              v-for="n in availableNumbers"
              :key="n"
              :class="[
                'grid-item',
                { 'grid-item--selected': selectedNumbers.includes(n) },
                { 'grid-item--red': pickerType === 'red' },
                { 'grid-item--blue': pickerType === 'blue' },
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
import { ref, reactive, computed, onMounted, watch } from "vue";
import { Toast } from "tdesign-mobile-vue";
import {
  drawTicketApi,
  lotteryModeApi,
  numbersApi,
  defaultNumberApi,
} from "@/api";
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
const showShareSheet = ref(false);
const shareLandscape = ref(false); // 是否横屏显示
const showWinSheet = ref(false);
const showModePicker = ref(false);
const showModePickerForGen = ref(false);
const showWinStatusPicker = ref(false);
const showWinLevelPicker = ref(false);
const showDefaultNumberPicker = ref(false);
const showNumberPicker = ref(false);
const addLoading = ref(false);
const genLoading = ref(false);
const winLoading = ref(false);
const winCurrentId = ref<number | null>(null);

// 编辑相关
const isEditingTicket = ref(false);
const editingTicketId = ref<number | null>(null);

// 当前选中的默认号码ID（用于高亮显示）
const selectedDefaultNumberId = ref<number | null>(null);

// 随机生成弹窗中选中的默认号码（支持多选）
const genSelectedDefaultNumbers = ref<DefaultNumber[]>([]);

// 生成的号码列表（用于预览和修改）
interface GeneratedTicket {
  redNumbers: string;
  blueNumbers: string;
  isDefault: boolean; // 是否来自默认号码
  defaultName?: string; // 默认号码名称
}
const generatedTickets = ref<GeneratedTicket[]>([]);

// 默认号码列表
interface DefaultNumber {
  id: number;
  modeId: number;
  name: string;
  redNumbers: string;
  blueNumbers: string;
}
const defaultNumbers = ref<DefaultNumber[]>([]);

// 号码选择器相关
const pickerType = ref<"red" | "blue">("red");
const selectedNumbers = ref<number[]>([]);

const drawModes = computed(() => modes.value.filter((m) => m.type === "DRAW"));
const modePickerColumns = computed(() => [
  drawModes.value.map((m) => ({ label: m.name, value: m.id })),
]);

// 表单相关
const addFormRef = ref();
const genFormRef = ref();
const addForm = reactive({
  modeId: null as number | null,
  issueNo: "",
  redNumbersInput: "",
  blueNumbersInput: "",
  betAmount: 2,
});

// 表单校验规则
const formRules = {
  modeId: [{ required: true, message: "请选择彩票模式", type: "error" }],
  redNumbersInput: [
    { required: true, message: "请输入红球号码", type: "error" },
  ],
  betAmount: [
    { required: true, message: "请输入投注金额", type: "error" },
    { validator: (val: number) => val > 0, message: "投注金额必须大于0" },
  ],
};

// 监听模式变化，自动获取该模式的默认号码
watch(
  () => addForm.modeId,
  async (newModeId) => {
    if (newModeId) {
      await fetchDefaultNumbers();
    }
  },
);

// 监听弹窗关闭，重置模式选择器状态
watch(
  () => showAddSheet.value,
  (isVisible) => {
    if (!isVisible) {
      showModePicker.value = false;
      selectedDefaultNumberId.value = null;
    }
  },
);

// 监听号码输入变化，手动输入时取消高亮
watch(
  () => [addForm.redNumbersInput, addForm.blueNumbersInput],
  () => {
    // 检查是否是手动输入（与任何默认号码都不匹配）
    const isMatch = defaultNumbers.value.some(
      (num) =>
        num.redNumbers === addForm.redNumbersInput &&
        num.blueNumbers === addForm.blueNumbersInput,
    );
    if (!isMatch) {
      selectedDefaultNumberId.value = null;
    }
  },
);
const genForm = reactive({
  modeId: null as number | null,
  count: 5,
  issueNo: "",
  betAmount: 2,
});

// 监听注数变化，调整选中的默认号码数量
watch(
  () => genForm.count,
  (newCount, oldCount) => {
    if (newCount < oldCount) {
      // 注数减少，检查是否需要移除多余的选择
      while (genSelectedDefaultNumbers.value.length > newCount) {
        genSelectedDefaultNumbers.value.pop();
      }
    }
  },
);
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

// 根据当前选择的模式过滤默认号码
const filteredDefaultNumbers = computed(() => {
  if (!addForm.modeId) return defaultNumbers.value;
  return defaultNumbers.value.filter((n) => n.modeId === addForm.modeId);
});

// 当前选中的默认号码名称
const selectedDefaultNumberName = computed(() => {
  // 根据当前输入的号码查找匹配的默认号码
  if (!addForm.redNumbersInput) return "请选择";
  const matched = defaultNumbers.value.find(
    (n) =>
      n.redNumbers === addForm.redNumbersInput &&
      n.blueNumbers === addForm.blueNumbersInput,
  );
  return matched?.name || "请选择";
});

// 号码选择器可用号码列表
const availableNumbers = computed(() => {
  const currentMode = modes.value.find((m) => m.id === addForm.modeId);
  if (!currentMode) return [];
  const config =
    pickerType.value === "red"
      ? { min: currentMode.redMin, max: currentMode.redMax }
      : { min: currentMode.blueMin, max: currentMode.blueMax };
  return Array.from(
    { length: config.max - config.min + 1 },
    (_, i) => config.min + i,
  );
});

// 需要选择的号码数量
const requiredCount = computed(() => {
  const currentMode = modes.value.find((m) => m.id === addForm.modeId);
  if (!currentMode) return 0;
  return pickerType.value === "red"
    ? currentMode.redCount
    : currentMode.blueCount;
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

function onModeConfirm(value: (number | null)[]) {
  addForm.modeId = value[0] ?? null;
  // 清空历史数据
  addForm.redNumbersInput = "";
  addForm.blueNumbersInput = "";
  selectedDefaultNumberId.value = null;
  showModePicker.value = false;
}

// 获取默认号码列表
async function fetchDefaultNumbers() {
  try {
    const res = await defaultNumberApi.list();
    defaultNumbers.value = res.data.data || [];
  } catch {
    /* ignore */
  }
}

// 检查默认号码是否被选中（随机生成）
function isGenSelected(num: DefaultNumber): boolean {
  return genSelectedDefaultNumbers.value.some((n) => n.id === num.id);
}

// 切换随机生成的默认号码选择
function toggleGenDefaultNumber(num: DefaultNumber) {
  if (!genForm.modeId) {
    Toast({ message: "请先选择彩票模式", theme: "warning" });
    return;
  }
  const index = genSelectedDefaultNumbers.value.findIndex(
    (n) => n.id === num.id,
  );
  if (index > -1) {
    // 取消选择
    genSelectedDefaultNumbers.value.splice(index, 1);
  } else {
    // 检查是否超过限制
    if (genSelectedDefaultNumbers.value.length >= genForm.count) {
      Toast({
        message: `最多选择${genForm.count}个默认号码`,
        theme: "warning",
      });
      return;
    }
    // 添加选择
    genSelectedDefaultNumbers.value.push(num);
  }
}

// 选择默认号码
function selectDefaultNumber(num: DefaultNumber) {
  // 根据来源应用到不同的表单
  if (showGenerateSheet.value) {
    // 从随机生成弹窗打开（支持多选）
    const index = genSelectedDefaultNumbers.value.findIndex(
      (n) => n.id === num.id,
    );
    if (index > -1) {
      // 取消选择
      genSelectedDefaultNumbers.value.splice(index, 1);
    } else {
      // 检查是否超过限制
      if (genSelectedDefaultNumbers.value.length >= genForm.count) {
        Toast({
          message: `最多选择${genForm.count}个默认号码`,
          theme: "warning",
        });
        return;
      }
      // 添加选择
      genSelectedDefaultNumbers.value.push(num);
    }
  } else {
    // 从新增投注弹窗打开（单选）
    addForm.redNumbersInput = num.redNumbers;
    addForm.blueNumbersInput = num.blueNumbers || "";
    selectedDefaultNumberId.value = num.id;
    showDefaultNumberPicker.value = false;
  }
}

// 快捷应用默认号码（在号码选择器中）
function applyDefaultNumber(num: DefaultNumber) {
  addForm.redNumbersInput = num.redNumbers;
  addForm.blueNumbersInput = num.blueNumbers || "";
  selectedDefaultNumberId.value = num.id;
  showNumberPicker.value = false;
  Toast({ message: `已应用 "${num.name}" 的号码`, theme: "success" });
}

// 打开号码选择器
async function openNumberPicker(type: "red" | "blue") {
  if (!addForm.modeId) {
    Toast({ message: "请先选择彩票模式", theme: "warning" });
    return;
  }
  // 先获取默认号码列表，以便显示快捷选择
  await fetchDefaultNumbers();
  pickerType.value = type;
  const current =
    type === "red" ? addForm.redNumbersInput : addForm.blueNumbersInput;
  selectedNumbers.value = parseNumbers(current);
  showNumberPicker.value = true;
}

// 切换号码选择
function toggleNumber(n: number) {
  const index = selectedNumbers.value.indexOf(n);
  if (index > -1) {
    selectedNumbers.value.splice(index, 1);
  } else if (selectedNumbers.value.length < requiredCount.value) {
    selectedNumbers.value.push(n);
    selectedNumbers.value.sort((a, b) => a - b);
  } else {
    Toast({
      message: `最多选择 ${requiredCount.value} 个号码`,
      theme: "warning",
    });
  }
}

// 清空选择
function clearNumbers() {
  selectedNumbers.value = [];
}

// 确认号码选择
function confirmNumberPicker() {
  if (selectedNumbers.value.length !== requiredCount.value) {
    Toast({
      message: `请选择 ${requiredCount.value} 个号码`,
      theme: "warning",
    });
    return;
  }
  if (pickerType.value === "red") {
    addForm.redNumbersInput = selectedNumbers.value.join(",");
  } else {
    addForm.blueNumbersInput = selectedNumbers.value.join(",");
  }
  showNumberPicker.value = false;
}
function onModeConfirmForGen(value: (number | null)[]) {
  genForm.modeId = value[0] ?? null;
  // 清空历史数据
  genForm.count = 5;
  genForm.issueNo = "";
  genForm.betAmount = 2;
  genSelectedDefaultNumbers.value = [];
  showModePickerForGen.value = false;
}
function onWinStatusConfirm(value: string[]) {
  winForm.winStatus = value[0];
  showWinStatusPicker.value = false;
}
function onWinLevelConfirm(value: number[]) {
  winForm.winLevel = value[0];
  showWinLevelPicker.value = false;
}

async function handleFormSubmit({ valid, firstError }: any) {
  if (valid === false) {
    Toast({ message: firstError || "请检查表单填写", theme: "warning" });
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
    if (isEditingTicket.value && editingTicketId.value) {
      // 编辑模式
      await drawTicketApi.update(editingTicketId.value, {
        modeId: addForm.modeId,
        issueNo: addForm.issueNo || undefined,
        redNumbers,
        blueNumbers: blueNumbers.length ? blueNumbers : undefined,
        betAmount: addForm.betAmount,
      });
      Toast({ message: "更新成功", theme: "success" });
    } else {
      // 新增模式
      await drawTicketApi.create({
        modeId: addForm.modeId,
        issueNo: addForm.issueNo || undefined,
        redNumbers,
        blueNumbers: blueNumbers.length ? blueNumbers : undefined,
        betAmount: addForm.betAmount,
      });
      Toast({ message: "保存成功", theme: "success" });
    }
    showAddSheet.value = false;
    fetchTickets(true);
  } catch {
    /* ignore */
  } finally {
    addLoading.value = false;
  }
}

// 打开编辑弹窗
function openEditDialog(ticket: DrawTicket) {
  isEditingTicket.value = true;
  editingTicketId.value = ticket.id;
  addForm.modeId = ticket.modeId;
  addForm.issueNo = ticket.issueNo || "";
  addForm.redNumbersInput = Array.isArray(ticket.redNumbers)
    ? ticket.redNumbers.join(",")
    : String(ticket.redNumbers || "");
  addForm.blueNumbersInput = Array.isArray(ticket.blueNumbers)
    ? ticket.blueNumbers.join(",")
    : String(ticket.blueNumbers || "");
  addForm.betAmount = Number(ticket.betAmount);
  showAddSheet.value = true;
}

async function handleGenerate() {
  if (!genForm.modeId) {
    Toast({ message: "请选择彩票模式", theme: "warning" });
    return;
  }
  genLoading.value = true;
  try {
    // 先清空之前的生成结果
    generatedTickets.value = [];

    // 使用选中的默认号码
    const defaultTicketCount = genSelectedDefaultNumbers.value.length;
    const randomTicketCount = (genForm.count || 5) - defaultTicketCount;

    // 添加默认号码
    genSelectedDefaultNumbers.value.forEach((num) => {
      generatedTickets.value.push({
        redNumbers: num.redNumbers,
        blueNumbers: num.blueNumbers || "",
        isDefault: true,
        defaultName: num.name,
      });
    });

    // 如果还需要生成随机号码
    if (randomTicketCount > 0) {
      const res = await numbersApi.generateBatch({
        modeId: genForm.modeId,
        count: randomTicketCount,
      });
      const generated = res.data.data || [];
      generated.forEach((t: { red: number[]; blue: number[] }) => {
        generatedTickets.value.push({
          redNumbers: t.red.join(","),
          blueNumbers: t.blue.length ? t.blue.join(",") : "",
          isDefault: false,
        });
      });
    }

    Toast({
      message: `成功生成 ${generatedTickets.value.length} 注`,
      theme: "success",
    });
  } catch (error) {
    console.error("Generate error:", error);
    Toast({ message: "生成失败", theme: "error" });
  } finally {
    genLoading.value = false;
  }
}

// 保存生成的号码
async function saveGeneratedTickets() {
  if (!genForm.modeId || generatedTickets.value.length === 0) {
    Toast({ message: "请先生成号码", theme: "warning" });
    return;
  }
  genLoading.value = true;
  try {
    const requests = generatedTickets.value.map((ticket) => {
      // 将逗号分隔的字符串转换为数字数组
      const redNumbers = ticket.redNumbers
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      const blueNumbers = ticket.blueNumbers
        ? ticket.blueNumbers
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n))
        : [];
      return {
        modeId: genForm.modeId,
        issueNo: genForm.issueNo || undefined,
        redNumbers,
        blueNumbers: blueNumbers.length ? blueNumbers : undefined,
        betAmount: genForm.betAmount,
      };
    });
    await drawTicketApi.createBatch(requests);
    Toast({
      message: `成功保存 ${generatedTickets.value.length} 注`,
      theme: "success",
    });
    // 显示分享弹窗
    showShareSheet.value = true;
  } catch {
    Toast({ message: "保存失败", theme: "error" });
  } finally {
    genLoading.value = false;
  }
}

// 重新生成单个号码
async function regenerateSingle(index: number) {
  if (!genForm.modeId) return;
  try {
    const res = await numbersApi.generateBatch({
      modeId: genForm.modeId,
      count: 1,
    });
    const generated = res.data.data || [];
    if (generated.length > 0) {
      const t = generated[0];
      generatedTickets.value[index] = {
        redNumbers: t.red.join(","),
        blueNumbers: t.blue.length ? t.blue.join(",") : "",
        isDefault: false,
      };
    }
  } catch {
    /* ignore */
  }
}

// 删除单个生成的号码
function removeGenerated(index: number) {
  generatedTickets.value.splice(index, 1);
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

// 关闭分享弹窗
function closeShareSheet() {
  showShareSheet.value = false;
  showGenerateSheet.value = false;
  generatedTickets.value = [];
  genSelectedDefaultNumbers.value = [];
  shareLandscape.value = false; // 重置横屏状态
  fetchTickets(true);
}

// 切换横竖屏
function toggleLandscape() {
  shareLandscape.value = !shareLandscape.value;
}

// 复制文本
async function copyTicketText() {
  if (!genForm.modeId || generatedTickets.value.length === 0) return;

  let text = `${getModeName(genForm.modeId)}`;
  if (genForm.issueNo) {
    text += `\n期号: ${genForm.issueNo}`;
  }
  text += "\n";

  generatedTickets.value.forEach((ticket, index) => {
    text += `\n第${index + 1}注: `;
    text += `${ticket.redNumbers}`;
    if (ticket.blueNumbers) {
      text += ` + ${ticket.blueNumbers}`;
    }
  });

  text += `\n\n共${generatedTickets.value.length}注`;
  text += `\n投注金额: ${genForm.betAmount * generatedTickets.value.length}元`;

  try {
    await navigator.clipboard.writeText(text);
    Toast({ message: "复制成功", theme: "success" });
  } catch {
    // 降级方案
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    Toast({ message: "复制成功", theme: "success" });
  }
}

// 生成图片（使用canvas）
function generateImage() {
  Toast({ message: "生成图片功能开发中", theme: "info" });
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

.popup-content--scroll {
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

/* 默认号码选择器样式 */
.default-number-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:active {
    background: #e9ecef;
  }

  &--selected {
    background: #e6f7ff;
    border: 1px solid #1890ff;
  }
}

.default-number-check {
  color: #1890ff;
  font-size: 18px;
}

.default-number-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.default-number-numbers {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

/* 号码输入框包装器 */
.number-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.default-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;

  .no-default {
    font-size: 12px;
    color: #999;
  }
}

.form-submit-area {
  padding: 16px;
}

/* 默认号码快捷选择样式 */
.default-shortcut {
  padding: 12px 16px;
  background: #fffbe6;
  border-bottom: 1px solid #ffe58f;

  .shortcut-title {
    font-size: 13px;
    color: #ad8b00;
    margin-bottom: 8px;
    display: block;
  }

  .shortcut-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

/* 生成号码列表样式 */
.generated-list {
  padding: 0 16px;
  border-top: 1px solid #eee;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 13px;
  color: #666;
}

.generated-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;

  &--default {
    background: #fffbe6;
    border: 1px solid #ffe58f;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #999;
  gap: 8px;
}

.item-actions {
  display: flex;
  gap: 16px;
  color: #1890ff;
}

.item-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 号码选择器样式 */
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

/* 分享弹窗样式 */
.share-content {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 600;
}

.lottery-display {
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.lottery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.lottery-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.issue-no {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.ticket-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ticket-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
}

.ticket-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lottery-ball {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;

  &--red {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  }

  &--blue {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  }
}

.lottery-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.share-actions {
  padding: 16px;
}

/* 全屏分享弹窗样式 */
.share-fullscreen {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  position: relative;

  &--landscape {
    transform: rotate(90deg);
    transform-origin: center center;
    width: 100vh;
    height: 100vw;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -50vh;
    margin-top: -50vw;
    overflow: auto;
  }
}

.share-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.toolbar-icon {
  font-size: 20px;
  color: #666;
  padding: 8px;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.share-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
}

.share-actions-bottom {
  padding: 16px;
  border-top: 1px solid #eee;
  background: #fff;
  position: sticky;
  bottom: 0;
}
</style>
