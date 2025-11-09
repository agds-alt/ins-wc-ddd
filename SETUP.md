# Setup Guide - Next.js 16 + tRPC Toilet Checks App

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (for client)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for server)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset
- `JWT_SECRET` - Secret key for JWT tokens (generate a random string)

### 3. Setup Database

The app requires the following Supabase tables:
- `users`
- `roles`
- `user_roles`
- `locations`
- `inspections`
- `inspection_photos`
- `organizations`
- `buildings`
- `user_occupations`
- `audit_logs`

Run your database migrations if you have them, or use the SQL files in `supabase/migrations/`.

### 4. Seed Test Users

**IMPORTANT**: You need at least one user in the database to login.

#### Option A: Via API (Recommended)

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Visit this URL in your browser or use curl:
   ```
   http://localhost:3000/api/seed
   ```

3. You should see a success message with the test credentials.

#### Option B: Via CLI

```bash
pnpm seed
```

**Test Credentials Created:**

- **Admin Account**
  - Email: `admin@test.com`
  - Password: `Admin123!`

- **User Account**
  - Email: `user@test.com`
  - Password: `User123!`

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and login with the test credentials above.

## Troubleshooting

### 401 Unauthorized Error on Login

**Cause**: No users exist in the database.

**Solution**: Run the seed script (see step 4 above).

### Build Errors

Make sure all environment variables are set in `.env.local`. The build will use placeholder values if they're missing, but the app won't work correctly.

### Database Connection Errors

1. Verify your Supabase credentials in `.env.local`
2. Check that your Supabase project is active
3. Ensure RLS (Row Level Security) policies allow the operations

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm seed` - Seed test users (requires database access)

## Architecture

This application uses:

- **Next.js 16** - App Router, Server Components, Middleware
- **tRPC v11** - End-to-end type-safe API
- **React Query v5** - Data fetching and caching
- **Supabase** - PostgreSQL database and authentication
- **TypeScript** - Strict mode enabled
- **TailwindCSS** - Styling
- **Domain-Driven Design (DDD)** - Clean architecture

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login, Register pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── domain/                # Domain layer (entities, services)
│   ├── entities/         # Business entities
│   ├── repositories/     # Repository interfaces
│   └── services/         # Domain services
├── infrastructure/        # Infrastructure layer
│   ├── auth/             # JWT authentication
│   ├── database/         # Supabase client & repositories
│   └── services/         # External services
├── application/          # Application layer
│   └── use-cases/        # Use cases/application services
└── server/               # tRPC server
    └── routers/          # tRPC API routers

```

## Next Steps

1. Customize the JWT_SECRET in production
2. Set up proper Supabase RLS policies
3. Configure Cloudinary for image uploads
4. Add more test data as needed
5. Deploy to Vercel or your preferred platform

## Support

For issues or questions, refer to:
- Next.js docs: https://nextjs.org/docs
- tRPC docs: https://trpc.io/docs
- Supabase docs: https://supabase.com/docs
