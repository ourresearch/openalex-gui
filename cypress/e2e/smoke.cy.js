/* eslint-disable */

describe('OpenAlex loads', () => {
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
    cy.get('.v-navigation-drawer .text-h6').contains('How within-group behavioural variation');
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
    cy.get('.text-h6').contains('Effects of Climate Change');
    cy.contains('FWCI');
    cy.contains('Journal of Phycology');
    cy.contains('Citation percentile');
    cy.contains('Cited by:');
  });

  it.skip('Author Entity page loads', () => {
    cy.intercept('GET', 'https://api.openalex.org/people/a5059584992?per-page=10').as('getData');
    cy.visit('/authors/a5059584992');
    cy.wait('@getData');
    cy.contains('Tai M. Lockspesier');
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

  it('Funder Entity page loads', () => {
    cy.visit('/funders/f4320332161');
    cy.contains('National Institutes of Health');
    cy.contains('View works');
    cy.contains('Works count:');
    cy.contains('Key stats');
    cy.contains('Top works');
  });

  it('Source Entity page loads', () => {
    cy.visit('/sources/s137773608');
    cy.contains('Nature');
    cy.contains('ISSNs');
    cy.contains('H-index');
    cy.contains('Works count:');
    cy.contains('Key stats');
    cy.contains('Top works');
  });

  it('Publisher Entity page loads', () => {
    cy.visit('/publishers/p4310319908');
    cy.contains('Nature Portfolio');
    cy.contains('Works count:');
    cy.contains('Citations count:');
    cy.contains('Key stats');
    cy.contains('Top works');
  });

  it('Stats page loads', () => {
    cy.visit('/stats');
    cy.contains('Data Stats');
    cy.contains(/\d{3}M/);
  });

  it('About page loads', () => {
    cy.visit('/about');
    cy.contains('About');
    cy.contains('Comparison with other');
  });

});
