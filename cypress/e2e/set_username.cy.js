/// <reference types="Cypress" />

describe('Basic Login and Signup', function() {
  beforeEach(function() {
    cy.task('dropAndSeedDatabase');
    cy.fixture('users/testUserUnsetUsername').as('testUserUnsetUsername');
  });

  // Waking Up has its own signup system so we're skipping this test
  // TODO: writing a test for the Waking Up signup system.
  it.skip('Prompts users to set their display name after signup.', function() {
    const newDisplayname = 'New User 123123';
    cy.loginAs(this.testUserUnsetUsername);
    cy.visit('/');
    cy.contains('Choose a username').should('exist');
    cy.get('input[type="text"]').type(newDisplayname);
    cy.get('.NewUserCompleteProfile-submitButtonSection > button').click();
    // This is not a great test, but it should work -
    // the notifications icon should only appear after the user has set their username.
    cy.get(`button.NotificationsMenuButton-buttonClosed`).should('exist');
  });
})
