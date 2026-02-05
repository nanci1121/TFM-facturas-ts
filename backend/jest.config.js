/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(chokidar|@exodus/bytes)/)',
    ],
};
