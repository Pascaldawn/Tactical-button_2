const User = require("../models/User");
require('dotenv').config();

// Create checkout endpoint using Polar.sh Express SDK
const createCheckout = async (req, res) => {
  const userId = req.user._id || req.user.id;
  console.log(`Creating checkout for user ID: ${userId}`);

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { products } = req.body;

  if (!products) {
    return res.status(400).json({ error: 'Products parameter is required' });
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    console.error('POLAR_ACCESS_TOKEN is not configured');
    return res.status(500).json({ error: 'Payment service configuration error' });
  }

  try {
    // Build checkout URL with query parameters
    const checkoutUrl = new URL('/api/v1/checkout', `${req.protocol}://${req.get('host')}`);
    checkoutUrl.searchParams.set('products', products);
    checkoutUrl.searchParams.set('customerEmail', user.email);
    checkoutUrl.searchParams.set('customerName', user.fullName);
    checkoutUrl.searchParams.set('customerExternalId', userId);

    res.status(200).json({
      message: 'Checkout URL created successfully',
      checkout_url: checkoutUrl.toString(),
    });
  } catch (error) {
    console.error('Error creating checkout URL:', error);
    res.status(500).json({ error: 'Failed to create checkout URL' });
  }
};

// Customer portal endpoint
const createCustomerPortal = async (req, res) => {
  const userId = req.user._id || req.user.id;
  console.log(`Creating customer portal for user ID: ${userId}`);

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    console.error('POLAR_ACCESS_TOKEN is not configured');
    return res.status(500).json({ error: 'Payment service configuration error' });
  }

  try {
    // Build portal URL
    const portalUrl = new URL('/api/v1/portal', `${req.protocol}://${req.get('host')}`);
    portalUrl.searchParams.set('customerExternalId', userId);

    res.status(200).json({
      message: 'Customer portal URL created successfully',
      portal_url: portalUrl.toString(),
    });
  } catch (error) {
    console.error('Error creating portal URL:', error);
    res.status(500).json({ error: 'Failed to create portal URL' });
  }
};

module.exports = { createCheckout, createCustomerPortal };
