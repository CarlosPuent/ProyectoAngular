// ─────────────────────────────────────────────────────────────────────────────
// E2E — Products CRUD   (main demo flow)
//
// Demo mode: npm run cy:open:demo  →  slowMo=150 + TYPE_DELAY=90
// Normal mode: npm run cy:run:products  →  instant execution
// ─────────────────────────────────────────────────────────────────────────────

const RUN_ID       = Date.now();
const PRODUCT_NAME = `E2E Laptop ${RUN_ID}`;
const UPDATED_NAME = `E2E Laptop ${RUN_ID} Pro`;

// TYPE is resolved at runtime so it respects --env TYPE_DELAY passed via CLI.
// In normal mode TYPE_DELAY is undefined → delay 0 (instant).
// In demo mode TYPE_DELAY=90 → 90ms per character (human-like typing).
const TYPE = () => ({ delay: (Cypress.env('TYPE_DELAY') as number) ?? 0 });

describe('Products CRUD', () => {
  beforeEach(() => { cy.login(); });

  // ── Products page ─────────────────────────────────────────────────────────
  describe('Products page', () => {
    it('should display the Products heading and New Product button', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.visit('/products');
      cy.wait('@loadProducts');
      cy.get('h2').should('contain', 'Products');
      cy.contains('button', 'New Product').should('be.visible');
    });

    it('should navigate to /products via sidebar link', () => {
      cy.visit('/dashboard');
      cy.contains('a', 'Products').click();
      cy.url().should('include', '/products');
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────
  describe('Create product', () => {
    it('should create a new product successfully', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.intercept('GET', '/api/categories').as('loadCategories');
      cy.intercept('POST', '/api/products').as('createProduct');

      cy.visit('/products');
      cy.wait('@loadProducts');

      cy.contains('button', 'New Product').click();
      cy.wait('@loadCategories');

      // Typing with demo delay so the audience can follow each field
      cy.get('input[formControlName="name"]').type(PRODUCT_NAME, TYPE());
      cy.get('input[formControlName="price"]').type('299.99', TYPE());
      cy.get('input[formControlName="stock"]').clear().type('25', TYPE());

      cy.get('button[type="submit"]').click();
      cy.wait('@createProduct').its('response.statusCode').should('eq', 201);
      cy.wait('@loadProducts');

      // Modal should have closed
      cy.get('input[formControlName="name"]').should('not.exist');
    });

    it('should show validation errors when submitting an empty product form', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.visit('/products');
      cy.wait('@loadProducts');

      cy.contains('button', 'New Product').click();
      cy.get('button[type="submit"]').click();
      cy.contains('Name is required').should('be.visible');
    });
  });

  // ── Search & Filter ───────────────────────────────────────────────────────
  describe('Search and filter', () => {
    it('should find the created product via the search box', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.visit('/products');
      cy.wait('@loadProducts');

      cy.get('input[placeholder="Search products..."]').type(PRODUCT_NAME, TYPE());
      cy.contains('button', 'Search').click();
      cy.wait('@loadProducts');

      cy.contains('td', PRODUCT_NAME).should('be.visible');
    });

    it('should show "No products found" when search has no results', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.visit('/products');
      cy.wait('@loadProducts');

      cy.get('input[placeholder="Search products..."]').type('ZZZNORESULTS_E2E_CYPRESS', TYPE());
      cy.contains('button', 'Search').click();
      cy.wait('@loadProducts');

      cy.contains('No products found').should('be.visible');
    });
  });

  // ── Edit ──────────────────────────────────────────────────────────────────
  describe('Edit product', () => {
    it('should update the product name successfully', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.intercept('GET', '/api/categories').as('loadCategories');
      cy.intercept('PATCH', '/api/products/*').as('updateProduct');

      cy.visit('/products');
      cy.wait('@loadProducts');

      cy.get('input[placeholder="Search products..."]').type(PRODUCT_NAME, TYPE());
      cy.contains('button', 'Search').click();
      cy.wait('@loadProducts');

      cy.contains('td', PRODUCT_NAME)
        .closest('tr')
        .find('button[title="Edit Product"]')
        .click();
      cy.wait('@loadCategories');

      cy.get('input[formControlName="name"]').clear().type(UPDATED_NAME, TYPE());
      cy.get('button[type="submit"]').click();

      cy.wait('@updateProduct').its('response.statusCode').should('eq', 200);
      cy.wait('@loadProducts');

      cy.contains('td', UPDATED_NAME).should('be.visible');
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  describe('Delete product', () => {
    it('should delete the product after confirm dialog', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.intercept('DELETE', '/api/products/*').as('deleteProduct');

      cy.visit('/products');
      cy.wait('@loadProducts');

      cy.get('input[placeholder="Search products..."]').type(UPDATED_NAME, TYPE());
      cy.contains('button', 'Search').click();
      cy.wait('@loadProducts');

      cy.contains('td', UPDATED_NAME)
        .closest('tr')
        .find('button[title="Delete Product"]')
        .click();

      cy.get('div.fixed.inset-0').should('be.visible');
      cy.get('div.fixed.inset-0').contains('button', 'Delete').click();

      cy.wait('@deleteProduct').its('response.statusCode').should('eq', 200);
      cy.wait('@loadProducts');

      cy.contains('td', UPDATED_NAME).should('not.exist');
    });
  });

  // ── Dashboard integration ─────────────────────────────────────────────────
  describe('Dashboard integration', () => {
    it('should show product stats on the Dashboard', () => {
      cy.intercept('GET', '/api/products*').as('loadProducts');
      cy.visit('/dashboard');
      cy.wait('@loadProducts');

      cy.get('h2').should('contain', 'Dashboard');
      cy.contains('Total Products').should('be.visible');
    });
  });
});
