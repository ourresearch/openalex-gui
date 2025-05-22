describe('Serp tests', () => {
  it('toggle layout', () => {
    cy.visit('/works?page=1&filter=default.search%3Aflowers&id=g8rNZ3LhuEaAXd3kL5aMap')
    cy.contains("Works").should('be.visible');
    cy.contains("Stats").should('be.visible');

    cy.get('.mdi-cog-outline').click();
    cy.contains("Results list").click();
    cy.contains("Works").should('not.exist')

    cy.get('.mdi-cog-outline').click();
    cy.contains("Results list").click();
    cy.contains("Works").should('be.visible')

    cy.get('.mdi-cog-outline').click();
    cy.get(".mdi-clipboard-outline").click();
    cy.get('header').should('not.contain', 'Stats');
  })
})