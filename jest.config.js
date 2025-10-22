// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.(test|spec).js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.global.js'],
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^nodemailer$': '<rootDir>/mocks/nodemailer.js', 
  },
};
