import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import-x";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Import plugin configuration
  {
    plugins: {
      "import-x": importPlugin,
    },
    rules: {
      // Enforce import order: external → internal → types
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "type",
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // No default exports rule (with exceptions for Next.js special files)
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      // Next.js requires default exports for these
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/**/template.tsx",
      "src/app/**/default.tsx",
      "src/middleware.ts",
    ],
    rules: {
      "import-x/no-default-export": "error",
    },
  },

  // Feature flags import restriction
  // Ensures FEATURES is always imported from the canonical path
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      // Allow the features module itself and its tests
      "src/lib/features.ts",
      "src/lib/features.test.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Error on relative imports to features.ts - must use @/lib/features
              group: ["**/features", "../features", "./features", "../lib/features", "lib/features", "src/lib/features"],
              message: "Import FEATURES from '@/lib/features' only.",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.config.{js,mjs,ts}",
    "e2e/**",
  ]),
]);

// Note: ESLint config files require export default
export default eslintConfig;
