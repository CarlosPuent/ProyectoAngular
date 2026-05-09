describe('Authentication', () => {
  describe('Route guards', () => {
    it('should redirect unauthenticated users from /dashboard to /login', () => {
      cy.clearLocalStorage();
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect authenticated users from /login to /dashboard', () => {
      cy.login();
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
      cy.get('h1').should('contain', 'Welcome back');
      cy.get('input[formControlName="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign In');
    });

    it('should show validation errors when submitting empty form', () => {
      cy.get('button[type="submit"]').click();
      cy.contains('Email is required').should('be.visible');
    });

    it('should show an error for wrong credentials', () => {
      cy.intercept('POST', '/api/auth/login').as('loginRequest');
      cy.get('input[formControlName="email"]').type('nonexistent@example.com');
      cy.get('input[formControlName="password"]').type('wrongpass123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
      cy.get('.bg-red-50').should('be.visible');
    });
  });

  describe('Successful login and session', () => {
    it('should login and redirect to /dashboard', () => {
      cy.clearLocalStorage();
      cy.visit('/login');
      cy.intercept('POST', '/api/auth/login').as('loginRequest');
      cy.get('input[formControlName="email"]').type(Cypress.env('TEST_EMAIL'));
      cy.get('input[formControlName="password"]').type(Cypress.env('TEST_PASSWORD'));
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
      cy.url().should('include', '/dashboard');
      cy.get('h2').should('contain', 'Dashboard');
    });

    it('should persist the session after page reload', () => {
      cy.login();
      cy.visit('/dashboard');
      cy.reload();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Logout', () => {
    it('should log out and redirect to /login', () => {
      cy.login();
      cy.visit('/dashboard');
      cy.contains('button', 'Logout').click();
      cy.url().should('include', '/login');
    });

    it('should prevent access to protected routes after logout', () => {
      cy.login();
      cy.visit('/dashboard');
      cy.contains('button', 'Logout').click();
      cy.url().should('include', '/login');
      cy.visit('/products');
      cy.url().should('include', '/login');
    });
  });
});
