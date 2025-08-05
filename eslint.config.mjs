import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // This is the new object that overrides the rule
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    },
    // Optional: Use 'files' to apply this override only to certain files
    // files: ["**/*.ts", "**/*.tsx"]
  },
];

export default eslintConfig;
