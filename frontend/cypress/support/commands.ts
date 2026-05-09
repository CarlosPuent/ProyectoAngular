declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (
  email    = Cypress.env('TEST_EMAIL'),
  password = Cypress.env('TEST_PASSWORD'),
) => {
  cy.session(
    ['login', email],
    () => {
      cy.visit('/login');
      cy.get('input[formControlName="email"]').type(email);
      cy.get('input[formControlName="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    },
    {
      validate() {
        cy.window().its('localStorage').invoke('getItem', 'access_token').should('exist');
      },
    },
  );
});

export {};
