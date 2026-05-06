<template>
  <div class="login-page">
    <div class="login-header">
      <div class="login-logo">🎰</div>
      <h2>彩票管理</h2>
      <p>记录每一次投注</p>
    </div>

    <div class="login-form">
      <div class="form-item">
        <div class="form-label">
          <t-icon name="user" class="form-icon" />
          <span>用户名</span>
        </div>
        <t-input
          v-model="form.username"
          placeholder="请输入用户名"
          clearable
          class="form-input"
          size="large"
        />
      </div>

      <div class="form-item">
        <div class="form-label">
          <t-icon name="lock-on" class="form-icon" />
          <span>密码</span>
        </div>
        <t-input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
          class="form-input password-input"
          size="large"
          autocomplete="current-password"
        >
          <template #suffixIcon>
            <t-icon
              :name="showPassword ? 'browse-off' : 'browse'"
              @click="showPassword = !showPassword"
              style="cursor: pointer"
            />
          </template>
        </t-input>
      </div>

      <t-notice-bar
        v-if="errorMsg"
        :content="errorMsg"
        theme="error"
        class="error-notice"
      />

      <div class="login-actions button-group">
        <t-button
          theme="primary"
          block
          size="large"
          :loading="loading"
          @click="handleLogin"
          class="primary-btn"
        >
          登 录
        </t-button>
        <t-button
          variant="outline"
          block
          size="large"
          class="outline-btn"
          @click="$router.push('/register')"
        >
          注册账号
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { authApi } from "@/api";

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const errorMsg = ref("");
const showPassword = ref(false);
const form = reactive({ username: "", password: "" });

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMsg.value = "请输入用户名和密码";
    return;
  }
  errorMsg.value = "";
  loading.value = true;
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password,
    });
    const data = res.data.data;
    userStore.login(data.token, {
      userId: data.userId,
      username: data.username,
      role: data.role,
    });
    router.push("/home");
  } catch (err: unknown) {
    const e = err as { message?: string };
    errorMsg.value = e.message || "用户名或密码错误";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0052d9 0%, #1a2035 40%, #f5f5f5 40%);
  padding: 0 16px;
}

.login-header {
  text-align: center;
  padding: 60px 0 32px;
  color: #fff;

  .login-logo {
    font-size: 56px;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  p {
    font-size: 14px;
    opacity: 0.8;
  }
}

.login-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  .login-actions {
    margin-top: 32px;
  }
}
</style>
