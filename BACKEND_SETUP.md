# Ruvo Backend Setup Guide

## 🚀 Quick Start with Supabase

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Set Up Environment Variables
1. Copy `env.example` to `.env`
2. Fill in your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up Database
1. Go to your Supabase dashboard → SQL Editor
2. Copy and run the contents of `database/schema.sql`
3. This creates all tables, indexes, and sample data

### 4. Enable Authentication (Optional)
For now, the app works with mock data. To enable real authentication:
1. Go to Authentication → Settings in Supabase
2. Enable email/password auth
3. Update the auth flow in the app

## 📁 Backend Structure

```
lib/
├── supabase.ts          # Supabase client & types
├── services.ts          # API service functions
└── hooks.ts            # React Query hooks

database/
└── schema.sql          # Database schema & sample data
```

## 🔧 Features Implemented

### ✅ Database Schema
- **Users**: Profile, interests, sources, preferences
- **Signals**: News articles with metadata
- **User Signals**: Like, save, dismiss interactions
- **Notifications**: Real-time alerts
- **Interests & Sources**: Metadata tables

### ✅ API Services
- User management (CRUD)
- Signal fetching & interactions
- Notification management
- Search functionality
- Trending signals

### ✅ React Query Integration
- Automatic caching & refetching
- Optimistic updates
- Error handling
- Loading states

### ✅ Security
- Row Level Security (RLS) policies
- User-specific data access
- Public read access for signals

## 🎯 Next Steps

1. **Set up Supabase project** (5 minutes)
2. **Add environment variables** (2 minutes)
3. **Run database schema** (1 minute)
4. **Test the app** - it will use mock data until you connect Supabase

## 🔄 Real-time Features (Future)

- WebSocket connections for live updates
- Push notifications via Expo
- AI-powered content curation
- User behavior analytics

## 📊 Sample Data Included

- 10 interests (Tech, Finance, Health, etc.)
- 10 verified news sources
- 5 sample signals with images
- Ready-to-use database structure

The app is now backend-ready! Just add your Supabase credentials and you'll have a fully functional news aggregation platform.
