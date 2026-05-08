module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'prettier', // Desativa regras do ESLint que conflitam com Prettier
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs', 'playwright.config.ts', 'vitest.setup.ts'],
    parser: '@typescript-eslint/parser',
    plugins: ['react', 'react-hooks'],
    rules: {
    'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
}
