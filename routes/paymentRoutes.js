const express = require('express');
const router = express.Router();
const { createCheckout, createCustomerPortal } = require('../controllers/paymentController');
const { Checkout, CustomerPortal, Webhooks } = require("@polar-sh/express");
const verifyToken = require("../middlewares/authMiddleware");

// Route to create checkout URL
router.post('/create-checkout', verifyToken, createCheckout);

// Route to create customer portal URL
router.post('/create-portal', verifyToken, createCustomerPortal);

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
  const planMap = {
    '80563e0c-7957-4a0e-8287-fb6c03621ff6': 'basic',
    '59a5060f-8bb3-4a43-ad13-6d0f8ccd6ea1': 'pro'
  };
  return planMap[productId] || null;
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
        console.log('✅ Order paid:', payload);
        // Update user subscription status
        try {
          const customerEmail = payload.customer?.email;
          const orderId = payload.id;
          const productId = payload.product?.id;
          
          if (customerEmail) {
            const User = require('../models/User');
            const subscriptionPlan = getPlanFromProductId(productId);
            
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
            } else {
              console.warn(`⚠️ User not found for email: ${customerEmail}`);
            }
          }
        } catch (error) {
          console.error('❌ Failed to update user subscription:', error);
        }
      },
      onSubscriptionActive: async (payload) => {
        console.log('✅ Subscription active:', payload);
        // Handle subscription activation
        try {
          const customerEmail = payload.customer?.email;
          const productId = payload.product?.id;
          
          if (customerEmail) {
            const User = require('../models/User');
            const subscriptionPlan = getPlanFromProductId(productId);
            
            await User.findOneAndUpdate(
              { email: customerEmail },
              { 
                subscriptionStatus: 'active',
                subscriptionPlan: subscriptionPlan,
                subscriptionProductId: productId
              }
            );
            console.log(`✅ Updated active subscription for user: ${customerEmail} (Plan: ${subscriptionPlan})`);
          }
        } catch (error) {
          console.error('❌ Failed to update active subscription:', error);
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
