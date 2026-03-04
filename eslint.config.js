const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = [
    {
        ignores: ['**/*.d.ts', 'node_modules/*', '.expo/*'],
    },
    ...expoConfig,
    {
        files: ['tools/**/*.js', 'scripts/**/*.js', '*.config.js', '*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        rules: {
            'react-native/no-inline-styles': 'off',
        },
    },
];
