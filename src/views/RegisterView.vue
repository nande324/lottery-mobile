<template>
  <div class="register-page">
    <t-navbar title="注册账号" left-arrow @left-click="goBack" />
    <div class="register-form">
      <div class="form-item">
        <div class="form-label">
          <t-icon name="user" class="form-icon" />
          <span>用户名</span>
        </div>
        <t-input
          v-model="form.username"
          placeholder="4-20位字母数字，如：admin123"
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
          placeholder="至少8位，必须包含字母和数字"
          class="form-input password-input"
          size="large"
          autocomplete="new-password"
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

      <div class="form-item">
        <div class="form-label">
          <t-icon name="check-circle" class="form-icon" />
          <span>确认密码</span>
        </div>
        <t-input
          v-model="form.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="再次输入密码"
          class="form-input password-input"
          size="large"
          autocomplete="new-password"
        >
          <template #suffixIcon>
            <t-icon
              :name="showConfirmPassword ? 'browse-off' : 'browse'"
              @click="showConfirmPassword = !showConfirmPassword"
              style="cursor: pointer"
            />
          </template>
        </t-input>
      </div>
      <t-notice-bar
        v-if="errorMsg"
        :content="errorMsg"
        theme="error"
        style="margin-top: 16px; border-radius: 8px"
      />
      <div class="register-actions button-group">
        <t-button
          theme="primary"
          block
          size="large"
          :loading="loading"
          @click="handleRegister"
          class="primary-btn"
        >
          注 册
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "@/api";
import { Toast } from "tdesign-mobile-vue";

const router = useRouter();
const loading = ref(false);
const errorMsg = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const form = reactive({ username: "", password: "", confirmPassword: "" });

// 表单验证规则
function validateForm() {
  if (!form.username) {
    errorMsg.value = "请输入用户名";
    return false;
  }
  if (!/^[a-zA-Z0-9]{4,20}$/.test(form.username)) {
    errorMsg.value = "用户名必须为4-20位字母数字";
    return false;
  }
  if (!form.password) {
    errorMsg.value = "请输入密码";
    return false;
  }
  if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(form.password)) {
    errorMsg.value = "密码必须8位以上且包含字母和数字";
    return false;
  }
  if (form.password !== form.confirmPassword) {
    errorMsg.value = "两次密码不一致";
    return false;
  }
  return true;
}

async function handleRegister() {
  if (!validateForm()) return;

  errorMsg.value = "";
  loading.value = true;
  try {
    await authApi.register({
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    Toast({ message: "注册成功，请登录", theme: "success" });
    router.push("/login");
  } catch (err: unknown) {
    const e = err as { message?: string };
    errorMsg.value = e.message || "注册失败";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  try {
    // 尝试返回上一页
    if (window.history.length > 1) {
      router.go(-1);
    } else {
      // 如果没有历史记录，跳转到登录页面
      router.push("/login");
    }
  } catch (error) {
    // 如果出现任何错误，直接跳转到登录页面
    router.push("/login");
  }
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
}
.register-form {
  padding: 16px;
  background: #fff;
  margin-top: 8px;
  border-radius: 12px;
  margin-left: 16px;
  margin-right: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .register-actions {
    margin-top: 32px;
  }
}
</style>
