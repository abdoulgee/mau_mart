# 🚀 MAU MART Production Deployment Guide

This guide explains how to host your application online so that anyone, anywhere in the world, can access and test it.

## 1. Prerequisites
- A **GitHub** account.
- Your code pushed to a GitHub repository.

---

11: ## 2. Backend Deployment (Render.com)
12: We recommend **Render** because it supports Python and allows for persistent storage (so images don't disappear).
13: 
14: 1. Create a free account on [Render.com](https://render.com).
15: 2. Click **New +** > **Web Service**.
16: 3. Connect your GitHub repository.
17: 4. **Settings**:
18:    - **Root Directory**: `backend` (⚠️ CRITICAL: Point it to your backend folder)
19:    - **Environment**: `Python`
20:    - **Build Command**: `pip install -r requirements.txt`
21:    - **Start Command**: `gunicorn --worker-class eventlet -w 1 run:app`
22: 5. **Environment Variables**:
...
34: ## 3. Frontend Deployment (Vercel.com)
35: Vercel is the best platform for React/Vite apps.
36: 
37: 1. Create a free account on [Vercel.com](https://vercel.com).
38: 2. Click **Add New** > **Project**.
39: 3. Import your GitHub repository.
40: 4. **Settings**:
41:    - **Root Directory**: `frontend` (⚠️ CRITICAL: Point it to your frontend folder)
42:    - Vercel should automatically detect **Vite**.
43: 5. **Environment Variables**:
44:    - Add `VITE_API_URL`: (Your new Render Backend URL - e.g., `https://maumart-api.onrender.com`)
45: 6. Click **Deploy**.


---

## 4. CockroachDB Configuration
Since you are using a cloud database, it's already "worldwide." You just need to check:
1. Go to your **CockroachDB Cloud Console**.
2. Go to **Networking** > **Allowlist**.
3. For testing purposes, you can add `0.0.0.0/0` (allows all IPs) or add the specific outbound IP of your Render web service.

---

## 5. Summary of URLs
Once deployed, you will have two main URLs:
- **Frontend**: `https://your-app-name.vercel.app` (This is what you share with testers).
- **Backend**: `https://your-api-name.onrender.com` (Used for API calls).

### 💡 Pro Tip
If you want a professional look, you can buy a domain (like `maumart.com`) and point it to these URLs in the Vercel and Render settings.
