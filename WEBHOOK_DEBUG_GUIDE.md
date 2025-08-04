# Webhook Debugging Guide

## 🔍 **Why Webhooks Might Not Update User Data**

### **1. Webhook URL Configuration**
Make sure your webhook URL is correctly configured in Polar.sh:
- **Development**: `http://localhost:5000/api/v1/webhooks`
- **Production**: `https://your-domain.com/api/v1/webhooks`

### **2. Webhook Secret**
Ensure `POLAR_WEBHOOK_SECRET` is set in your `.env` file and matches the secret in Polar.sh dashboard.

### **3. Product ID Mapping**
The webhook now uses environment-based product ID mapping:
- **Live Basic**: `80563e0c-7957-4a0e-8287-fb6c03621ff6` → `basic`
- **Live Pro**: `59a5060f-8bb3-4a43-ad13-6d0f8ccd6ea1` → `pro`
- **Sandbox Basic**: `9e28204e-16fe-48ad-ad17-5f236b345f90` → `basic` ($4.99 subscription)
- **Sandbox Pro**: `34da0d93-2c29-496e-9162-2432e8c969ba` → `pro` ($59.99/yearly subscription)

### **4. Debugging Steps**

#### **Step 1: Check Environment Configuration**
Visit: `http://localhost:5000/api/v1/env-check`
This will show you:
- Current environment (development/production)
- Product IDs being used
- Polar.sh configuration status

#### **Step 2: Check Webhook Logs**
Look for these logs in your backend console:
```
🔍 Environment: sandbox
🔍 Product ID: 34da0d93-2c29-496e-9162-2432e8c969ba -> Plan: basic
🔔 Webhook received: [payload]
✅ Order paid: [payload]
🔍 Processing order: Email=..., OrderID=..., ProductID=...
🔍 Existing user found: Yes
✅ Updated subscription for user: ... (Plan: ...)
```

#### **Step 3: Test Webhook Manually**
Use the test endpoint to simulate a webhook:
```bash
curl -X POST http://localhost:5000/api/v1/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","productId":"9e28204e-16fe-48ad-ad17-5f236b345f90"}'
```

#### **Step 4: Check Database**
Verify the user exists in your database:
```javascript
// In MongoDB shell or your database tool
db.users.findOne({email: "your-email@example.com"})
```

#### **Step 5: Check Polar.sh Dashboard**
1. Go to your Polar.sh dashboard
2. Check the "Webhooks" section
3. Verify webhook delivery status
4. Check if webhooks are being sent

### **5. Common Issues**

#### **Issue: Wrong Product IDs**
- **Cause**: Environment variables not set or wrong environment detected
- **Solution**: Check `/api/v1/env-check` endpoint and set correct environment variables

#### **Issue: User Not Found**
- **Cause**: Email in webhook doesn't match user email in database
- **Solution**: Check email case sensitivity and formatting

#### **Issue: Product ID Not Mapped**
- **Cause**: Product ID not in the mapping function
- **Solution**: Add the product ID to environment variables

#### **Issue: Webhook Not Received**
- **Cause**: Webhook URL incorrect or not accessible
- **Solution**: Check webhook URL and ensure server is running

#### **Issue: Database Update Fails**
- **Cause**: Database connection or schema issues
- **Solution**: Check database connection and user schema

### **6. Testing Checklist**

- [ ] Environment configuration is correct (`/api/v1/env-check`)
- [ ] Webhook URL is correct in Polar.sh
- [ ] Webhook secret is configured
- [ ] Server is running and accessible
- [ ] User exists in database
- [ ] Product ID is mapped correctly
- [ ] Webhook logs appear in console
- [ ] Database is updated after webhook

### **7. Manual Database Update**
If webhooks still don't work, you can manually update a user:
```javascript
// In your database
db.users.updateOne(
  {email: "user@example.com"},
  {
    $set: {
      subscriptionStatus: "active",
      subscriptionPlan: "basic",
      subscriptionProductId: "9e28204e-16fe-48ad-ad17-5f236b345f90"
    }
  }
)
```

### **8. Environment Variables Required**
Make sure these are set in your `.env` file:
```env
NODE_ENV=development
POLAR_ACCESS_TOKEN=plr_...
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_SANDBOX_BASIC_PRODUCT_ID=9e28204e-16fe-48ad-ad17-5f236b345f90
POLAR_SANDBOX_PRO_PRODUCT_ID=34da0d93-2c29-496e-9162-2432e8c969ba
POLAR_LIVE_BASIC_PRODUCT_ID=80563e0c-7957-4a0e-8287-fb6c03621ff6
POLAR_LIVE_PRO_PRODUCT_ID=59a5060f-8bb3-4a43-ad13-6d0f8ccd6ea1
``` 