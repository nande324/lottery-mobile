import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("token") || "");
  const username = ref(localStorage.getItem("username") || "");
  const role = ref(localStorage.getItem("role") || "");
  const userId = ref<number | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  function login(
    newToken: string,
    info: { userId: number; username: string; role: string },
  ) {
    token.value = newToken;
    userId.value = info.userId;
    username.value = info.username;
    role.value = info.role;
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", info.username);
    localStorage.setItem("role", info.role);
  }

  function logout() {
    token.value = "";
    userId.value = null;
    username.value = "";
    role.value = "";
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  }

  return { token, userId, username, role, isLoggedIn, login, logout };
});
