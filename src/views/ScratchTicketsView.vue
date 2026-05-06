<template>
  <div class="scratch-view">
    <div class="action-bar">
      <t-button theme="primary" size="small" @click="showAddSheet = true">
        <template #icon><t-icon name="add" /></template>
        新增记录
      </t-button>
    </div>

    <t-pull-down-refresh v-model="refreshing" @refresh="handleRefresh">
      <t-empty
        v-if="!tickets.length && !loading"
        description="暂无刮刮乐记录"
      />
      <div v-else>
        <div v-for="ticket in tickets" :key="ticket.id" class="scratch-card">
          <div class="scratch-header">
            <span class="scratch-type">{{ ticket.scratchType }}</span>
            <span class="scratch-date">{{ ticket.scratchDate }}</span>
          </div>
          <div class="scratch-amounts">
            <div class="amount-item">
              <div class="amount-label">消费</div>
              <div class="amount-value loss">
                ¥{{ Number(ticket.costAmount).toFixed(2) }}
              </div>
            </div>
            <div class="amount-item">
              <div class="amount-label">中奖</div>
              <div class="amount-value profit">
                ¥{{ Number(ticket.winAmount).toFixed(2) }}
              </div>
            </div>
            <div class="amount-item">
              <div class="amount-label">净盈亏</div>
              <div
                class="amount-value"
                :class="
                  Number(ticket.winAmount) - Number(ticket.costAmount) >= 0
                    ? 'profit'
                    : 'loss'
                "
              >
                {{
                  Number(ticket.winAmount) - Number(ticket.costAmount) >= 0
                    ? "+"
                    : ""
                }}¥{{
                  (
                    Number(ticket.winAmount) - Number(ticket.costAmount)
                  ).toFixed(2)
                }}
              </div>
            </div>
          </div>
          <div v-if="ticket.remark" class="scratch-remark">
            {{ ticket.remark }}
          </div>
          <div class="scratch-actions">
            <t-link theme="primary" size="small" @click="openEditSheet(ticket)"
              >编辑</t-link
            >
            <t-link theme="danger" size="small" @click="handleDelete(ticket.id)"
              >删除</t-link
            >
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

    <!-- 新增/编辑弹窗 -->
    <t-popup
      v-model:visible="showAddSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>{{ isEditing ? "编辑记录" : "新增刮刮乐记录" }}</span>
          <t-icon name="close" @click="showAddSheet = false" />
        </div>
        <t-cell-group bordered>
          <t-cell title="刮奖日期">
            <template #note>
              <t-input
                v-model="form.scratchDate"
                placeholder="YYYY-MM-DD"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="类型">
            <template #note>
              <t-input
                v-model="form.scratchType"
                placeholder="刮刮乐类型/名称"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="消费金额">
            <template #note>
              <t-input
                v-model.number="form.costAmount"
                type="number"
                placeholder="消费金额（元）"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="中奖金额">
            <template #note>
              <t-input
                v-model.number="form.winAmount"
                type="number"
                placeholder="中奖金额（元，默认0）"
                style="text-align: right"
              />
            </template>
          </t-cell>
          <t-cell title="备注">
            <template #note>
              <t-input
                v-model="form.remark"
                placeholder="备注（可选）"
                style="text-align: right"
              />
            </template>
          </t-cell>
        </t-cell-group>
        <div style="padding: 16px">
          <t-button
            theme="primary"
            block
            :loading="submitLoading"
            @click="handleSubmit"
            >保存</t-button
          >
        </div>
      </div>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Toast } from "tdesign-mobile-vue";
import { scratchTicketApi } from "@/api";

interface ScratchTicket {
  id: number;
  scratchDate: string;
  scratchType: string;
  costAmount: number;
  winAmount: number;
  remark: string | null;
}

const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const tickets = ref<ScratchTicket[]>([]);
const page = ref(1);
const hasMore = ref(false);
const showAddSheet = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);
const submitLoading = ref(false);
const form = reactive({
  scratchDate: "",
  scratchType: "",
  costAmount: 0,
  winAmount: 0,
  remark: "",
});

async function fetchTickets(reset = false) {
  if (reset) {
    page.value = 1;
    tickets.value = [];
  }
  loading.value = reset;
  loadingMore.value = !reset;
  try {
    const res = await scratchTicketApi.list({
      pageNum: page.value,
      pageSize: 20,
    });
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

function openEditSheet(ticket: ScratchTicket) {
  isEditing.value = true;
  currentId.value = ticket.id;
  Object.assign(form, {
    scratchDate: ticket.scratchDate,
    scratchType: ticket.scratchType,
    costAmount: Number(ticket.costAmount),
    winAmount: Number(ticket.winAmount),
    remark: ticket.remark || "",
  });
  showAddSheet.value = true;
}

async function handleSubmit() {
  if (!form.scratchDate || !form.scratchType) {
    Toast({ message: "请填写完整信息", theme: "warning" });
    return;
  }
  submitLoading.value = true;
  try {
    const payload = { ...form, remark: form.remark || undefined };
    if (isEditing.value && currentId.value) {
      await scratchTicketApi.update(currentId.value, payload);
      Toast({ message: "更新成功", theme: "success" });
    } else {
      await scratchTicketApi.create(payload);
      Toast({ message: "保存成功", theme: "success" });
    }
    showAddSheet.value = false;
    fetchTickets(true);
  } catch {
    /* ignore */
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await scratchTicketApi.delete(id);
    Toast({ message: "删除成功", theme: "success" });
    fetchTickets(true);
  } catch {
    /* ignore */
  }
}

onMounted(() => fetchTickets(true));
</script>

<style scoped lang="scss">
.scratch-view {
  padding-bottom: 16px;
}
.action-bar {
  padding: 12px 16px;
  background: #fff;
}
.scratch-card {
  background: #fff;
  margin: 8px 16px 0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.scratch-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  .scratch-type {
    font-weight: 600;
    font-size: 14px;
  }
  .scratch-date {
    font-size: 12px;
    color: #999;
  }
}
.scratch-amounts {
  display: flex;
  gap: 0;
  margin-bottom: 8px;
}
.amount-item {
  flex: 1;
  text-align: center;
  .amount-label {
    font-size: 11px;
    color: #999;
    margin-bottom: 4px;
  }
  .amount-value {
    font-size: 15px;
    font-weight: 600;
  }
}
.scratch-remark {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}
.scratch-actions {
  display: flex;
  gap: 12px;
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
.loss {
  color: #e34d59 !important;
}
</style>
