import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: ["node_modules", "dist", "legacy_public_backup", ".astro"],
  },

  // Base configuration for JavaScript/TypeScript files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react: react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      prettier: prettier,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      // Allow intentionally unused args/vars when prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "react/react-in-jsx-scope": "off",
      // Disallow inline style usage in React DOM
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      // Enforce formatting via Prettier and Tailwind plugin order
      "prettier/prettier": "error",
      // Enforce sorted imports/exports
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Astro-specific configuration
  ...astro.configs.recommended,
  {
    files: ["**/*.astro"],
    plugins: {
      react: react,
      "jsx-a11y": jsxA11y,
      "@typescript-eslint": typescript,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "is:inline",
            "class",
            "stroke-width",
            "stroke-linecap",
            "stroke-linejoin",
            "hreflang",
          ],
        },
      ],
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/no-autofocus": "off",
      "react/jsx-key": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-useless-escape": "off",
      "prettier/prettier": "off",
    },
  },

  // Test files: allow explicit any for convenience in mocks/fixtures
  {
    files: ["tests/**/*.{js,ts,tsx}", "**/*.test.{js,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
