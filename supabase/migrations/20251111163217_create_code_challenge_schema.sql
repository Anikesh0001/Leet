/*
  # Code Challenge Platform Schema

  ## Overview
  Creates a comprehensive schema for a LeetCode-style coding platform with enhanced features.

  ## New Tables
  
  ### 1. `problems`
  Core table storing coding problems
  - `id` (uuid, primary key)
  - `title` (text) - Problem title
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Problem description in markdown
  - `difficulty` (text) - easy, medium, hard
  - `category` (text) - Array, String, Dynamic Programming, etc.
  - `tags` (text[]) - Multiple tags for filtering
  - `acceptance_rate` (numeric) - Success rate percentage
  - `likes` (integer) - Number of likes
  - `dislikes` (integer) - Number of dislikes
  - `is_premium` (boolean) - Premium problem flag
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. `test_cases`
  Test cases for each problem
  - `id` (uuid, primary key)
  - `problem_id` (uuid, foreign key) - References problems
  - `input` (jsonb) - Test input data
  - `expected_output` (jsonb) - Expected output
  - `is_example` (boolean) - Visible to users
  - `is_hidden` (boolean) - Hidden test case
  - `created_at` (timestamptz)
  
  ### 3. `submissions`
  User code submissions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `problem_id` (uuid, foreign key) - References problems
  - `code` (text) - Submitted code
  - `language` (text) - Programming language
  - `status` (text) - accepted, wrong_answer, runtime_error, etc.
  - `runtime_ms` (integer) - Execution time
  - `memory_kb` (integer) - Memory usage
  - `test_cases_passed` (integer)
  - `test_cases_total` (integer)
  - `created_at` (timestamptz)
  
  ### 4. `user_progress`
  Track user progress on problems
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `problem_id` (uuid, foreign key) - References problems
  - `status` (text) - attempted, solved
  - `attempts` (integer) - Number of attempts
  - `last_attempted_at` (timestamptz)
  - `solved_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 5. `discussions`
  Discussion threads for problems
  - `id` (uuid, primary key)
  - `problem_id` (uuid, foreign key) - References problems
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Discussion title
  - `content` (text) - Discussion content
  - `upvotes` (integer)
  - `is_solution` (boolean) - Marked as solution
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. `hints`
  Progressive hints for problems
  - `id` (uuid, primary key)
  - `problem_id` (uuid, foreign key) - References problems
  - `hint_order` (integer) - Order of hint revelation
  - `content` (text) - Hint content
  - `created_at` (timestamptz)
  
  ### 7. `user_profiles`
  Extended user profile information
  - `id` (uuid, primary key) - References auth.users
  - `username` (text, unique) - Display name
  - `avatar_url` (text)
  - `bio` (text)
  - `problems_solved` (integer)
  - `streak_days` (integer)
  - `ranking` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can read all public problems
  - Users can only create/update their own submissions and progress
  - Authenticated users can participate in discussions
*/

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  acceptance_rate numeric DEFAULT 0,
  likes integer DEFAULT 0,
  dislikes integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view problems"
  ON problems FOR SELECT
  TO authenticated
  USING (true);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  input jsonb NOT NULL,
  expected_output jsonb NOT NULL,
  is_example boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view example test cases"
  ON test_cases FOR SELECT
  TO authenticated
  USING (is_example = true);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  language text NOT NULL,
  status text NOT NULL,
  runtime_ms integer DEFAULT 0,
  memory_kb integer DEFAULT 0,
  test_cases_passed integer DEFAULT 0,
  test_cases_total integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('attempted', 'solved')),
  attempts integer DEFAULT 0,
  last_attempted_at timestamptz DEFAULT now(),
  solved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  is_solution boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discussions"
  ON discussions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create discussions"
  ON discussions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
  ON discussions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create hints table
CREATE TABLE IF NOT EXISTS hints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  hint_order integer NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hints"
  ON hints FOR SELECT
  TO authenticated
  USING (true);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  problems_solved integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  ranking integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_problem_id ON discussions(problem_id);