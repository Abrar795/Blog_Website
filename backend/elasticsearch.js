const { Client } = require('@elastic/elasticsearch');

// Create Elasticsearch client
const client = new Client({ 
  node: 'http://localhost:9200',
  maxRetries: 5,
  requestTimeout: 60000
});

// Test Elasticsearch connection on startup
async function testConnection() {
  try {
    const info = await client.info();
    console.log('Elasticsearch connected:', info.name);
    return true;
  } catch (error) {
    console.error('Elasticsearch connection error:', error.message);
    return false;
  }
}

module.exports = {
  client,
  testConnection
};