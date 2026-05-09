import './commands';

Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('Non-Error promise rejection')
  ) {
    return false;
  }
  return true;
});
