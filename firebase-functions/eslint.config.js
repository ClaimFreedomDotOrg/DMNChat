import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["lib/**/*", "generated/**/*", "node_modules/**/*"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
        sourceType: "module",
      },
      ecmaVersion: 2020,
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import": importPlugin,
    },
    rules: {
      "quotes": ["error", "double"],
      "indent": ["error", 2],
      "import/no-unresolved": 0,
      ...tseslint.configs.recommended.rules,
    },
  },
];
