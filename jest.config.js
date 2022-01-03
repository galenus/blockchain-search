const { resolve } = require("path");
const CI = !!process.env.CI;

const ROOT_DIR = __dirname;

module.exports = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json"
        }
    },
    moduleFileExtensions: [
        "ts",
        "js"
    ],
    transform: {
        "^.+\\.(ts|ts)$": "ts-jest"
    },
    testMatch: [
        "**/test/**/*.test.(ts|js)"
    ],
    testEnvironment: "node",
    rootDir: ROOT_DIR,
    restoreMocks: true,
    reporters: ["default"],
    modulePathIgnorePatterns: ["dist"],
    collectCoverage: false,
    cacheDirectory: resolve(ROOT_DIR, `${CI ? "" : "node_modules/"}.cache/jest`),
};
