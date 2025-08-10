const express = require('express');
const router = express.Router();
const { createCheckout, createCustomerPortal } = require('../controllers/paymentController');
const { Checkout, CustomerPortal, Webhooks } = require("@polar-sh/express");
const verifyToken = require("../middlewares/authMiddleware");

// Helper function to get product IDs based on environment
const getProductIds = () => {
  return {
    basic: process.env.POLAR_BASIC_PRODUCT_ID || '34da0d93-2c29-496e-9162-2432e8c969ba',
    pro: process.env.POLAR_PRO_PRODUCT_ID || 'your_pro_product_id_here'
  };
};

// Route to create checkout URL
router.post('/create-checkout', verifyToken, createCheckout);

// Route to create customer portal URL
router.post('/create-portal', verifyToken, createCustomerPortal);

// Test endpoint to simulate webhook payload
router.post('/test-webhook', (req, res) => {
  console.log('🧪 Test webhook endpoint called');
  console.log('🧪 Request body:', JSON.stringify(req.body, null, 2));
  
  // Simulate a webhook payload with the correct structure
  const testPayload = {
    type: 'order.paid',
    data: {
      id: 'test-order-123',
      customer: {
        email: req.body.email || 'tayyab.cheema@rev9solutions.com'
      },
      productId: req.body.productId || '9e28204e-16fe-48ad-ad17-5f236b345f90'
    }
  };
  
  console.log('🧪 Simulating webhook with payload:', JSON.stringify(testPayload, null, 2));
  
  res.json({ 
    message: 'Test webhook processed',
    payload: testPayload
  });
});

// Environment check endpoint
router.get('/env-check', (req, res) => {
  const config = {
    environment: process.env.NODE_ENV || 'development',
    productIds: {
      basic: process.env.POLAR_BASIC_PRODUCT_ID || '34da0d93-2c29-496e-9162-2432e8c969ba',
      pro: process.env.POLAR_PRO_PRODUCT_ID || 'your_pro_product_id_here'
    },
    polarAccessToken: process.env.POLAR_ACCESS_TOKEN ? 'Configured' : 'Missing',
    polarWebhookSecret: process.env.POLAR_WEBHOOK_SECRET ? 'Configured' : 'Missing'
  };
  console.log('🔍 Environment check:', config);
  res.json(config);
});

// Polar.sh Checkout endpoint (handled by Polar.sh Express SDK)
router.get('/checkout', (req, res, next) => {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }
  
  try {
    return Checkout({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      successUrl: process.env.SUCCESS_URL || 'http://localhost:3000/subscribe/success',
      server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      theme: 'dark',
    })(req, res, next);
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Checkout service error' });
  }
});

// Polar.sh Customer Portal endpoint (handled by Polar.sh Express SDK)
router.get('/portal', (req, res, next) => {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }
  
  try {
    return CustomerPortal({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      getCustomerId: (event) => {
        // Extract customer ID from the request
        const customerExternalId = event.query.customerExternalId;
        return customerExternalId || '';
      },
      server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    })(req, res, next);
  } catch (error) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: 'Portal service error' });
  }
});

// Helper function to determine plan from product ID
const getPlanFromProductId = (productId) => {
  const productIds = {
    basic: process.env.POLAR_BASIC_PRODUCT_ID || '34da0d93-2c29-496e-9162-2432e8c969ba',
    pro: process.env.POLAR_PRO_PRODUCT_ID || 'your_pro_product_id_here'
  };
  
  // Find the plan by product ID
  let plan = null;
  for (const [planName, id] of Object.entries(productIds)) {
    if (id === productId) {
      plan = planName;
      break;
    }
  }
  
  console.log(`🔍 Environment: ${isProduction ? 'production' : 'sandbox'}`);
  console.log(`🔍 Product ID: ${productId} -> Plan: ${plan}`);
  console.log(`🔍 Available product IDs:`, productIds);
  
  return plan;
};

