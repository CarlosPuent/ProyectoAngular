const RUN_ID      = Date.now();
const CAT_NAME    = `E2E Category ${RUN_ID}`;
const CAT_SLUG    = `e2e-category-${RUN_ID}`;
const UPDATED_CAT = `E2E Category ${RUN_ID} v2`;

describe('Categories CRUD', () => {
  beforeEach(() => { cy.login(); });

  describe('Categories page', () => {
    it('should display the Categories heading and New Category button', () => {
      cy.intercept('GET', '/api/categories*').as('loadCategories');
      cy.visit('/categories');
      cy.wait('@loadCategories');
      cy.get('h2').should('contain', 'Categories');
      cy.contains('button', 'New Category').should('be.visible');
    });
  });

  describe('Create category', () => {
    it('should create a new category with auto-generated slug', () => {
      cy.intercept('GET', '/api/categories*').as('loadCategories');
      cy.intercept('POST', '/api/categories').as('createCategory');
      cy.visit('/categories');
      cy.wait('@loadCategories');
      cy.contains('button', 'New Category').click();
      cy.get('input[formControlName="name"]').type(CAT_NAME);
      cy.get('input[formControlName="slug"]').should('have.value', CAT_SLUG);
      cy.get('button[type="submit"]').click();
      cy.wait('@createCategory').its('response.statusCode').should('eq', 201);
      cy.wait('@loadCategories');
      cy.contains(CAT_NAME).should('be.visible');
    });
  });

  describe('Edit category', () => {
    it('should update the category name', () => {
      cy.intercept('GET', '/api/categories*').as('loadCategories');
      cy.intercept('PATCH', '/api/categories/*').as('updateCategory');
      cy.visit('/categories');
      cy.wait('@loadCategories');
      cy.contains('td', CAT_NAME).closest('tr').find('button[title="Edit Category"]').click();
      cy.get('input[formControlName="name"]').clear().type(UPDATED_CAT);
      cy.get('button[type="submit"]').click();
      cy.wait('@updateCategory').its('response.statusCode').should('eq', 200);
      cy.wait('@loadCategories');
      cy.contains(UPDATED_CAT).should('be.visible');
    });
  });

  describe('Delete category', () => {
    it('should delete the category after confirming', () => {
      cy.intercept('GET', '/api/categories*').as('loadCategories');
      cy.intercept('DELETE', '/api/categories/*').as('deleteCategory');
      cy.visit('/categories');
      cy.wait('@loadCategories');
      cy.contains('td', UPDATED_CAT).closest('tr').find('button[title="Delete Category"]').click();
      cy.get('div.fixed.inset-0').should('be.visible');
      cy.get('div.fixed.inset-0').contains('button', 'Delete').click();
      cy.wait('@deleteCategory').its('response.statusCode').should('eq', 200);
      cy.wait('@loadCategories');
      cy.contains(UPDATED_CAT).should('not.exist');
    });
  });
});
