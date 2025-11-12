/*
  # Add Contest and Chat System

  ## Overview
  Extends the schema to support contests/tests, scoring, and AI chatbot functionality.

  ## New Tables

  ### 1. `contests`
  Competitive contests with time limits
  - `id` (uuid, primary key)
  - `title` (text) - Contest title
  - `description` (text) - Contest description
  - `difficulty` (text) - easy, medium, hard
  - `problem_ids` (uuid[]) - Problems included in contest
  - `duration_minutes` (integer) - Time limit in minutes
  - `max_score` (integer) - Maximum possible score
  - `is_active` (boolean) - Whether contest is available
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `contest_attempts`
  User attempts at contests
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `contest_id` (uuid, foreign key) - References contests
  - `started_at` (timestamptz) - When user started
  - `ended_at` (timestamptz) - When user finished
  - `score` (integer) - Final score
  - `problems_solved` (integer) - Count of solved problems
  - `total_problems` (integer) - Total problems in contest
  - `created_at` (timestamptz)

  ### 3. `contest_submissions`
  Individual submissions during contests
  - `id` (uuid, primary key)
  - `attempt_id` (uuid, foreign key) - References contest_attempts
  - `problem_id` (uuid, foreign key) - References problems
  - `code` (text) - Submitted code
  - `language` (text) - Programming language
  - `status` (text) - accepted, wrong_answer, timeout
  - `score` (integer) - Points earned
  - `submitted_at` (timestamptz)

  ### 4. `chat_messages`
  AI chatbot conversation history
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `problem_id` (uuid, foreign key) - References problems (nullable)
  - `message_type` (text) - user, assistant
  - `content` (text) - Message content
  - `hint_level` (integer) - Level of hint provided (0-3)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own contests and chat
*/

-- Create contests table
CREATE TABLE IF NOT EXISTS contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  problem_ids uuid[] NOT NULL DEFAULT '{}',
  duration_minutes integer NOT NULL DEFAULT 60,
  max_score integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contests"
  ON contests FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create contest_attempts table
CREATE TABLE IF NOT EXISTS contest_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contest_id uuid REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  score integer DEFAULT 0,
  problems_solved integer DEFAULT 0,
  total_problems integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contest_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contest attempts"
  ON contest_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create contest attempts"
  ON contest_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contest attempts"
  ON contest_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create contest_submissions table
CREATE TABLE IF NOT EXISTS contest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES contest_attempts(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  language text NOT NULL,
  status text NOT NULL,
  score integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contest submissions"
  ON contest_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM contest_attempts
    WHERE contest_attempts.id = contest_submissions.attempt_id
    AND contest_attempts.user_id = auth.uid()
  ));

CREATE POLICY "Users can create contest submissions"
  ON contest_submissions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM contest_attempts
    WHERE contest_attempts.id = contest_submissions.attempt_id
    AND contest_attempts.user_id = auth.uid()
  ));

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE SET NULL,
  message_type text NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content text NOT NULL,
  hint_level integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contest_attempts_user_id ON contest_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_attempts_contest_id ON contest_attempts(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_attempt_id ON contest_submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_problem_id ON chat_messages(problem_id);