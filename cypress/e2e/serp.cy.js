describe('Serp tests', () => {
  it('toggle serp layout', () => {
    cy.kelpSearch()
    cy.contains("Works").should('be.visible');
    cy.contains("Stats").should('be.visible');

    cy.clickIcon('.mdi-cog-outline');
    cy.contains("Results list").click();
    cy.contains("Works").should('not.exist')

    cy.clickIcon('.mdi-cog-outline');
    cy.contains("Results list").click();
    cy.contains("Works").should('be.visible')

    cy.clickIcon('.mdi-cog-outline');
    cy.clickIcon(".mdi-clipboard-outline");
    cy.get('header').should('not.contain', 'Stats');
  })
})