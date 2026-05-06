<template>
  <div class="statistics-view">
    <!-- 时间范围选择 -->
    <div class="time-selector">
      <t-radio-group v-model="timeRange" @change="handleTimeRangeChange">
        <t-radio
          value="ALL"
          label="全部"
          :class="{ 'radio-selected': timeRange === 'ALL' }"
        />
        <t-radio
          value="YEAR"
          label="本年"
          :class="{ 'radio-selected': timeRange === 'YEAR' }"
        />
        <t-radio
          value="MONTH"
          label="本月"
          :class="{ 'radio-selected': timeRange === 'MONTH' }"
        />
        <t-radio
          value="WEEK"
          label="本周"
          :class="{ 'radio-selected': timeRange === 'WEEK' }"
        />
      </t-radio-group>
      <div class="data-source-tip">
        <t-icon name="check-circle" size="14px" style="color: #00a870" />
        <span>使用后端精确统计</span>
      </div>
    </div>

    <!-- 总览统计 -->
    <div class="overview-section">
      <div class="section-title">总览</div>
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-value loss">
            ¥{{ overview.totalCost.toFixed(0) }}
          </div>
          <div class="stat-label">总消费</div>
        </div>
        <div class="stat-card">
          <div class="stat-value profit">
            ¥{{ overview.totalWin.toFixed(0) }}
          </div>
          <div class="stat-label">总中奖</div>
        </div>
        <div class="stat-card">
          <div
            class="stat-value"
            :class="overview.netProfit >= 0 ? 'profit' : 'loss'"
          >
            {{ overview.netProfit >= 0 ? "+" : "" }}¥{{
              overview.netProfit.toFixed(0)
            }}
          </div>
          <div class="stat-label">净盈亏</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ (overview.winRate * 100).toFixed(1) }}%
          </div>
          <div class="stat-label">综合中奖率</div>
        </div>
      </div>

      <!-- 投资回报率 -->
      <div class="roi-section">
        <div class="roi-card" :class="roiClass">
          <div class="roi-icon">{{ roiIcon }}</div>
          <div class="roi-content">
            <div class="roi-label">投资回报率 (ROI)</div>
            <div class="roi-value">{{ roiValue }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 摇奖统计 -->
    <div class="section">
      <div class="section-title">摇奖统计</div>
      <t-cell-group bordered>
        <t-cell
          title="总投注"
          :note="`${drawStats.totalTickets}注 / ¥${drawStats.totalCost.toFixed(2)}`"
        />
        <t-cell
          title="中奖情况"
          :note="`${drawStats.winTickets}注 / ¥${drawStats.totalWin.toFixed(2)}`"
        />
        <t-cell
          title="中奖率"
          :note="`${(drawStats.winRate * 100).toFixed(1)}%`"
        />
        <t-cell title="最高单注" :note="`¥${drawStats.maxWin.toFixed(2)}`" />
      </t-cell-group>
    </div>

    <!-- 刮刮乐统计 -->
    <div class="section">
      <div class="section-title">刮刮乐统计</div>
      <t-cell-group bordered>
        <t-cell
          title="总刮奖"
          :note="`${scratchStats.totalTickets}张 / ¥${scratchStats.totalCost.toFixed(2)}`"
        />
        <t-cell
          title="中奖情况"
          :note="`${scratchStats.winTickets}张 / ¥${scratchStats.totalWin.toFixed(2)}`"
        />
        <t-cell
          title="中奖率"
          :note="`${(scratchStats.winRate * 100).toFixed(1)}%`"
        />
        <t-cell title="最高单张" :note="`¥${scratchStats.maxWin.toFixed(2)}`" />
      </t-cell-group>
    </div>

    <!-- 趋势图表 -->
    <div class="section">
      <div class="section-title">趋势分析</div>
      <div class="chart-container">
        <div class="chart-placeholder">
          <t-icon name="chart-line" size="48px" style="color: #ddd" />
          <p style="color: #999; margin-top: 8px">图表功能开发中...</p>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="section">
      <div class="section-title">最近记录</div>
      <div v-if="recentActivities.length">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon">
            <t-icon :name="activity.type === 'draw' ? 'task' : 'money'" />
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-desc">{{ activity.description }}</div>
            <div v-if="activity.time" class="activity-time">
              {{ activity.time }}
            </div>
          </div>
          <div
            class="activity-amount"
            :class="activity.amount >= 0 ? 'profit' : 'loss'"
          >
            {{ activity.amount >= 0 ? "+" : "" }}¥{{
              Math.abs(activity.amount).toFixed(2)
            }}
          </div>
        </div>
      </div>
      <t-empty v-else description="暂无记录" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { statisticsApi, drawTicketApi, scratchTicketApi } from "@/api";

const timeRange = ref("ALL");
const loading = ref(false);

const overview = ref({
  totalCost: 0,
  totalWin: 0,
  netProfit: 0,
  totalTickets: 0,
  winTickets: 0,
  winRate: 0,
});

const drawStats = ref({
  totalTickets: 0,
  totalCost: 0,
  totalWin: 0,
  winTickets: 0,
  winRate: 0,
  maxWin: 0,
});

const scratchStats = ref({
  totalTickets: 0,
  totalCost: 0,
  totalWin: 0,
  winTickets: 0,
  winRate: 0,
  maxWin: 0,
});

// 计算投资回报率相关数据
const roiValue = computed(() => {
  if (overview.value.totalCost === 0) return "0.0";
  const roi = (overview.value.netProfit / overview.value.totalCost) * 100;
  return roi >= 0 ? `+${roi.toFixed(1)}` : roi.toFixed(1);
});

const roiClass = computed(() => {
  const roi = overview.value.netProfit / overview.value.totalCost;
  return roi >= 0 ? "roi-positive" : "roi-negative";
});

const roiIcon = computed(() => {
  const roi = overview.value.netProfit / overview.value.totalCost;
  return roi >= 0 ? "📈" : "📉";
});

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // 今天，显示时间
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    // 昨天
    return (
      "昨天 " +
      date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  } else if (diffDays < 7) {
    // 一周内，显示几天前
    return `${diffDays}天前`;
  } else {
    // 超过一周，显示日期
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    });
  }
};

