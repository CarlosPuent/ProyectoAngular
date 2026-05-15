declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

const mockAuthResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWlkIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.mock',
  token_type: 'Bearer',
  expires_in: 3600,
  user: {
    id: 'test-id',
    email: 'admin@gmail.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['ADMIN'],
    isActive: true,
  },
};

Cypress.Commands.add('login', (
  email = Cypress.env('TEST_EMAIL'),
  password = Cypress.env('TEST_PASSWORD'),
) => {
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', mockAuthResponse.access_token);
    win.localStorage.setItem('current_user', JSON.stringify(mockAuthResponse.user));
  });
});

export {};