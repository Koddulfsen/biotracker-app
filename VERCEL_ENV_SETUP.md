# Vercel Environment Variables Setup

## Problem
The "Failed to execute 'fetch' on 'Window': Invalid value" error occurs because the Supabase environment variables are not configured in your Vercel deployment.

## Solution

### Step 1: Go to Vercel Dashboard
1. Log in to [vercel.com](https://vercel.com)
2. Select your `biotracker-app` project

### Step 2: Add Environment Variables
1. Go to Settings → Environment Variables
2. Add these two variables:

```
REACT_APP_SUPABASE_URL=https://pxmukjgzrchnlsukdegy.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXVramd6cmNobmxzdWtkZWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTkzNzYsImV4cCI6MjA2Nzk5NTM3Nn0.O31I8P53_4TyHvqPbAE87kDwcOgSpH2WfvGIzNnZxa0
```

3. Make sure to select "Production", "Preview", and "Development" environments

### Step 3: Redeploy
1. After adding the variables, trigger a new deployment
2. You can do this by pushing a commit or clicking "Redeploy" in Vercel

## What Changed in Code
I've updated the code to:
1. Better handle missing environment variables
2. Show clearer error messages in the console
3. Prevent the app from crashing when Supabase isn't configured

## Testing
After redeployment, check the browser console. You should see:
- "Supabase URL: https://pxmukjgzrchnlsu..." 
- "Supabase Anon Key: Set"

If you still see "Not set", the environment variables aren't loading properly.