import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    { ignores: ['node_modules', 'public/build', 'storage', 'vendor'] },
    {
        files: ['resources/js/**/*.{js,jsx,ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
        languageOptions: {
            ecmaVersion: 2020,
            globals: { ...globals.browser, ...globals.node },
        },
        rules: {
            // Exisiting codebase, not touched per project rule. Keep signal at warn.
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            // Idiomatic data-fetching inside effects across the codebase.
            'react-hooks/set-state-in-effect': 'off',
            // Deliberate Math.random in Sidebar render for UI pin.
            'react-hooks/purity': 'off',
            'no-useless-assignment': 'warn',
        },
    },
);
