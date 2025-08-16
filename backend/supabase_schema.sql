-- supabase_schema.sql

-- Profiles Table
-- This table stores public user data and is linked to the auth.users table.
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  original_title TEXT,
  poster_url TEXT,
  banner_url TEXT,
  synopsis TEXT,
  year INT,
  country TEXT,
  content_type TEXT, -- e.g., 'movie', 'series', 'anime'
  genres TEXT[], -- Array of genres
  rating REAL DEFAULT 0,
  episodes INT,
  duration INT, -- in minutes
  cast JSONB,
  crew JSONB,
  streaming_platforms TEXT[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist Table
CREATE TABLE watchlist (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  status TEXT, -- e.g., 'want_to_watch', 'watching', 'completed', 'dropped'
  progress INT,
  total_episodes INT,
  rating REAL,
  notes TEXT,
  started_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Reviews Table
CREATE TABLE reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  rating REAL NOT NULL CHECK (rating >= 0 AND rating <= 10),
  title TEXT,
  review_text TEXT,
  contains_spoilers BOOLEAN DEFAULT FALSE,
  helpful_votes INT DEFAULT 0,
  total_votes INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( TRUE );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- RLS Policies for Content (assuming content is public)
CREATE POLICY "Content is viewable by everyone."
  ON content FOR SELECT
  USING ( TRUE );

-- RLS Policies for Watchlist
CREATE POLICY "Users can view their own watchlist."
  ON watchlist FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own watchlist items."
  ON watchlist FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own watchlist items."
  ON watchlist FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own watchlist items."
  ON watchlist FOR DELETE
  USING ( auth.uid() = user_id );

-- RLS Policies for Reviews
CREATE POLICY "Reviews are viewable by everyone."
  ON reviews FOR SELECT
  USING ( TRUE );

CREATE POLICY "Users can insert their own reviews."
  ON reviews FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own reviews."
  ON reviews FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own reviews."
  ON reviews FOR DELETE
  USING ( auth.uid() = user_id );
