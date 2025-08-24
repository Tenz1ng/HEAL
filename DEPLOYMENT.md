# Vercel Deployment Guide

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenRouter API Key**: Get your API key from [openrouter.ai](https://openrouter.ai)

## Step-by-Step Deployment

### 1. **Prepare Your Repository**
- Ensure all changes are committed to your Git repository
- Make sure your repository is connected to GitHub/GitLab/Bitbucket

### 2. **Set Up Environment Variables in Vercel**
After importing your project to Vercel, go to **Settings > Environment Variables** and add:

```
OPENROUTER_API_KEY=your_actual_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 3. **Configure Build Settings**
In Vercel project settings:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### 4. **Deploy**
- Push your changes to your repository
- Vercel will automatically trigger a new deployment
- Monitor the build logs for any errors

## Troubleshooting 404 Errors

### Common Causes:
1. **Missing Environment Variables**: Ensure all required env vars are set in Vercel
2. **Build Failures**: Check build logs for compilation errors
3. **API Route Issues**: Verify all API routes are properly configured

### Debug Steps:
1. Check Vercel build logs for errors
2. Verify environment variables are set correctly
3. Test local build with `pnpm build`
4. Ensure all dependencies are in `package.json`

## Windows-Specific Issues

### Symlink Permission Errors
If you encounter `EPERM: operation not permitted, symlink` errors on Windows:
- This is a known Windows limitation with certain Next.js configurations
- The current configuration has been optimized to avoid these issues
- If problems persist, try running PowerShell as Administrator

### Build Warnings
- The configuration now avoids deprecated Next.js options
- All builds should complete without warnings on Windows

## Local Testing
Before deploying, test locally:
```bash
# Install dependencies
pnpm install

# Set environment variables
cp env.example .env.local
# Edit .env.local with your actual values

# Test build
pnpm build

# Test production build
pnpm start
```

## Support
If you continue to experience issues:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Ensure your Next.js version is compatible with Vercel
4. Check the [Vercel documentation](https://vercel.com/docs)
5. For Windows-specific issues, ensure you're using the latest configuration files
