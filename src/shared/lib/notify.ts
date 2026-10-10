import { h } from "vue";
import { useToast } from "vue-toastification";
import { HttpError, getErrorMessage } from "@/shared/api";

/**
 * App-wide notifications. Stores call this instead of a toast library
 * directly, so the library can be swapped or mocked in tests.
 */
export const notify = {
  info: (message: string) => useToast().info(message),
  success: (message: string) => useToast().success(message),
  error: (message: string) => useToast().error(message),

  /** Shows a failed request's message, or `fallback` if it has none. */
  fromError(error: unknown, fallback: string) {
    // A 401 has already logged the user out (see main.ts); explain why.
    if (error instanceof HttpError && error.isUnauthorized) {
      useToast().error("Your session has expired. Please log in again.");
    } else {
      useToast().error(getErrorMessage(error, fallback));
    }
  },

  /** A message with a single action button, e.g. "Undo". */
  withAction(message: string, actionLabel: string, onAction: () => void, timeout = 5000) {
    const toast = useToast();
    const id = toast(
      h("div", { class: "flex items-center gap-3" }, [
        h("span", message),
        h(
          "button",
          {
            class: "rounded bg-white/20 px-2 py-1 font-bold text-white",
            onClick: () => {
              onAction();
              toast.dismiss(id);
            },
          },
          actionLabel,
        ),
      ]),
      { timeout, closeOnClick: false },
    );
  },
};
