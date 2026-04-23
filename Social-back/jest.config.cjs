module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.cjs'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
