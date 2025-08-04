const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_TOKEN = 'your_test_jwt_token_here'; // Replace with actual JWT token

// Test functions
async function testCreateCheckout() {
  try {
    console.log('🧪 Testing create checkout...');
    const response = await axios.post(`${BASE_URL}/create-checkout`, {
      products: 'test_product_id'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Create checkout successful:', response.data);
    return response.data.checkout_url;
  } catch (error) {
    console.error('❌ Create checkout failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCreatePortal() {
  try {
    console.log('🧪 Testing create portal...');
    const response = await axios.post(`${BASE_URL}/create-portal`, {}, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Create portal successful:', response.data);
    return response.data.portal_url;
  } catch (error) {
    console.error('❌ Create portal failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCheckoutEndpoint() {
  try {
    console.log('🧪 Testing checkout endpoint...');
    const response = await axios.get(`${BASE_URL}/checkout?products=test_product_id&customerEmail=test@example.com`);
    
    console.log('✅ Checkout endpoint accessible');
    return true;
  } catch (error) {
    console.error('❌ Checkout endpoint failed:', error.response?.status || error.message);
    return false;
  }
}

async function testPortalEndpoint() {
  try {
    console.log('🧪 Testing portal endpoint...');
    const response = await axios.get(`${BASE_URL}/portal?customerExternalId=test_user_id`);
    
    console.log('✅ Portal endpoint accessible');
    return true;
  } catch (error) {
    console.error('❌ Portal endpoint failed:', error.response?.status || error.message);
    return false;
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('🧪 Testing webhook endpoint...');
    const response = await axios.post(`${BASE_URL}/webhooks`, {
      type: 'test',
      data: { test: 'data' }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook endpoint accessible');
    return true;
  } catch (error) {
    console.error('❌ Webhook endpoint failed:', error.response?.status || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Polar.sh integration tests...\n');
  
  const results = {
    createCheckout: await testCreateCheckout(),
    createPortal: await testCreatePortal(),
    checkoutEndpoint: await testCheckoutEndpoint(),
    portalEndpoint: await testPortalEndpoint(),
    webhookEndpoint: await testWebhookEndpoint()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${test}: ${status}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Polar.sh integration is ready.');
  } else {
    console.log('⚠️ Some tests failed. Check your configuration and try again.');
  }
}

// Check if environment variables are set
function checkEnvironment() {
  console.log('🔍 Checking environment variables...');
  
  const required = [
    'POLAR_ACCESS_TOKEN',
    'POLAR_WEBHOOK_SECRET',
    'SUCCESS_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing.join(', '));
    console.log('Please set these in your .env file');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

// Main execution
if (require.main === module) {
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  runTests().catch(console.error);
}

module.exports = { runTests, checkEnvironment }; 