import "@/app/styles/main.css";
import "primeicons/primeicons.css";
import "vue-toastification/dist/index.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import Toast from "vue-toastification";
import App from "@/app/App.vue";
import router from "@/app/router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { http } from "@/shared/api";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Toast);

// Connect the shared HTTP client to the auth feature.
const auth = useAuthStore();
http.setTokenProvider(() => auth.token);
http.onUnauthorized(() => auth.logout());

app.mount("#app");
