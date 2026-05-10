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
  // TYPE_DELAY is set to 0 in normal mode, and ~90ms in demo mode.
  // This makes login visible and human-like during presentations.
  const typeDelay: number = Cypress.env('TYPE_DELAY') ?? 0;

  cy.session(
    ['login', email],
    () => {
      cy.visit('/login');
      cy.get('input[formControlName="email"]').type(email, { delay: typeDelay });
      cy.get('input[formControlName="password"]').type(password, { delay: typeDelay });
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
