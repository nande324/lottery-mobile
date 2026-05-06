<template>
  <div class="profile-view">
    <!-- 用户信息 -->
    <div class="profile-header">
      <div class="avatar">{{ userStore.username.charAt(0).toUpperCase() }}</div>
      <div class="user-info">
        <div class="username">{{ userStore.username }}</div>
        <div class="role-tag">
          {{ userStore.role === "ADMIN" ? "管理员" : "普通用户" }}
        </div>
      </div>
    </div>

    <!-- 本月统计 -->
    <t-cell-group title="本月统计" bordered style="margin-top: 8px">
      <t-cell
        title="总消费"
        :note="`¥${Number(overview.totalCost).toFixed(2)}`"
      />
      <t-cell
        title="总中奖"
        :note="`¥${Number(overview.totalWin).toFixed(2)}`"
      />
      <t-cell
        title="净盈亏"
        :note="`${Number(overview.netProfit) >= 0 ? '+' : ''}¥${Number(overview.netProfit).toFixed(2)}`"
      />
      <t-cell
        title="中奖率"
        :note="`${(Number(overview.winRate) * 100).toFixed(1)}%`"
      />
    </t-cell-group>

    <!-- 账户操作 -->
    <t-cell-group title="账户" bordered style="margin-top: 8px">
      <t-cell title="设置" arrow @click="$router.push('/settings')" />
    </t-cell-group>

    <!-- 退出登录 -->
    <div style="padding: 16px; margin-top: 8px">
      <t-button theme="danger" variant="outline" block @click="handleLogout"
        >退出登录</t-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Toast } from "tdesign-mobile-vue";
import { useUserStore } from "@/store/user";
import { statisticsApi, authApi } from "@/api";

const router = useRouter();
const userStore = useUserStore();
const overview = ref({
  totalCost: 0,
  totalWin: 0,
  netProfit: 0,
  totalTickets: 0,
  winTickets: 0,
  winRate: 0,
});

async function handleLogout() {
  try {
    await authApi.logout();
  } catch {
    /* ignore */
  }
  userStore.logout();
  router.push("/login");
}

onMounted(async () => {
  try {
    const res = await statisticsApi.overview({ timeRange: "MONTH" });
    overview.value = res.data.data || overview.value;
  } catch {
    /* ignore */
  }
});
</script>

<style scoped lang="scss">
.profile-view {
  padding-bottom: 16px;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
  background: linear-gradient(135deg, #0052d9, #1a2035);
  color: #fff;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}
.user-info {
  .username {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .role-tag {
    font-size: 12px;
    opacity: 0.8;
  }
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
