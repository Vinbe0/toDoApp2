import "@/app/styles/main.css";
import "primeicons/primeicons.css";
import "vue-toastification/dist/index.css";
import { createApp } from "vue";
import Toast from "vue-toastification";
import App from "@/app/App.vue";
import router from "@/app/router";

const app = createApp(App);

app.use(router);
app.use(Toast);

app.mount("#app");