// Polar.sh Webhooks endpoint (handled by Polar.sh Express SDK)
router.post('/webhooks', express.json(), (req, res, next) => {
  if (!process.env.POLAR_WEBHOOK_SECRET) {
    console.warn('POLAR_WEBHOOK_SECRET not configured - webhooks will not be verified');
  }
  
  try {
    return Webhooks({
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
      onPayload: async (payload) => {
        console.log('🔔 Webhook received:', payload);
      },
      onOrderPaid: async (payload) => {
        console.log('✅ Order paid:', JSON.stringify(payload, null, 2));
        // Update user subscription status
        try {
          // Extract data from the nested structure
          const data = payload.data || payload;
          
          // Try different possible payload structures
          const customerEmail = data.customer?.email || data.email || data.user?.email;
          const orderId = data.id || data.order_id || data.orderId;
          const productId = data.productId || data.product?.id || data.product_id;
          
          console.log(`🔍 Processing order: Email=${customerEmail}, OrderID=${orderId}, ProductID=${productId}`);
          console.log(`🔍 Full payload keys:`, Object.keys(payload));
          console.log(`🔍 Data keys:`, Object.keys(data));
          
          if (customerEmail) {
            const User = require('../models/User');
            const subscriptionPlan = getPlanFromProductId(productId);
            
            console.log(`🔍 Updating user ${customerEmail} with plan: ${subscriptionPlan}`);
            
            // First, let's check if the user exists
            const existingUser = await User.findOne({ email: customerEmail });
            console.log(`🔍 Existing user found:`, existingUser ? 'Yes' : 'No');
            if (existingUser) {
              console.log(`🔍 Current user data:`, {
                id: existingUser._id,
                email: existingUser.email,
                subscriptionStatus: existingUser.subscriptionStatus,
                subscriptionPlan: existingUser.subscriptionPlan
              });
            }
            
            const user = await User.findOneAndUpdate(
              { email: customerEmail },
              { 
                subscriptionStatus: 'active',
                subscriptionId: orderId,
                subscriptionPlan: subscriptionPlan,
                subscriptionProductId: productId
              },
              { new: true }
            );
            
            if (user) {
              console.log(`✅ Updated subscription for user: ${customerEmail} (Plan: ${subscriptionPlan})`);
              console.log(`✅ User data:`, {
                id: user._id,
                email: user.email,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionProductId: user.subscriptionProductId
              });
            } else {
              console.warn(`⚠️ User not found for email: ${customerEmail}`);
              // Let's search for users with similar emails
              const similarUsers = await User.find({ 
                email: { $regex: customerEmail.split('@')[0], $options: 'i' } 
              });
              console.log(`🔍 Similar users found:`, similarUsers.map(u => ({ email: u.email, id: u._id })));
            }
          } else {
            console.warn(`⚠️ No customer email found in payload`);
            console.warn(`⚠️ Available payload keys:`, Object.keys(payload));
            console.warn(`⚠️ Available data keys:`, Object.keys(data));
          }
        } catch (error) {
          console.error('❌ Failed to update user subscription:', error);
          console.error('❌ Error stack:', error.stack);
        }
      },
      onSubscriptionActive: async (payload) => {
        console.log('✅ Subscription active:', JSON.stringify(payload, null, 2));
        // Handle subscription activation
        try {
          // Extract data from the nested structure
          const data = payload.data || payload;
          
          const customerEmail = data.customer?.email || data.email || data.user?.email;
          const productId = data.productId || data.product?.id || data.product_id;
          
          console.log(`🔍 Processing subscription: Email=${customerEmail}, ProductID=${productId}`);
          console.log(`🔍 Data keys:`, Object.keys(data));
          
          if (customerEmail) {
            const User = require('../models/User');
            const subscriptionPlan = getPlanFromProductId(productId);
            
            console.log(`🔍 Updating active subscription for user ${customerEmail} with plan: ${subscriptionPlan}`);
            
            const user = await User.findOneAndUpdate(
              { email: customerEmail },
              { 
                subscriptionStatus: 'active',
                subscriptionPlan: subscriptionPlan,
                subscriptionProductId: productId
              },
              { new: true }
            );
            
            if (user) {
              console.log(`✅ Updated active subscription for user: ${customerEmail} (Plan: ${subscriptionPlan})`);
              console.log(`✅ User data:`, {
                id: user._id,
                email: user.email,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionProductId: user.subscriptionProductId
              });
            } else {
              console.warn(`⚠️ User not found for email: ${customerEmail}`);
            }
          } else {
            console.warn(`⚠️ No customer email found in subscription payload`);
            console.warn(`⚠️ Available data keys:`, Object.keys(data));
          }
        } catch (error) {
          console.error('❌ Failed to update active subscription:', error);
          console.error('❌ Error stack:', error.stack);
        }
      },
      onSubscriptionCanceled: async (payload) => {
        console.log('🚫 Subscription canceled:', payload);
        // Handle subscription cancellation
        try {
          const customerEmail = payload.customer?.email;
          
          if (customerEmail) {
            const User = require('../models/User');
            await User.findOneAndUpdate(
              { email: customerEmail },
              { subscriptionStatus: 'cancelled' }
            );
            console.log(`✅ Updated cancelled subscription for user: ${customerEmail}`);
          }
        } catch (error) {
          console.error('❌ Failed to update cancelled subscription:', error);
        }
      },
      onSubscriptionRevoked: async (payload) => {
        console.log('🚫 Subscription revoked:', payload);
        // Handle subscription revocation
        try {
          const customerEmail = payload.customer?.email;
          
          if (customerEmail) {
            const User = require('../models/User');
            await User.findOneAndUpdate(
              { email: customerEmail },
              { subscriptionStatus: 'expired' }
            );
            console.log(`✅ Updated revoked subscription for user: ${customerEmail}`);
          }
        } catch (error) {
          console.error('❌ Failed to update revoked subscription:', error);
        }
      },
    })(req, res, next);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

module.exports = router;
