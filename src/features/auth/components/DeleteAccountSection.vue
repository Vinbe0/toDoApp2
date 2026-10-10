<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseCard from "@/shared/ui/BaseCard.vue";
import PasswordInput from "@/features/auth/components/PasswordInput.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { HttpError, getErrorMessage } from "@/shared/api";
import { notify } from "@/shared/lib/notify";

defineProps<{ taskCount: number; labelCount: number }>();

const auth = useAuthStore();
const router = useRouter();

const confirming = ref(false);
const password = ref("");
const error = ref("");
const deleting = ref(false);

function cancel() {
  confirming.value = false;
  password.value = "";
  error.value = "";
}

async function submit() {
  if (!password.value) {
    error.value = "Enter your password to confirm";
    return;
  }
  deleting.value = true;
  error.value = "";
  try {
    await auth.deleteAccount(password.value);
    notify.success("Your account and its data have been deleted");
    await router.push({ name: "home" });
  } catch (caught) {
    error.value =
      caught instanceof HttpError && caught.status === 403
        ? "Incorrect password"
        : getErrorMessage(caught, "Could not delete the account");
  } finally {
    deleting.value = false;
  }
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
</script>

<template>
  <BaseCard as="section" class="border-red-500/30" aria-labelledby="delete-account-title">
    <h2 id="delete-account-title" class="font-semibold text-fg">Delete account</h2>
    <p class="mt-1 text-sm text-fg-muted">
      Permanently deletes your account with its {{ plural(taskCount, "task") }} and
      {{ plural(labelCount, "label") }}. This can't be undone.
    </p>

    <BaseButton
      v-if="!confirming"
      variant="secondary"
      class="mt-4 !text-red-600"
      @click="confirming = true"
    >
      Delete account…
    </BaseButton>

    <form v-else class="mt-4 grid max-w-sm gap-3" novalidate @submit.prevent="submit">
      <PasswordInput
        v-model="password"
        label="Confirm with your password"
        autocomplete="current-password"
        :error="error"
        required
      />
      <div class="flex gap-2">
        <BaseButton type="submit" variant="danger" :loading="deleting"
          >Delete my account</BaseButton
        >
        <BaseButton variant="secondary" :disabled="deleting" @click="cancel">Cancel</BaseButton>
      </div>
    </form>
  </BaseCard>
</template>
