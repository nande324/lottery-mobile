<template>
  <div class="settings-view">
    <t-navbar title="设置" left-arrow @left-click="goBack" />

    <!-- 账户设置 -->
    <t-cell-group title="账户设置" bordered style="margin-top: 8px">
      <t-cell title="修改密码" arrow @click="showPwdSheet = true" />
      <t-cell title="清除缓存" arrow @click="handleClearCache" />
    </t-cell-group>

    <!-- 应用设置 -->
    <t-cell-group title="应用设置" bordered style="margin-top: 8px">
      <t-cell title="自动刷新" arrow>
        <template #note>
          <t-switch
            v-model="settings.autoRefresh"
            @change="handleSettingChange"
          />
        </template>
      </t-cell>
      <t-cell title="推送通知" arrow>
        <template #note>
          <t-switch
            v-model="settings.pushNotification"
            @change="handleSettingChange"
          />
        </template>
      </t-cell>
      <t-cell title="深色模式" arrow>
        <template #note>
          <t-switch v-model="settings.darkMode" @change="handleSettingChange" />
        </template>
      </t-cell>
    </t-cell-group>

    <!-- 数据管理 -->
    <t-cell-group title="数据管理" bordered style="margin-top: 8px">
      <t-cell title="导出数据" arrow @click="handleExportData" />
      <t-cell title="数据备份" arrow @click="handleBackupData" />
    </t-cell-group>

    <!-- 关于 -->
    <t-cell-group title="关于" bordered style="margin-top: 8px">
      <t-cell title="版本信息" :note="appVersion" />
      <t-cell title="用户协议" arrow @click="showAgreement = true" />
      <t-cell title="隐私政策" arrow @click="showPrivacy = true" />
    </t-cell-group>

    <!-- 退出登录 -->
    <div style="padding: 16px; margin-top: 16px">
      <t-button theme="danger" variant="outline" block @click="handleLogout">
        退出登录
      </t-button>
    </div>

    <!-- 修改密码弹窗 -->
    <t-popup
      v-model:visible="showPwdSheet"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>修改密码</span>
          <t-icon name="close" @click="showPwdSheet = false" />
        </div>
        <div class="password-form">
          <div class="form-item">
            <div class="form-label">
              <t-icon name="lock-on" class="form-icon" />
              <span>原密码</span>
            </div>
            <t-input
              v-model="pwdForm.oldPassword"
              type="password"
              placeholder="请输入原密码"
              class="form-input"
              size="large"
            />
          </div>

          <div class="form-item">
            <div class="form-label">
              <t-icon name="secured" class="form-icon" />
              <span>新密码</span>
            </div>
            <t-input
              v-model="pwdForm.newPassword"
              type="password"
              placeholder="8位以上，含字母和数字"
              class="form-input"
              size="large"
            />
          </div>

          <div class="form-item">
            <div class="form-label">
              <t-icon name="check-circle" class="form-icon" />
              <span>确认密码</span>
            </div>
            <t-input
              v-model="pwdForm.confirmNewPassword"
              type="password"
              placeholder="再次输入新密码"
              class="form-input"
              size="large"
            />
          </div>
        </div>
        <div style="padding: 16px">
          <t-button
            theme="primary"
            block
            :loading="pwdLoading"
            @click="handleChangePwd"
          >
            确认修改
          </t-button>
        </div>
      </div>
    </t-popup>

    <!-- 用户协议弹窗 -->
    <t-popup
      v-model:visible="showAgreement"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', height: '80vh' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>用户协议</span>
          <t-icon name="close" @click="showAgreement = false" />
        </div>
        <div class="agreement-content">
          <h3>彩票管理系统用户协议</h3>
          <p>欢迎使用彩票管理系统！</p>
          <h4>1. 服务说明</h4>
          <p>
            本应用仅用于个人彩票投注记录管理，不涉及任何实际的彩票购买或兑奖服务。
          </p>
          <h4>2. 用户责任</h4>
          <p>用户应确保所记录的数据真实有效，并对自己的账户安全负责。</p>
          <h4>3. 隐私保护</h4>
          <p>我们承诺保护用户隐私，不会泄露用户的个人信息和投注记录。</p>
          <h4>4. 免责声明</h4>
          <p>本应用仅作为记录工具，不对用户的投注决策承担任何责任。</p>
        </div>
      </div>
    </t-popup>

    <!-- 隐私政策弹窗 -->
    <t-popup
      v-model:visible="showPrivacy"
      placement="bottom"
      :style="{ borderRadius: '12px 12px 0 0', height: '80vh' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <span>隐私政策</span>
          <t-icon name="close" @click="showPrivacy = false" />
        </div>
        <div class="agreement-content">
          <h3>隐私政策</h3>
          <h4>1. 信息收集</h4>
          <p>我们只收集您主动提供的投注记录和账户信息。</p>
          <h4>2. 信息使用</h4>
          <p>收集的信息仅用于提供服务和改善用户体验。</p>
          <h4>3. 信息保护</h4>
          <p>我们采用行业标准的安全措施保护您的数据安全。</p>
          <h4>4. 信息共享</h4>
          <p>我们不会与第三方共享您的个人信息。</p>
        </div>
      </div>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Toast, Dialog } from "tdesign-mobile-vue";
