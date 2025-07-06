const DWZSearchService = require('./src/services/dwzSearchService');

console.log('Testing DWZ service instantiation...');
try {
  const service = new DWZSearchService();
  console.log('Service created successfully');
  console.log('Base URL:', service.baseURL);
  console.log('Search endpoint:', service.searchEndpoint);
} catch (error) {
  console.error('Error creating service:', error.message);
  console.error('Stack:', error.stack);
}
