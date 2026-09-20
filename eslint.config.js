import eslintPluginAstro from "eslint-plugin-astro";

export default [
  { ignores: ["dist/", ".astro/", ".wrangler/"] },
  ...eslintPluginAstro.configs.recommended,
];
