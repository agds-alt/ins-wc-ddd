# Contributing to WC Check - Toilet Monitoring System

Thank you for considering contributing to this project! This guide will help you understand our development workflow and testing requirements.

## 🚀 Development Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/ins-wc-ddd.git
cd ins-wc-ddd
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Setup Environment

Copy `.env.example` to `.env.local` and configure your environment variables:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET`

### 4. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## 🧪 Testing Requirements

**All contributions must include tests!** We maintain 70%+ code coverage.

### Writing Tests

#### 1. Unit Tests (Required for new features)

Place tests alongside the code they test:

```typescript
// test/domain/entities/YourEntity.test.ts
import { describe, it, expect } from 'vitest'
import { YourEntity } from '@/domain/entities/YourEntity'

describe('YourEntity', () => {
  it('should create a valid entity', () => {
    const entity = YourEntity.create({ ... })
    expect(entity).toBeDefined()
  })
})
```

#### 2. Run Tests Locally

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Check coverage
npm run test:coverage
```

**Requirements:**
- All tests must pass
- New code should have 70%+ coverage
- Domain entities should have 90%+ coverage

### Test Guidelines

- ✅ Test business logic, not implementation details
- ✅ Use descriptive test names (should/when/then pattern)
- ✅ Mock external dependencies (Supabase, Cloudinary)
- ✅ Test edge cases and error scenarios
- ❌ Don't test third-party libraries
- ❌ Don't test simple getters/setters

## 📝 Code Quality

### Before Committing

Run these commands to ensure quality:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test

# Build check
npm run build
```

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Use functional programming patterns
- Keep functions small and focused
- Add JSDoc comments for public APIs

### Commit Messages

Follow conventional commits:

```
feat: Add user authentication
fix: Resolve QR code scanning issue
docs: Update README with setup instructions
test: Add tests for InspectionService
refactor: Simplify location repository
chore: Update dependencies
```

## 🔄 Pull Request Process

### 1. Ensure CI Passes

Before creating a PR, make sure:
- ✅ All tests pass (`npm test`)
- ✅ Type checking passes (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)

### 2. Create Pull Request

- Write a clear PR description
- Reference related issues (e.g., "Fixes #123")
- Add screenshots for UI changes
- Keep PRs focused (one feature/fix per PR)

### 3. PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows project style
- [ ] CI checks pass
- [ ] No breaking changes (or documented)

### 4. Code Review

- Address reviewer feedback
- Keep discussions professional
- Be open to suggestions

## 🏗️ Project Architecture

### Domain-Driven Design (DDD)

```
src/
├── domain/
│   ├── entities/          # Business entities (Inspection, User, Location)
│   ├── repositories/      # Repository interfaces
│   └── services/          # Business logic services
├── infrastructure/
│   ├── database/          # Supabase repositories
│   └── auth/              # Authentication utilities
├── server/
│   └── routers/           # tRPC API routes
└── app/                   # Next.js pages
```

### Key Principles

1. **Domain entities are pure** - No external dependencies
2. **Repositories abstract data access** - Easy to test and swap
3. **Services contain business logic** - Keep controllers thin
4. **tRPC for type safety** - End-to-end type safety

## 🐛 Reporting Bugs

### Before Submitting

1. Check existing issues
2. Try to reproduce consistently
3. Test on latest version

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Node version: [e.g., 20.x]
```

## 💡 Suggesting Features

Feature requests are welcome! Please include:

- **Use case**: Why is this needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Impact**: Who benefits from this?

## 🔐 Security Issues

**Do not open public issues for security vulnerabilities!**

Instead, email security concerns to: [your-email@example.com]

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

## ❓ Questions?

- Open a discussion on GitHub
- Check the documentation
- Review existing issues

---

**Thank you for contributing! 🎉**
