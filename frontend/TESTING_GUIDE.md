# 🔧 Authentication Fix - Testing Guide

## Current Issue
Login succeeds (200) but dashboard immediately gets 401 errors because the access token isn't being sent in the Authorization header.

## Changes Made

### 1. Fixed Refresh Token Endpoint (/api/v1/auth/refresh)
- **File**: `frontend/src/store/authStore.js`
- **File**: `frontend/src/services/api.js`
- **Change**: Send refresh token in Authorization header instead of request body

### 2. Added Token Initialization
- **File**: `frontend/src/App.jsx`
- **Change**: Added useEffect to set token in API client when accessToken changes

### 3. Fixed Login Race Condition
- **File**: `frontend/src/pages/auth/Login.jsx`
- **Change**: Ensured token is set before navigating to dashboard

## ⚠️ IMPORTANT: Clear Browser Data

**The changes won't work until you clear your browser's cached data!**

### Option 1: Hard Refresh (Recommended)
1. Open your browser
2. Press **Ctrl + Shift + R** (Linux) or **Cmd + Shift + R** (Mac)
3. This forces a reload without cache

### Option 2: Clear All Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Click **Clear site data** button
5. Refresh the page

### Option 3: Incognito/Private Window
1. Open a new incognito/private window
2. Navigate to `http://localhost:5173`
3. Try logging in

## 🧪 Testing Steps

### Step 1: Stop and Restart Frontend
```bash
# In the frontend terminal
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

### Step 2: Clear Browser Cache
Use one of the methods above (Hard Refresh recommended)

### Step 3: Open DevTools
- Press F12
- Go to **Console** tab
- Go to **Network** tab

### Step 4: Login
1. Navigate to: `http://localhost:5173/login`
2. Enter credentials:
   - Email: `admin@maumart.com`
   - Password: `Admin123!`
3. Click "Sign In"

### Step 5: Watch Network Tab
You should see:

#### ✅ Expected (Success):
```
POST /api/v1/auth/login → 200 OK
  Response: { "user": {...}, "access_token": "eyJ...", "refresh_token": "eyJ..." }

GET /api/v1/admin/dashboard → 200 OK
  Request Headers: Authorization: Bearer eyJ...
  Response: { "stats": {...} }
```

#### ❌ Current (Failure):
```
POST /api/v1/auth/login → 200 OK
  Response: { "user": {...}, "access_token": "eyJ...", "refresh_token": "eyJ..." }

GET /api/v1/admin/dashboard → 401 Unauthorized
  Request Headers: (no Authorization header)
  
POST /api/v1/auth/refresh → 401 Unauthorized
```

### Step 6: Check Console
Look for any error messages in the console tab.

## 🔍 Debugging Checklist

If still getting 401 errors:

### 1. Verify Token is Stored
Open browser console and run:
```javascript
JSON.parse(localStorage.getItem('maumart-auth'))
```

Should show:
```javascript
{
  state: {
    user: {...},
    accessToken: "eyJhbG...",  // Should start with "eyJ"
    refreshToken: "eyJhbG...", // Should start with "eyJ"
    isAuthenticated: true
  },
  version: 0
}
```

### 2. Check if Token is Being Sent
In Network tab, click on the failed `/api/v1/admin/dashboard` request:
- Look at **Request Headers**
- Should see: `Authorization: Bearer eyJhbG...`
- If **missing**, the token isn't being set in the API client

###3. Verify Frontend Code Updated
Check if your changes are loaded:
```javascript
// In browser console
console.log(window.location.reload())
```
Then hard refresh (Ctrl+Shift+R)

### 4. Check Backend is Running
Make sure backend is still running:
```bash
# In backend terminal, should see:
(venv) abdulgee@fedora:~/Documents/mau_mart_campus_marketplace/backend$ python run.py
 * Running on http://0.0.0.0:5000
```

## 🚨 If Still Not Working

### Check Vite Dev Server
Make sure Vite detected the file changes:
```bash
# In frontend terminal, you should see:
1:XX:XX PM [vite] hmr update /src/pages/auth/Login.jsx
1:XX:XX PM [vite] hmr update /src/store/authStore.js
1:XX:XX PM [vite] hmr update /src/services/api.js
1:XX:XX PM [vite] hmr update /src/App.jsx
```

If you DON'T see these messages, Vite didn't reload the files!

**Solution**: Stop and restart the dev server:
```bash
# Press Ctrl+C
npm run dev
```

### Manual Code Verification
Check if the code changes are actually in the files:

```bash
# Check authStore.js
grep -A 3 "refresh token in Authorization header" frontend/src/store/authStore.js

# Check Login.jsx
grep -A 2 "api.setAuthToken" frontend/src/pages/auth/Login.jsx

# Check App.jsx
grep -A 3 "Initialize auth token" frontend/src/App.jsx
```

## 📝 What Each File Does

### authStore.js
- Manages authentication state (user, tokens)
- Handles login, logout, token refresh
- **Fix**: Sends refresh token in header for `/refresh` endpoint

### api.js
- Axios instance for API calls
- Adds Authorization header to requests
- Handles 401 errors and token refresh
- **Fix**: Uses refresh token correctly in interceptor

### App.jsx
- Main app component
- **Fix**: Ensures token is set when app loads/token changes

### Login.jsx
- Login page component
- **Fix**: Sets token before navigating to prevent race condition

## Expected Flow After Fix

1. User enters credentials → Click "Sign In"
2. **POST** `/api/v1/auth/login` → Returns tokens
3. authStore saves tokens to state & localStorage
4. api.setAuthToken() is called with access token
5. Small delay (100ms) to ensure token is set
6. Navigate to `/admin/dashboard`
7. Dashboard component mounts
8. **GET** `/api/v1/admin/dashboard` with Authorization header → 200 OK
9. Dashboard renders with data

---

**Current Status**: Code changes made, waiting for testing after cache clear.
