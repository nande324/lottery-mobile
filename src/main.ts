import { createApp } from "vue";
import { createPinia } from "pinia";
import TDesignMobile from "tdesign-mobile-vue";
import "tdesign-mobile-vue/es/style/index.css";
import App from "./App.vue";
import router from "./router";
import "@/styles/index.scss";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(TDesignMobile);
app.mount("#app");
