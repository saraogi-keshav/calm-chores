module.exports = {
    preset: "jest-expo",
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dict/',
        '/coverage/',
        '/coverage/lcov-report',
        '/Project Docments/'
    ],
    transformIgnorePatterns: [
        "/node_modules/(?!firebase)/"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.test.{js,jsx,ts,tsx}',
        '!**/*.config.{js,jsx,ts,tsx}',
        '!**/reset-project.js',
        '!src/**/*.d.ts',
    ],
    coverageReporters: ['text']
};