import { useUserStore } from "@/store/user";
import { authApi } from "@/api";

const router = useRouter();
const userStore = useUserStore();

const appVersion = "1.0.0";
const showPwdSheet = ref(false);
const showAgreement = ref(false);
const showPrivacy = ref(false);
const pwdLoading = ref(false);

const settings = reactive({
  autoRefresh: true,
  pushNotification: false,
  darkMode: false,
});

const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});

// 加载设置
function loadSettings() {
  const savedSettings = localStorage.getItem("app-settings");
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings));
  }
}

// 保存设置
function saveSettings() {
  localStorage.setItem("app-settings", JSON.stringify(settings));
}

function handleSettingChange() {
  saveSettings();
  Toast({ message: "设置已保存", theme: "success" });
}

function handleClearCache() {
  Dialog({
    title: "清除缓存",
    content: "确定要清除应用缓存吗？这将清除所有本地数据。",
    confirmBtn: "确定",
    cancelBtn: "取消",
    onConfirm: () => {
      // 清除除了token之外的所有缓存
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      const role = localStorage.getItem("role");

      localStorage.clear();

      if (token) localStorage.setItem("token", token);
      if (username) localStorage.setItem("username", username);
      if (role) localStorage.setItem("role", role);

      Toast({ message: "缓存已清除", theme: "success" });
    },
  });
}

function handleExportData() {
  Toast({ message: "数据导出功能开发中...", theme: "warning" });
}

function handleBackupData() {
  Toast({ message: "数据备份功能开发中...", theme: "warning" });
}

async function handleChangePwd() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) {
    Toast({ message: "请填写完整信息", theme: "warning" });
    return;
  }
  if (pwdForm.newPassword !== pwdForm.confirmNewPassword) {
    Toast({ message: "两次密码不一致", theme: "warning" });
    return;
  }
  if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(pwdForm.newPassword)) {
    Toast({ message: "密码必须8位以上且包含字母和数字", theme: "warning" });
    return;
  }

  pwdLoading.value = true;
  try {
    await authApi.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
      confirmNewPassword: pwdForm.confirmNewPassword,
    });
    Toast({ message: "密码修改成功", theme: "success" });
    showPwdSheet.value = false;
    Object.assign(pwdForm, {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  } catch {
    /* ignore */
  } finally {
    pwdLoading.value = false;
  }
}

function handleLogout() {
  Dialog({
    title: "退出登录",
    content: "确定要退出登录吗？",
    confirmBtn: "确定",
    cancelBtn: "取消",
    onConfirm: async () => {
      try {
        await authApi.logout();
      } catch {
        /* ignore */
      }
      userStore.logout();
      router.push("/login");
    },
  });
}

function goBack() {
  try {
    console.log(window.history);
    // 尝试返回上一页
    if (window.history.length > 1) {
      router.go(-1);
    } else {
      // 如果没有历史记录，跳转到我的页面
      router.push("/profile");
    }
  } catch (error) {
    console.log(error);
    // 如果出现任何错误，直接跳转到我的页面
    router.push("/profile");
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.settings-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 16px;
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

.agreement-content {
  padding: 16px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    text-align: center;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 16px 0 8px;
    color: #333;
  }

  p {
    font-size: 13px;
    line-height: 1.6;
    color: #666;
    margin-bottom: 8px;
  }
}

.password-form {
  padding: 16px;
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;

  .form-icon {
    margin-right: 6px;
    color: #0052d9;
  }
}

.form-input {
  width: 100%;

  :deep(.t-input) {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s ease;

    &:focus-within {
      border-color: #0052d9;
      background: #fff;
      box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
    }
  }

  :deep(.t-input__inner) {
    padding: 12px 16px;
    font-size: 16px;
    line-height: 1.5;
  }

  :deep(.t-input__prefix),
  :deep(.t-input__suffix) {
    padding: 0 8px;
  }
}
</style>
