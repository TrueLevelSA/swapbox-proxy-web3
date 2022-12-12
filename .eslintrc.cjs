module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ["./tsconfig.json"]
  },
  plugins: ['@typescript-eslint'],
  root: false,
  ignorePatterns: ["src/**/*.test.ts", "src/typechain/*", "smart-contract/*", "dist/*"]
};
