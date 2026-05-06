<template>
  <div class="mobile-layout">
    <!-- 顶部导航栏 -->
    <t-navbar :title="currentTitle" fixed>
      <template #right>
        <t-icon
          name="setting"
          size="20px"
          style="margin-right: 12px"
          @click="$router.push('/settings')"
        />
        <t-icon
          name="user-circle"
          size="22px"
          @click="$router.push('/profile')"
        />
      </template>
    </t-navbar>

    <!-- 页面内容 -->
    <div class="mobile-content">
      <router-view />
    </div>

    <!-- 底部 TabBar -->
    <t-tab-bar
      :value="activeTab"
      @change="handleTabChange"
      fixed
      safe-area-inset-bottom
    >
      <t-tab-bar-item value="/home">
        <template #icon>
          <t-icon name="home" />
        </template>
        首页
      </t-tab-bar-item>
      <t-tab-bar-item value="/draw-tickets">
        <template #icon>
          <t-icon name="task" />
        </template>
        摇奖
      </t-tab-bar-item>
      <t-tab-bar-item value="/scratch-tickets">
        <template #icon>
          <t-icon name="money" />
        </template>
        刮刮乐
      </t-tab-bar-item>
      <t-tab-bar-item value="/draw-results">
        <template #icon>
          <t-icon name="calendar-event" />
        </template>
        开奖
      </t-tab-bar-item>
      <t-tab-bar-item value="/statistics">
        <template #icon>
          <t-icon name="chart-line" />
        </template>
        统计
      </t-tab-bar-item>
    </t-tab-bar>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || "彩票管理");

function handleTabChange(value: string) {
  router.push(value);
}
</script>

<style scoped lang="scss">
.mobile-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 44px; // navbar height
  padding-bottom: 50px; // tabbar height
  background: #f5f5f5;
}
</style>
