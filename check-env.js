require('dotenv').config();

console.log('🔍 Environment Variables Check');
console.log('=============================');

const requiredVars = [
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'SUCCESS_URL',
  'JWT_SECRET',
  'MONGODB_URI'
];

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
    if (varName.includes('TOKEN') || varName.includes('SECRET')) {
      console.log(`   Value: ${value.substring(0, 10)}...`);
    } else {
      console.log(`   Value: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: Not set`);
    allSet = false;
  }
});

console.log('\n📋 Summary:');
if (allSet) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('❌ Some environment variables are missing.');
  console.log('\n🔧 Please check your .env file and ensure all variables are set:');
  console.log(`
# Required for Polar.sh integration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
SUCCESS_URL=http://localhost:3000/subscribe/success

# Required for authentication
JWT_SECRET=your_jwt_secret_here

# Required for database
MONGODB_URI=your_mongodb_connection_string
  `);
}

console.log('\n🚀 To get your Polar.sh credentials:');
console.log('1. Go to https://polar.sh/dashboard');
console.log('2. Navigate to Settings → API');
console.log('3. Generate Access Token');
console.log('4. Generate Webhook Secret');
console.log('5. Copy both values to your .env file'); 