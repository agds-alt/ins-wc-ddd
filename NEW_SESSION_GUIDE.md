# Guide: Starting New Claude Code Session

**Date:** 2025-10-28
**For Future Reference**

---

## ✅ CORRECT: Clone from MASTER Branch

When starting a new Claude Code session, always work from **master branch**.

### Why Master?

1. ✅ **All changes already merged** - Sprint 1 & 2 code is in master
2. ✅ **Source of truth** - Master is the production-ready branch
3. ✅ **Clean history** - No duplicate work
4. ✅ **Best practice** - Industry standard workflow

### Why NOT Session Branch?

Session branches (`claude/session-...`) are:
- ❌ Temporary - meant for PR only
- ❌ Already merged - work is done
- ❌ Will confuse Claude - might suggest re-doing work
- ❌ Not the source of truth

---

## 🚀 How to Start New Session

### Step 1: Switch to Master
```bash
cd /path/to/wc-checks
git checkout master
git pull origin master
```

### Step 2: Verify Master Has Everything
```bash
# Check recent commits - should see Sprint 1 & 2 merge
git log --oneline -5

# Expected output:
# xxxxx Merge pull request #10 from claude/session-011CUYtH1SFStXMyqkQwGge8
# xxxxx Sprint 1 & 2: Security fixes, performance optimization...
```

### Step 3: Start Claude Code Session
```bash
# You're ready! Start new session
claude-code
```

### Step 4: Tell Claude Context (Optional)
When starting, you can tell Claude:

> "Hey, I'm working on wc-checks project. Sprint 1 & 2 are already complete (security fixes, performance indexes, RLS policies). Everything is in master branch. What should we work on next?"

---

## 📋 What's Already Done (Don't Repeat!)

**Sprint 1 ✅ (In Master):**
- Cloudinary credentials moved to env vars
- Registration rollback mechanism
- Duplicate modal fix
- .env.example template

**Sprint 2 ✅ (In Master):**
- 25+ database indexes
- 30+ RLS policies
- Zod validation
- Batch upload resilience

**Database ✅ (Already Applied):**
- All migrations applied
- Super Admin configured (agdscid@gmail.com)
- All users have roles

---

## 🎯 Suggested Next Tasks (for New Session)

Pick one or suggest your own:

### Option 1: Sprint 3 - User Experience
- Implement offline mode (PWA cache strategies)
- Add search/filter functionality
- Improve mobile responsiveness
- Add data export features (CSV, PDF reports)

### Option 2: Sprint 4 - Analytics & Reporting
- Dashboard analytics charts
- Inspection trends over time
- Location performance metrics
- User activity tracking

### Option 3: Sprint 5 - Testing
- Write unit tests (Vitest)
- Write integration tests
- Add E2E tests (Playwright)
- CI/CD pipeline

### Option 4: Bug Fixes & Polish
- Fix any remaining issues
- Code refactoring
- Performance tuning
- Documentation improvements

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:
```bash
# Don't work from session branch
git checkout claude/session-011CUYtH1SFStXMyqkQwGge8  # ❌ WRONG

# Don't create branch from old session
git checkout -b new-feature claude/session-011CUYtH1SFStXMyqkQwGge8  # ❌ WRONG
```

### ✅ DO:
```bash
# Work from master
git checkout master  # ✅ CORRECT
git pull origin master  # ✅ CORRECT

# Create new branch from master
git checkout -b feature/new-thing  # ✅ CORRECT
```

---

## 📊 Current Branch Status

### Master Branch:
- ✅ Latest code
- ✅ Sprint 1 & 2 complete
- ✅ Production ready
- ✅ All migrations applied

### Session Branch (claude/session-011CUYtH1SFStXMyqkQwGge8):
- ⚠️ Already merged to master
- ⚠️ No longer needed for development
- ℹ️ Can be deleted (optional)

### Remove-Submit-Button Branch:
- ⚠️ Already merged to master
- ⚠️ No longer needed for development
- ℹ️ Can be deleted (optional)

---

## 🧹 Optional: Cleanup Old Branches

After confirming everything works in master:

```bash
# Delete local session branch (optional)
git branch -d claude/session-011CUYtH1SFStXMyqkQwGge8

# Delete remote session branch (optional)
git push origin --delete claude/session-011CUYtH1SFStXMyqkQwGge8

# Note: Only delete if you're SURE everything is merged!
```

---

## 🎯 Summary

**For New Claude Code Session:**

1. ✅ Use: `master` branch
2. ❌ Don't use: Session branches
3. ✅ Master has all Sprint 1 & 2 work
4. ✅ Database already configured
5. ✅ Ready for new features!

**Command:**
```bash
git checkout master && git pull origin master
```

---

## 📞 Need Help?

If new Claude session suggests re-doing Sprint 1 & 2, tell it:

> "Sprint 1 and 2 are already complete and merged to master. Check the git log and MASTER_COMPARISON.md file. Let's work on new features instead."

---

**Always work from master! 🎯**
