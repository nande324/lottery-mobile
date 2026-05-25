import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(process.env.NODE_ENV === "production" ? "/mobile/" : "/"),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
      meta: { hideTabbar: true },
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { hideTabbar: true },
    },
    {
      path: "/settings",
      name: "Settings",
      component: () => import("@/views/SettingsView.vue"),
      meta: { hideTabbar: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/MobileLayout.vue"),
      children: [
        {
          path: "",
          redirect: "/home",
        },
        {
          path: "home",
          name: "Home",
          component: () => import("@/views/HomeView.vue"),
          meta: { title: "首页" },
        },
        {
          path: "draw-tickets",
          name: "DrawTickets",
          component: () => import("@/views/DrawTicketsView.vue"),
          meta: { title: "摇奖" },
        },
        {
          path: "default-numbers",
          name: "DefaultNumbers",
          component: () => import("@/views/DefaultNumbersView.vue"),
          meta: { title: "我的号码" },
        },
        {
          path: "scratch-tickets",
          name: "ScratchTickets",
          component: () => import("@/views/ScratchTicketsView.vue"),
          meta: { title: "刮刮乐" },
        },
        {
          path: "draw-results",
          name: "DrawResults",
          component: () => import("@/views/DrawResultsView.vue"),
          meta: { title: "开奖" },
        },
        {
          path: "statistics",
          name: "Statistics",
          component: () => import("@/views/StatisticsView.vue"),
          meta: { title: "统计" },
        },
        {
          path: "profile",
          name: "Profile",
          component: () => import("@/views/ProfileView.vue"),
          meta: { title: "我的" },
        },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  if (to.name !== "Login" && to.name !== "Register" && !token) {
    next({ name: "Login" });
  } else if ((to.name === "Login" || to.name === "Register") && token) {
    next({ name: "Home" });
  } else {
    next();
  }
});

export default router;
