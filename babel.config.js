module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        env: {
            // Production builds (EAS / `expo export`) strip the ~98 console.*
            // calls that otherwise run on every render / notification schedule.
            // console.error and console.warn are kept for crash diagnostics.
            // Development (Expo Go) keeps all logs.
            production: {
                plugins: [
                    ['transform-remove-console', { exclude: ['error', 'warn'] }],
                ],
            },
        },
    };
};
