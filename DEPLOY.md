# Deploying to Vercel

## 1. Create a GitHub repository

Go to github.com, sign in, and create a new repository called `idaho-alfalfa-tool`.  
Leave it empty (no README, no .gitignore).

## 2. Push the code

In your terminal, from the project root:

```bash
git init
git add .
git commit -m "first commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

Replace `YOUR_GITHUB_URL` with the URL shown on your new GitHub repo page  
(e.g. `https://github.com/yourusername/idaho-alfalfa-tool.git`).

## 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project**.
3. Import `idaho-alfalfa-tool` from your GitHub account.
4. Vercel will auto-detect Vite. Confirm these settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
5. Click **Deploy**.
6. Your site will be live at `yourproject.vercel.app` in about 30 seconds.

## Notes

- The `vercel.json` rewrite rule is already in the repo — it ensures React Router
  routes like `/farm-setup` or `/yield` load correctly when visited directly or refreshed.
- Every `git push` to `main` will trigger an automatic redeploy.
