# MongoDB Atlas Setup Guide

Follow these steps to get your MongoDB Atlas connection string:

## Step 1: Create Account
1. Visit https://www.mongodb.com/atlas
2. Click "Try Free" or "Sign In"
3. Create a new account (or log in with Google/GitHub)

## Step 2: Create a Cluster
1. After logging in, click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Name your cluster (e.g., "PharmacyCluster")
6. Click "Create Cluster" (takes 3-5 minutes)

## Step 3: Create Database User
1. On the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Enter username: `pharmacyAdmin`
5. Click "Autogenerate Secure Password" (SAVE THIS PASSWORD!)
6. Set user privileges to "Read and write to any database"
7. Click "Add User"

## Step 4: Configure Network Access
1. On the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, use specific IP addresses
4. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://pharmacyAdmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure .env File
1. Open `.env` file in the root directory
2. Replace the `MONGO_URI` value with your connection string
3. Replace `<password>` with your actual password (from Step 3)
4. Replace `myFirstDatabase` or add `/pharmacyDB` before the `?`:
   ```
   mongodb+srv://pharmacyAdmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pharmacyDB?retryWrites=true&w=majority
   ```

## Example .env Configuration
```env
MONGO_URI=mongodb+srv://pharmacyAdmin:MySecurePass123@cluster0.abc123.mongodb.net/pharmacyDB?retryWrites=true&w=majority
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### Connection Issues
- Check IP whitelist (should include 0.0.0.0/0 for development)
- Verify username and password are correct
- Make sure `/pharmacyDB` is in the connection string
- Check for special characters in password (URL encode them)

### Special Characters in Password
If your password has special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`

Example:
```
Password: MyPass@123#
Encoded: MyPass%40123%23
```

## Verify Connection
After configuration, test the connection:
```bash
cd backend
npm install
npm run dev
```

You should see: ✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net

---

For more help, visit: https://www.mongodb.com/docs/atlas/getting-started/
