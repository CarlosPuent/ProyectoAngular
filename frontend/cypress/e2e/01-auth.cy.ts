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

describe('Authentication', () => {
  describe('Route guards', () => {
    it('should redirect unauthenticated users from /dashboard to /login', () => {
      cy.clearLocalStorage();
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect authenticated users from /login to /dashboard', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', mockAuthResponse.access_token);
        win.localStorage.setItem('current_user', JSON.stringify(mockAuthResponse.user));
      });
      cy.visit('/login');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Login form', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.visit('/login');
    });

    it('should render the login page', () => {
      cy.contains('Sign In').should('be.visible');
      cy.get('input[formControlName="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors when submitting empty form', () => {
      cy.get('button[type="submit"]').click();
      cy.contains('Email is required').should('be.visible');
    });

    it('should show an error for wrong credentials', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { statusCode: 401, message: 'Invalid credentials' },
      }).as('loginRequest');

      cy.get('input[formControlName="email"]').type('wrong@example.com');
      cy.get('input[formControlName="password"]').type('wrongpass123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');
      cy.contains('Invalid credentials', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Successful login and session', () => {
    it('should login and redirect to /dashboard', () => {
      cy.clearLocalStorage();

      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: mockAuthResponse,
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('input[formControlName="email"]').type(Cypress.env('TEST_EMAIL'));
      cy.get('input[formControlName="password"]').type(Cypress.env('TEST_PASSWORD'));
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');
      cy.url({ timeout: 15000 }).should('include', '/dashboard');
      cy.contains('Dashboard').should('be.visible');
    });

    it('should persist the session after page reload', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', mockAuthResponse.access_token);
        win.localStorage.setItem('current_user', JSON.stringify(mockAuthResponse.user));
      });
      cy.visit('/dashboard');
      cy.reload();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Logout', () => {
    it('should log out and redirect to /login', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', mockAuthResponse.access_token);
        win.localStorage.setItem('current_user', JSON.stringify(mockAuthResponse.user));
      });
      cy.visit('/dashboard');
      cy.contains('button', 'Logout').click();
      cy.url().should('include', '/login');
    });

    it('should prevent access to protected routes after logout', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', mockAuthResponse.access_token);
        win.localStorage.setItem('current_user', JSON.stringify(mockAuthResponse.user));
      });
      cy.visit('/dashboard');
      cy.contains('button', 'Logout').click();
      cy.url().should('include', '/login');
      cy.visit('/products');
      cy.url().should('include', '/login');
    });
  });
});