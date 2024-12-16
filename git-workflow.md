# Create feature branch
git checkout -b feature/new-feature

# Do local development
npm run dev

# When ready for staging
git push origin feature/new-feature

# After testing in Railway dev environment
git checkout dev
git merge feature/new-feature
git push origin dev

# After final approval
git checkout main
git merge dev
git push origin main