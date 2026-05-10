import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: { runMode: 1, openMode: 0 },
    env: {
      TEST_EMAIL: 'admin@gmail.com',
      TEST_PASSWORD: 'Password123',
    },
  },
});
