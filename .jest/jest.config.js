module.exports = {
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: {
      lines: 85
    }
  },
  globals: {
    'ts-jest': {
      tsconfig: '../../tsconfig.json'
    }
  },
  preset: 'ts-jest',
  setupFiles: ['dotenv/config', '../../.jest/configurePorts.ts'],
  silent: false,
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testTimeout: 30000,
  // if your breakpoints/debugger in VSCode fail, comment out this transform:
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '../../.jest/.swcrc' }]
  },
  verbose: true
}
