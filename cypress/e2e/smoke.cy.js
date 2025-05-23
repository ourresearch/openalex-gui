describe('OpenAlex App Loads', () => {
  it('Home page loads', () => {
    cy.visit('/');
    cy.contains('OpenAlex');
  });
  
  it('Search page loads', () => {
    cy.visit('/works?page=1&filter=default.search%3Akyle%20demes');
    cy.contains('kyle demes');
    cy.contains('Works');    
    cy.contains('Stats');
  });

  it('Entity Drawer loads on Serp', function() {
    cy.visit('/works?page=1&filter=default.search%3Akyle%20demes&zoom=w2103321907');
    cy.get('.mt-4 > .v-toolbar__content > div > .theme--light').should('be.visible');
  });

  it('Signup page loads', () => {
    cy.visit('/signup');
    cy.contains('Sign up');
  });

  it('Login page loads', () => {
    cy.visit('/login');
    cy.contains('Log in');
  });

  it('Work Entity page loads', () => {
    cy.visit('/works/w2016949000');
    cy.contains('Effects Of Climate Change');
    cy.contains('FWCI');
    cy.contains('Journal of Phycology');
    cy.contains('Citation percentile');
    cy.contains('Cited by:');
  });

  it('Author Entity page loads', () => {
    cy.visit('/authors/a5086928770');
    cy.contains('Kyle Demes');
    cy.contains('H-index');
    cy.contains('Citations count:');
    cy.contains('Key stats');
    cy.contains('Top works');
    cy.contains('ORCID');
  });

  it('Institution Entity page loads', () => {
      cy.visit('/institutions/i18014758');
      cy.contains('Simon Fraser University');
      cy.contains('View works');
      cy.contains('Child institutions');
      cy.contains('ROR:');
      cy.contains('Key stats');
      cy.contains('Top works');
      cy.contains('Works count:');
  });
});