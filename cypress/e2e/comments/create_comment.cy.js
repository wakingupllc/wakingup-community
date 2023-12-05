/// <reference types="Cypress" />

describe('Comments', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUser').as('testUser').then(() => {
      cy.loginAs(this.testUser);
    });
  });

  // disabled because it fails when it can't get cloudinary.uploadPresetEditor setting
  it.skip('can add a new comment', function() {
    cy.visit('/posts/test-seeded-post/test-seeded-post');
    cy.get('#new-comment-form').type('Test comment');
    cy.get('#new-comment-submit').click();
    cy.contains('.CommentBody-root', 'Test comment').should('exist');
  });
});
