import { reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  type AuthMode,
  type CredentialErrors,
  type Credentials,
  validateCredentials,
} from "@/features/auth/model/validation";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { HttpError, getErrorMessage } from "@/shared/api";
import { notify } from "@/shared/lib/notify";
import { safeRedirect } from "@/shared/lib/safeRedirect";

function describeAuthError(error: unknown, mode: AuthMode) {
  if (error instanceof HttpError) {
    if (mode === "login" && (error.status === 401 || error.status === 400)) {
      return "Incorrect email or password";
    }
    if (mode === "register" && error.status === 409) {
      return "An account with this email already exists";
    }
  }
  return getErrorMessage(error, mode === "login" ? "Could not log in" : "Could not sign up");
}

/** Shared state and submit flow for the login and sign-up forms. */
export function useAuthForm(mode: AuthMode) {
  const auth = useAuthStore();
  const tasksStore = useTasksStore();
  const router = useRouter();
  const route = useRoute();

  const values = reactive<Credentials>({ email: "", password: "" });
  const errors = ref<CredentialErrors>({});
  const formError = ref("");
  const isSubmitting = ref(false);

  // Clear a field's error as soon as the user edits it.
  watch(
    () => values.email,
    () => (errors.value.email = undefined),
  );
  watch(
    () => values.password,
    () => (errors.value.password = undefined),
  );

  async function offerGuestImport() {
    try {
      const imported = await tasksStore.importGuestTasks((count) =>
        window.confirm(`Import ${count} task(s) from guest mode into your account?`),
      );
      if (imported) notify.success(`Imported ${imported} task(s) into your account`);
    } catch {
      notify.error("You're signed in, but your guest tasks could not be imported");
    }
  }

  async function submit() {
    formError.value = "";
    errors.value = validateCredentials(values, mode);
    if (Object.keys(errors.value).length) return;

    isSubmitting.value = true;
    try {
      const email = values.email.trim();
      if (mode === "login") await auth.login(email, values.password);
      else await auth.register(email, values.password);

      await offerGuestImport();
      await router.push(safeRedirect(route.query.redirect));
    } catch (error) {
      formError.value = describeAuthError(error, mode);
    } finally {
      isSubmitting.value = false;
    }
  }

  return { values, errors, formError, isSubmitting, submit };
}
