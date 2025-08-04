const User = require('../models/User');
require('dotenv').config();

// Helper function to get product IDs based on environment
const getProductIds = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return {
      basic: process.env.POLAR_LIVE_BASIC_PRODUCT_ID || '80563e0c-7957-4a0e-8287-fb6c03621ff6',
      pro: process.env.POLAR_LIVE_PRO_PRODUCT_ID || '59a5060f-8bb3-4a43-ad13-6d0f8ccd6ea1'
    };
  } else {
    return {
      basic: process.env.POLAR_SANDBOX_BASIC_PRODUCT_ID || '9e28204e-16fe-48ad-ad17-5f236b345f90', // $4.99 subscription
      pro: process.env.POLAR_SANDBOX_PRO_PRODUCT_ID || '34da0d93-2c29-496e-9162-2432e8c969ba'  // $59.99/yearly subscription
    };
  }
};

const createCheckout = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user._id || req.user.id; // Handle both _id and id

        console.log(`🔍 Creating checkout for plan: ${plan}`);
        console.log(`🔍 User ID: ${userId}`);
        console.log(`🔍 Environment: ${process.env.NODE_ENV}`);

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`🔍 User email: ${user.email}`);

        // Get product IDs based on environment
        const productIds = getProductIds();
        const productId = productIds[plan];

        console.log(`🔍 Available product IDs:`, productIds);
        console.log(`🔍 Selected product ID: ${productId}`);

        if (!productId) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Build checkout URL for Polar.sh SDK
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com/api/v1/checkout'
            : 'http://localhost:5000/api/v1/checkout';

        const checkoutUrl = `${baseUrl}?products=${productId}&customerName=${encodeURIComponent(user.fullName || user.email)}&customerExternalId=${user._id}`;

        console.log(`🔍 Generated checkout URL: ${checkoutUrl}`);

        res.json({ checkoutUrl });
    } catch (error) {
        console.error('Create checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout' });
    }
};

// Customer portal endpoint
const createCustomerPortal = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id; // Handle both _id and id

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build portal URL for Polar.sh SDK
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com/api/v1/portal'
            : 'http://localhost:5000/api/v1/portal';

        const portalUrl = `${baseUrl}?customerExternalId=${user._id}`;

        res.json({ portal_url: portalUrl });
    } catch (error) {
        console.error('Create portal error:', error);
        res.status(500).json({ error: 'Failed to create customer portal' });
    }
};

module.exports = { createCheckout, createCustomerPortal };
