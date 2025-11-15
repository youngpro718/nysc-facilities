# Environment Setup Guide

## 🔒 Security Notice

This project uses environment variables to store sensitive credentials. **Never commit `.env` files to version control.**

---

## Quick Start

### **1. Development Setup**

Create `.env.local` in the project root:

```bash
# Copy the example and fill in your values
cp .env.production.example .env.local
```

Edit `.env.local`:
```bash
VITE_SUPABASE_URL=https://fmymhtuiqzhupjyopfvi.supabase.co
VITE_SUPABASE_ANON_KEY=your_development_anon_key
VITE_LOG_LEVEL=debug
```

### **2. Production Setup**

Create `.env.production`:

```bash
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_LOG_LEVEL=error
```

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anon/public key |
| `VITE_LOG_LEVEL` | ⚠️ Optional | Log level (debug/info/warn/error) |

---

## Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

**⚠️ Never use the `service_role` key in frontend code!**

---

## Deployment Platforms

### **Netlify**

1. Go to Site Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LOG_LEVEL=error`
3. Redeploy site

### **Vercel**

1. Go to Project Settings → Environment Variables
2. Add the same variables
3. Select environments (Production, Preview, Development)
4. Redeploy

---

## Security Best Practices

### **✅ DO:**
- Use different Supabase projects for dev/staging/prod
- Rotate keys every 90 days
- Set `VITE_LOG_LEVEL=error` in production
- Use environment variables in deployment platform
- Enable Row Level Security (RLS) on all tables

### **❌ DON'T:**
- Commit `.env` files to Git
- Use `service_role` key in frontend
- Share credentials in chat/email
- Use same keys for all environments
- Hardcode credentials in source code

---

## Troubleshooting

### **Error: Missing Supabase environment variables**

**Cause:** `.env.local` file not found or variables not set

**Fix:**
1. Create `.env.local` in project root
2. Add required variables
3. Restart dev server

### **Error: Invalid Supabase credentials**

**Cause:** Wrong URL or key

**Fix:**
1. Verify credentials in Supabase dashboard
2. Check for typos in `.env.local`
3. Ensure no extra spaces or quotes

### **Build fails in production**

**Cause:** Environment variables not set in deployment platform

**Fix:**
1. Add variables in Netlify/Vercel dashboard
2. Redeploy site
3. Check build logs

---

## Environment File Structure

```
project-root/
├── .env.local              # Development (gitignored)
├── .env.production         # Production (gitignored)
├── .env.production.example # Template (committed)
└── .gitignore             # Protects .env files
```

---

## Verification

Test your setup:

```bash
# Start dev server
npm run dev

# Check console for errors
# Should see no "Missing Supabase environment variables" error
```

---

## Key Rotation

If credentials are compromised:

1. **Generate new key** in Supabase dashboard
2. **Update `.env.local`** with new key
3. **Update deployment platform** environment variables
4. **Redeploy** application
5. **Revoke old key** in Supabase dashboard

---

## Support

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- Vite Env Variables: https://vitejs.dev/guide/env-and-mode.html

**Issues:**
- Check `docs/SUPABASE_SECURITY_AUDIT.md`
- Review `docs/TROUBLESHOOTING.md`

---

**Last Updated:** October 26, 2025  
**Status:** ✅ Environment variables properly configured