const recentActivities = ref<
  Array<{
    id: string;
    type: "draw" | "scratch";
    title: string;
    description: string;
    amount: number;
  }>
>([]);

const fetchStatistics = async () => {
  loading.value = true;
  try {
    const params = { timeRange: timeRange.value };

    // 使用与管理端相同的高级统计API
    const [advancedRes, overviewRes] = await Promise.all([
      statisticsApi.advanced(params),
      statisticsApi.overview(params),
    ]);

    const advancedData = advancedRes.data.data || {};
    const overviewData = overviewRes.data.data || {};

    // 更新总览数据（使用后端统计结果）
    overview.value = {
      totalCost: Number(advancedData.totalCost || 0),
      totalWin: Number(advancedData.totalWin || 0),
      netProfit: Number(advancedData.netProfit || 0),
      totalTickets:
        Number(advancedData.totalTickets || 0) +
        Number(advancedData.scratchTotalQuantity || 0),
      winTickets:
        Number(advancedData.winTickets || 0) +
        Number(advancedData.scratchWinCount || 0),
      winRate: (() => {
        const totalCount =
          Number(advancedData.totalTickets || 0) +
          Number(advancedData.scratchTotalQuantity || 0);
        const totalWins =
          Number(advancedData.winTickets || 0) +
          Number(advancedData.scratchWinCount || 0);
        return totalCount > 0 ? totalWins / totalCount : 0;
      })(),
    };

    // 摇奖统计（使用后端数据）
    const drawTotalCost =
      Number(advancedData.totalCost || 0) -
      Number(advancedData.scratchTotalCost || 0);
    const drawTotalWin =
      Number(advancedData.totalWin || 0) -
      Number(advancedData.scratchTotalWin || 0);

    drawStats.value = {
      totalTickets: Number(advancedData.totalTickets || 0),
      totalCost: drawTotalCost,
      totalWin: drawTotalWin,
      winTickets: Number(advancedData.winTickets || 0),
      winRate: Number(advancedData.winRate || 0),
      maxWin: Number(advancedData.maxSingleWin || 0),
    };

    // 刮刮乐统计（使用后端数据）
    scratchStats.value = {
      totalTickets: Number(advancedData.scratchTotalQuantity || 0),
      totalCost: Number(advancedData.scratchTotalCost || 0),
      totalWin: Number(advancedData.scratchTotalWin || 0),
      winTickets: Number(advancedData.scratchWinCount || 0),
      winRate: Number(advancedData.scratchWinRate || 0),
      maxWin: Number(advancedData.scratchMaxSingleWin || 0),
    };

    // 获取最近活动记录（仅用于展示，不用于统计计算）
    try {
      const [drawRes, scratchRes] = await Promise.all([
        drawTicketApi.list({ pageNum: 1, pageSize: 3 }),
        scratchTicketApi.list({ pageNum: 1, pageSize: 3 }),
      ]);

      const drawTickets = drawRes.data.data?.records || [];
      const scratchTickets = scratchRes.data.data?.records || [];

      const activities = [
        ...drawTickets.map((t: any) => ({
          id: `draw-${t.id}`,
          type: "draw" as const,
          title: "摇奖投注",
          description: `期号: ${t.issueNo || "无"}`,
          time: t.drawTime
            ? formatDateTime(t.drawTime)
            : t.betTime
              ? formatDateTime(t.betTime)
              : t.createdTime
                ? formatDateTime(t.createdTime)
                : null,
          rawTime: t.drawTime || t.betTime || t.createdTime || `draw-${t.id}`,
          amount:
            t.winStatus === "WIN"
              ? Number(t.winAmount) - Number(t.betAmount)
              : -Number(t.betAmount),
        })),
        ...scratchTickets.map((t: any) => ({
          id: `scratch-${t.id}`,
          type: "scratch" as const,
          title: "刮刮乐",
          description: t.scratchType || "刮奖",
          time: t.scratchDate
            ? formatDateTime(t.scratchDate)
            : t.createdTime
              ? formatDateTime(t.createdTime)
              : null,
          rawTime: t.scratchDate || t.createdTime || `scratch-${t.id}`,
          amount: Number(t.winAmount) - Number(t.costAmount),
        })),
      ]
        .sort((a, b) => {
          // 优先按时间排序，如果没有时间则按ID排序
          const timeA = a.rawTime || a.id;
          const timeB = b.rawTime || b.id;
          return timeB.localeCompare(timeA);
        })
        .slice(0, 5);

      recentActivities.value = activities;
    } catch (error) {
      console.warn("获取最近活动记录失败:", error);
      recentActivities.value = [];
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleTimeRangeChange = () => {
  fetchStatistics();
};

onMounted(() => {
  fetchStatistics();
});
</script>

<style scoped lang="scss">
.statistics-view {
  padding-bottom: 16px;
}

.time-selector {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-selector :deep(.t-radio-group) {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.time-selector :deep(.t-radio) {
  margin-right: 0;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  flex: 1;
  min-width: 0;
  text-align: center;
}

.time-selector :deep(.t-radio:hover) {
  border-color: #0052d9;
  background: #f0f8ff;
}

/* 选中状态样式 - 使用自定义类 */
.time-selector :deep(.t-radio.radio-selected) {
  background: #0052d9 !important;
  border-color: #0052d9 !important;
}

.time-selector :deep(.t-radio.radio-selected .t-radio__title) {
  color: white !important;
}

/* 选中状态样式 - 使用属性选择器 */
.time-selector :deep(.t-radio[aria-checked="true"]) {
  background: #0052d9 !important;
  border-color: #0052d9 !important;
}

.time-selector :deep(.t-radio[aria-checked="true"] .t-radio__title) {
  color: white !important;
}

/* 备用选择器 - 通过input状态 */
.time-selector :deep(.t-radio:has(input:checked)) {
  background: #0052d9 !important;
  border-color: #0052d9 !important;
}

.time-selector :deep(.t-radio:has(input:checked) .t-radio__title) {
  color: white !important;
}

/* 隐藏默认的radio图标 */
.time-selector :deep(.t-radio .t-radio__icon) {
  display: none !important;
}

/* 调整文字样式 */
.time-selector :deep(.t-radio .t-radio__title) {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: color 0.3s ease;
}

/* 移除边框 */
.time-selector :deep(.t-radio .t-radio__border) {
  display: none;
}

.data-source-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.overview-section {
  background: #fff;
  padding: 16px;
  margin-top: 8px;
}

.section {
  background: #fff;
  margin-top: 8px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.roi-section {
  margin-top: 12px;
}

.roi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0052d9;

  .roi-icon {
    font-size: 24px;
  }

  .roi-content {
    flex: 1;
  }

  .roi-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 2px;
  }

  .roi-value {
    font-size: 18px;
    font-weight: 700;
  }

  &.roi-positive {
    border-left-color: #00a870;
    .roi-value {
      color: #00a870;
    }
  }

  &.roi-negative {
    border-left-color: #e34d59;
    .roi-value {
      color: #e34d59;
    }
  }
}

.stat-card {
  text-align: center;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 8px;

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #666;
  }
}

.chart-container {
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.chart-placeholder {
  text-align: center;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #666;
}

.activity-content {
  flex: 1;

  .activity-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .activity-desc {
    font-size: 12px;
    color: #999;
  }

  .activity-time {
    font-size: 11px;
    color: #bbb;
    margin-top: 2px;
  }
}

.activity-amount {
  font-size: 14px;
  font-weight: 600;
}

.profit {
  color: #00a870;
}

.loss {
  color: #e34d59;
}
</style>
