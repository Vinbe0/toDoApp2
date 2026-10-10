import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  globalIgnores(["**/dist/**", "**/coverage/**", "server/**"]),

  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,

  {
    name: "app/rules",
    rules: {
      "vue/multi-word-component-names": "off",
      // Optional TypeScript props are undefined by default; that is intended.
      "vue/require-default-prop": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },

  // Layer boundaries: shared <- features <- pages <- app.
  {
    name: "app/boundaries/shared",
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/pages/*", "@/app/*"],
              message: "shared/ must not depend on features, pages or app.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "app/boundaries/features",
    files: ["src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/pages/*", "@/app/*"],
              message: "features/ must not depend on pages or app.",
            },
          ],
        },
      ],
    },
  },

  skipFormatting,
);
