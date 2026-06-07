# Deployment Guide for Portfolio Website

This guide provides instructions for deploying your portfolio website to various hosting platforms.

## Local Development

To run the website locally for development:

1. Make sure you have Node.js installed on your computer
2. Open a terminal in the project directory
3. Run the following commands:

```bash
# Install dependencies (only needed once)
npm install

# Start the local development server
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment Options

### Option 1: Netlify (Recommended)

1. Create a free account on [Netlify](https://www.netlify.com/)
2. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
3. Login to Netlify:
   ```bash
   netlify login
   ```
4. Deploy your site:
   ```bash
   netlify deploy
   ```
   - When prompted, select "Create & configure a new site"
   - Choose your team
   - Enter a site name (or press enter for a random name)
   - For the publish directory, enter `.` (the current directory)
5. Preview your site using the provided URL
6. If everything looks good, deploy to production:
   ```bash
   netlify deploy --prod
   ```

### Option 2: GitHub Pages

1. Create a GitHub repository for your portfolio
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```
3. Go to your repository settings on GitHub
4. Scroll down to the "GitHub Pages" section
5. Select the branch you want to deploy (usually `main`)
6. Click "Save"
7. Your site will be published at `https://yourusername.github.io/your-repo-name/`

### Option 3: Vercel

1. Create a free account on [Vercel](https://vercel.com/)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Login to Vercel:
   ```bash
   vercel login
   ```
4. Deploy your site:
   ```bash
   vercel
   ```
5. Follow the prompts to complete the deployment

## Custom Domain Setup

After deploying to any of the platforms above, you can add a custom domain:

1. Purchase a domain from a domain registrar (like Namecheap, GoDaddy, Google Domains)
2. In your hosting platform (Netlify, GitHub Pages, Vercel), go to domain settings
3. Add your custom domain
4. Update your domain's DNS settings according to the instructions provided by your hosting platform

## Updating Your Website

To update your website after making changes:

1. Make your changes to the HTML, CSS, or JavaScript files
2. Test locally using `npm start`
3. Redeploy using the same deployment commands for your chosen platform

For Netlify: `netlify deploy --prod`
For GitHub Pages: Push changes to your repository
For Vercel: `vercel --prod`
