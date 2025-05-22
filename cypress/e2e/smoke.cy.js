describe('OpenAlex App Loads', () => {
  it('Visits the home page', () => {
    cy.visit('/');
    cy.contains('OpenAlex');
  });
  it('Visits the search page', () => {
    cy.visit('/works?page=1&filter=default.search%3Akyle%20demes');
    cy.contains('kyle demes');
    cy.contains('Works');    
    cy.contains('Stats');
  });

  /* ==== Test Created with Cypress Studio ==== */
  it('Visits Entity Drawer on SERP', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('/works?page=1&filter=default.search%3Akyle%20demes&zoom=w2103321907');
    cy.get('.mt-4 > .v-toolbar__content > div > .theme--light').should('be.visible');
    /* ==== End Cypress Studio ==== */
  });
});
