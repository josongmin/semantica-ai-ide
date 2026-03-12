import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

import designTokens from "./eslint-rules/design-tokens.js";

export default tseslint.config(
  /* ── global ignores ── */
  { ignores: ["dist/", "node_modules/", "*.cjs"] },

  /* ── base configs ── */
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  /* ── type-checked parser options ── */
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  /* ── project rules ── */
  {
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      /* ── React ── */
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      /* ── TypeScript strict ── */
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: true,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: false,
          allowNullableEnum: false,
          allowAny: false,
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
      ],

      /* ── Import sorting (FSD-aware) ── */
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // 1. Side-effect imports
            ["^\\u0000"],
            // 2. React / external packages
            ["^react", "^@?\\w"],
            // 3. FSD layers (top → bottom)
            ["^~app/", "^~pages/", "^~widgets/", "^~features/", "^~entities/", "^~shared/"],
            // 4. Alias imports
            ["^@/"],
            // 5. Relative imports
            ["^\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      /* ── General quality ── */
      "no-console": ["error", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-duplicate-imports": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-param-reassign": "error",
      "no-nested-ternary": "error",
      curly: ["error", "all"],
      "no-else-return": "error",
      "no-unneeded-ternary": "error",
      "no-lonely-if": "error",
      "prefer-destructuring": ["error", { object: true, array: false }],
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",
      "no-return-assign": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "warn",
    },
  },

  /* ── Import boundary: features/surfaces must not import shellAtoms directly ── */
  {
    files: [
      "src/features/**/*.ts",
      "src/features/**/*.tsx",
      "src/surfaces/**/*.ts",
      "src/surfaces/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/shell/model/shellAtoms", "**/shell/model/shellAtoms.ts"],
              message:
                "Import from app/shell/model/intentRouter (dispatchIntentAtom) or app/shell/model (public API) instead of shellAtoms directly. See RFC-016 §7.",
            },
            {
              group: ["**/atoms/shellBridgeAtoms", "**/atoms/shellBridgeAtoms.ts"],
              message:
                "shellBridgeAtoms is deprecated. Use dispatchIntentAtom from app/shell/model/intentRouter instead. See RFC-016 §7.",
            },
          ],
        },
      ],
    },
  },

  /* ── Terminal feature relaxations (xterm/jotai type resolution limits) ── */
  {
    files: ["src/features/terminal/**/*.ts", "src/features/terminal/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  /* ── Mock factories relaxations (test data generation) ── */
  {
    files: ["src/shared/lib/mocks/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  /* ── Event-dispatch handler relaxations (any-typed server payloads) ── */
  {
    files: ["src/app/event-dispatch/handlers/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },

  /* ── Mock / dev handler relaxations (any-typed payloads by design) ── */
  {
    files: [
      "src/app/dev/mockBackend/**/*.ts",
      "src/app/dev/scenarios/**/*.ts",
      "src/app/dev/seeders/**/*.ts",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },

  /* ── Test file relaxations ── */
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/require-await": "off",
      "no-nested-ternary": "off",
    },
  },

  /* ── Design token guardrails (RFC-017) ── */
  {
    files: ["src/**/*.tsx"],
    plugins: {
      "design-tokens": designTokens,
    },
    rules: {
      "design-tokens/no-hardcoded-color": "warn",
      "design-tokens/no-arbitrary-text-size": "warn",
      "design-tokens/no-hardcoded-z-index": "warn",
    },
  },

  /* ── Prettier (must be last) ── */
  eslintConfigPrettier,
);
