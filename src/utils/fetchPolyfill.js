// Polyfill for fetch to ensure compatibility
const originalFetch = window.fetch;

window.fetch = function(...args) {
  console.log('Fetch called with:', args);
  
  // Ensure URL is a string
  if (args[0] && typeof args[0] !== 'string' && !(args[0] instanceof URL) && !(args[0] instanceof Request)) {
    console.error('Invalid fetch URL:', args[0]);
    throw new TypeError('Failed to execute \'fetch\' on \'Window\': Invalid value');
  }
  
  // Ensure options are valid
  if (args[1] && typeof args[1] !== 'object') {
    console.error('Invalid fetch options:', args[1]);
    throw new TypeError('Failed to execute \'fetch\' on \'Window\': Invalid value');
  }
  
  return originalFetch.apply(this, args);
};

export default {};