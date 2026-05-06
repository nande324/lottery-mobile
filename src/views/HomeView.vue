<template>
  <div class="home-view">
    <!-- 用户欢迎区 -->
    <div class="home-banner">
      <div class="banner-content">
        <div class="welcome-text">
          <p>你好，{{ userStore.username }} 👋</p>
          <h3>本月统计</h3>
        </div>
        <div class="overview-stats">
          <div class="stat-item">
            <div class="stat-value loss">
              ¥{{ Number(overview.totalCost).toFixed(0) }}
            </div>
            <div class="stat-label">总消费</div>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <div class="stat-value profit">
              ¥{{ Number(overview.totalWin).toFixed(0) }}
            </div>
            <div class="stat-label">总中奖</div>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <div
              class="stat-value"
              :class="Number(overview.netProfit) >= 0 ? 'profit' : 'loss'"
            >
              {{ Number(overview.netProfit) >= 0 ? "+" : "" }}¥{{
                Number(overview.netProfit).toFixed(0)
              }}
            </div>
            <div class="stat-label">净盈亏</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-entry">
      <t-grid :column="4" border>
        <t-grid-item
          v-for="item in quickEntries"
          :key="item.path"
          :text="item.label"
          @click="$router.push(item.path)"
        >
          <template #image>
            <t-icon :name="item.icon" size="24px" />
          </template>
        </t-grid-item>
      </t-grid>
    </div>

    <!-- 最近投注 -->
    <div class="section">
      <div class="section-header">
        <span>最近投注</span>
        <t-link theme="primary" @click="$router.push('/draw-tickets')"
          >查看全部</t-link
        >
      </div>
      <t-loading
        v-if="ticketsLoading"
        size="small"
        style="padding: 20px; text-align: center"
      />
      <t-empty
        v-else-if="!recentTickets.length"
        description="暂无投注记录"
        size="small"
      />
      <div v-else>
        <div
          v-for="ticket in recentTickets"
          :key="ticket.id"
          class="ticket-card"
        >
          <div class="ticket-header">
            <span class="mode-tag">{{ getModeName(ticket.modeId) }}</span>
            <span class="issue-no">{{ ticket.issueNo || "无期号" }}</span>
            <t-tag
              :theme="
                ticket.winStatus === 'WIN'
                  ? 'success'
                  : ticket.winStatus === 'NO_WIN'
                    ? 'danger'
                    : 'default'
              "
              size="small"
              variant="light"
            >
              {{
                ticket.winStatus === "WIN"
                  ? "已中奖"
                  : ticket.winStatus === "NO_WIN"
                    ? "未中奖"
                    : "待开奖"
              }}
            </t-tag>
          </div>
          <div class="ticket-numbers">
            <div class="ticket-row">
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
          <div class="ticket-footer">
            <span>投注 ¥{{ Number(ticket.betAmount).toFixed(2) }}</span>
            <span v-if="ticket.winStatus === 'WIN'" class="profit"
              >中奖 ¥{{ Number(ticket.winAmount).toFixed(2) }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import { statisticsApi, drawTicketApi, lotteryModeApi } from "@/api";
import type { LotteryMode } from "@/types";

interface DrawTicket {
  id: number;
  modeId: number;
  issueNo: string | null;
  redNumbers: unknown;
  blueNumbers: unknown;
  betAmount: number;
  winStatus: string;
  winAmount: number | null;
}

const userStore = useUserStore();
const overview = ref({
  totalCost: 0,
  totalWin: 0,
  netProfit: 0,
  totalTickets: 0,
  winTickets: 0,
  winRate: 0,
});
const recentTickets = ref<DrawTicket[]>([]);
const ticketsLoading = ref(false);
const modes = ref<LotteryMode[]>([]);

const quickEntries = [
  { label: "摇奖管理", path: "/draw-tickets", icon: "task" },
  { label: "刮刮乐", path: "/scratch-tickets", icon: "money" },
  { label: "开奖记录", path: "/draw-results", icon: "calendar-event" },
  { label: "数据统计", path: "/statistics", icon: "chart-line" },
];

function getModeName(modeId: number) {
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

onMounted(async () => {
  try {
    const [ovRes, modesRes] = await Promise.all([
      statisticsApi.overview({ timeRange: "MONTH" }),
      lotteryModeApi.list(),
    ]);
    overview.value = ovRes.data.data || overview.value;
    modes.value = modesRes.data.data || [];
  } catch {
    /* ignore */
  }

  ticketsLoading.value = true;
  try {
    const res = await drawTicketApi.list({ pageNum: 1, pageSize: 5 });
    recentTickets.value = res.data.data?.records || [];
  } catch {
    /* ignore */
  } finally {
    ticketsLoading.value = false;
  }
});
</script>

<style scoped lang="scss">
.home-view {
  padding-bottom: 16px;
}

.home-banner {
  background: linear-gradient(135deg, #0052d9, #1a2035);
  padding: 16px;
  color: #fff;
}

.banner-content {
  .welcome-text {
    p {
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }
  }
}

.overview-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 0;
}

.stat-item {
  flex: 1;
  text-align: center;
  .stat-value {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .stat-label {
    font-size: 12px;
    opacity: 0.7;
  }
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
}

.quick-entry {
  background: #fff;
  margin-top: 8px;
  padding: 8px 0;

  :deep(.t-grid-item) {
    .t-grid-item__image {
      margin-bottom: 8px;

      .t-icon {
        color: #0052d9;
      }
    }

    .t-grid-item__text {
      font-size: 12px;
      color: #333;
    }
  }
}

.section {
  background: #fff;
  margin-top: 8px;
  padding: 12px 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
}

.ticket-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
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
    font-size: 13px;
    color: #333;
    flex: 1;
  }
}

.ticket-numbers {
  margin-bottom: 6px;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.profit {
  color: #00a870 !important;
}
.loss {
  color: #e34d59 !important;
}
</style>
