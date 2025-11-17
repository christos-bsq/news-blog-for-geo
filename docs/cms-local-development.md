# CMS Local Development Guide

This guide explains how to run and access the Decap CMS (formerly Netlify CMS) admin panel locally for content editing.

## Overview

The CMS is available at `/admin/` and supports two authentication methods:
- **Local development**: Uses GitHub OAuth (no setup required)
- **Production**: Uses Netlify Identity (requires configuration)

## Method 1: Using Astro Dev Server (Recommended for Local Development)

This method uses the GitHub backend for authentication, which works immediately without any Netlify setup.

### Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the CMS:**
   Open your browser and navigate to:
   ```
   http://localhost:4321/admin/
   ```
   (The port may vary if 4321 is already in use)

3. **Log in:**
   - Click the "Login with GitHub" button
   - Authorize the CMS to access your repository (`christos-bsq/news-blog-for-geo`)
   - You'll be redirected back and logged into the CMS

### How It Works

When running on `localhost`, the CMS automatically:
- Detects the local environment
- Switches from `git-gateway` to `github` backend
- Uses GitHub OAuth for authentication
- Allows you to create and edit posts directly in the repository

### Requirements

- You must have write access to the `christos-bsq/news-blog-for-geo` repository
- GitHub OAuth authorization is a one-time process per browser

## Method 2: Using Netlify Dev (For Testing git-gateway)

This method uses Netlify Identity (git-gateway), matching the production setup.

### Prerequisites

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Log in to Netlify:**
   ```bash
   netlify login
   ```

3. **Link your site (first time only):**
   ```bash
   netlify link
   ```
   Follow the prompts to select your site (`signal-north-daily`)

### Steps

1. **Start Netlify Dev:**
   ```bash
   netlify dev
   ```

2. **Access the CMS:**
   Open your browser and navigate to:
   ```
   http://localhost:8888/admin/
   ```

3. **Log in:**
   - Sign up or log in with Netlify Identity
   - You'll receive a confirmation email (first time only)
   - After confirming, you can log in with your email and password

### Enabling Netlify Identity

If you see a login page but can't sign up:

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (`signal-north-daily`)
3. Navigate to **Site settings → Identity**
4. Click **Enable Identity**
5. Set **Registration preferences** to "Open" or "Invite only"
6. Save changes

## Production Access

To access the CMS on the production site:

1. Go to: `https://signal-north-daily.netlify.app/admin/`
2. Ensure Netlify Identity is enabled (see above)
3. Sign up or log in with your email and password

## Troubleshooting

### Error: "Failed to load config.yml (404)"

**Solution:** The config file should be accessible at `/admin/config.yml`. If you see this error:
- Ensure the dev server is running
- Check that `public/admin/config.yml` exists
- Try refreshing the page

### Error: "collections names must be unique"

**Solution:** This usually happens when the config is loaded twice. The code automatically deduplicates collections, but if you see this:
- Clear your browser cache
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check the browser console for additional errors

### Error: "Cannot read properties of undefined (reading 'length')"

**Solution:** This can occur when opening posts with complex `json_ld` fields. The CMS should handle YAML objects, but if you encounter this:
- The `json_ld` field uses a YAML code widget
- Ensure the YAML syntax is valid
- Try saving the post again

### GitHub OAuth Not Working

**Solution:**
- Ensure you have write access to the repository
- Check that the repository name in the config matches: `christos-bsq/news-blog-for-geo`
- Try logging out and logging back in
- Clear browser cookies for localhost

### Netlify Identity Not Available Locally

**Solution:**
- Ensure you've run `netlify login` and `netlify link`
- Use `netlify dev` instead of `npm run dev`
- Check that Identity is enabled in the Netlify dashboard

## File Locations

- **CMS Config**: `public/admin/config.yml`
- **Admin Page**: `src/pages/admin/index.html`
- **Posts Directory**: `src/content/posts/`
- **Media Uploads**: `public/uploads/`

## Configuration Details

The CMS automatically detects the environment:
- **Local** (`localhost`): Uses GitHub backend
- **Production** (`signal-north-daily.netlify.app`): Uses git-gateway (Netlify Identity)

This is handled automatically in `src/pages/admin/index.html` - no manual configuration needed.

## Creating and Editing Posts

Once logged in, you can:
- View all posts in the "Posts" collection
- Create new posts with the "New Post" button
- Edit existing posts by clicking on them
- Upload images to `public/uploads/`
- Set experiment parameters (render mode, delays, JSON-LD, etc.)

Changes are committed directly to the repository and will trigger a new Netlify build.

