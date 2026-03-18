# OpenAI API Key Setup Guide

Follow these steps to get your OpenAI API key:

## Step 1: Create OpenAI Account
1. Visit https://platform.openai.com/
2. Click "Sign Up" (or "Log In" if you have an account)
3. Create account with email or use Google/Microsoft login
4. Verify your email address

## Step 2: Add Billing Information
⚠️ **IMPORTANT**: OpenAI API requires billing to be set up

1. Click on your profile (top right)
2. Go to "Billing" or "Settings" → "Billing"
3. Click "Add payment method"
4. Enter credit card information
5. Add initial credit (minimum $5 recommended)

**Note**: The API is pay-as-you-go. GPT-4 costs approximately:
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens

For this pharmacy app, expect around $0.10-0.50 per order processed.

## Step 3: Create API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a name (e.g., "Pharmacy AI")
4. Click "Create secret key"
5. **COPY THE KEY IMMEDIATELY** (starts with `sk-proj-...`)
   - You won't be able to see it again!
   - Store it securely

## Step 4: Configure .env File
1. Open `.env` file in the project root
2. Add your API key to `OPENAI_API_KEY`:
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Step 5: Set Usage Limits (Recommended)
To avoid unexpected charges:

1. Go to https://platform.openai.com/account/limits
2. Set monthly budget limit (e.g., $20)
3. Enable email notifications for usage alerts

## Example .env Configuration
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pharmacyDB
OPENAI_API_KEY=sk-proj-Ab123Cd456Ef789Gh012Ij345Kl678Mn901Op234Qr567St890
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Verify API Key
Test your API key:

```bash
cd backend
npm install
npm run dev
```

Try processing an order. If successful, you'll see AI agent interactions in the console.

## API Usage Monitoring
Monitor your usage:
1. Visit https://platform.openai.com/usage
2. View daily/monthly costs
3. Check token consumption

## Troubleshooting

### Error: "Incorrect API key"
- Double-check the key in `.env` file
- Make sure there are no extra spaces
- Verify the key starts with `sk-proj-`

### Error: "You exceeded your current quota"
- Add billing information
- Add credit to your account
- Wait for billing to process (can take a few minutes)

### Error: "Rate limit exceeded"
- You're making too many requests
- Wait a minute and try again
- Upgrade to a higher tier plan if needed

## Cost Optimization Tips
1. Use GPT-3.5-turbo for simple tasks (10x cheaper)
2. Set concise system prompts
3. Implement caching for common queries
4. Monitor usage regularly

## Security Best Practices
1. ✅ NEVER commit `.env` file to GitHub
2. ✅ Use environment variables
3. ✅ Rotate keys regularly
4. ✅ Set usage limits
5. ❌ Don't share keys publicly

---

For more information:
- API Docs: https://platform.openai.com/docs
- Pricing: https://openai.com/pricing
- Support: https://help.openai.com
