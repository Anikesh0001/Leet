import { useEffect, useState } from 'react';
import { TrendingUp, Award, Flame, CheckCircle, Clock, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalAttempts: number;
  streakDays: number;
  ranking: number;
}

interface RecentSubmission {
  id: string;
  problem_title: string;
  status: string;
  language: string;
  created_at: string;
}

interface ContestScore {
  id: string;
  contest_title: string;
  score: number;
  max_score: number;
  problems_solved: number;
  total_problems: number;
  created_at: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    totalAttempts: 0,
    streakDays: 0,
    ranking: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [contestScores, setContestScores] = useState<ContestScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          *,
          problems:problem_id (
            difficulty
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'solved');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          language,
          created_at,
          problems:problem_id (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: contests } = await supabase
        .from('contest_attempts')
        .select(`
          id,
          score,
          problems_solved,
          total_problems,
          created_at,
          contests:contest_id (
            title,
            max_score
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;

      progressData?.forEach((progress: any) => {
        const difficulty = progress.problems?.difficulty;
        if (difficulty === 'easy') easySolved++;
        else if (difficulty === 'medium') mediumSolved++;
        else if (difficulty === 'hard') hardSolved++;
      });

      setStats({
        totalSolved: progressData?.length || 0,
        easySolved,
        mediumSolved,
        hardSolved,
        totalAttempts: submissions?.length || 0,
        streakDays: profile?.streak_days || 0,
        ranking: profile?.ranking || 0
      });

      setRecentSubmissions(
        submissions?.map((sub: any) => ({
          id: sub.id,
          problem_title: sub.problems?.title || 'Unknown',
          status: sub.status,
          language: sub.language,
          created_at: sub.created_at
        })) || []
      );

      setContestScores(
        contests?.map((contest: any) => ({
          id: contest.id,
          contest_title: contest.contests?.title || 'Contest',
          score: contest.score,
          max_score: contest.contests?.max_score || 100,
          problems_solved: contest.problems_solved,
          total_problems: contest.total_problems,
          created_at: contest.created_at
        })) || []
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'accepted') return 'text-green-600 bg-green-50';
    if (status === 'wrong_answer') return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your progress and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle size={32} />
            <TrendingUp size={24} className="opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalSolved}</div>
          <div className="text-blue-100">Problems Solved</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Flame size={32} />
            <span className="text-2xl font-bold">{stats.streakDays}</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.streakDays} Days</div>
          <div className="text-orange-100">Current Streak</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Award size={32} />
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              Top {stats.ranking || 1000}
            </span>
          </div>
          <div className="text-3xl font-bold mb-1">#{stats.ranking || 1000}</div>
          <div className="text-purple-100">Global Rank</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock size={32} />
            <TrendingUp size={24} className="opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalAttempts}</div>
          <div className="text-green-100">Total Attempts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6">Problem Breakdown</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Easy</span>
                <span className="text-sm font-semibold text-green-600">
                  {stats.easySolved}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.easySolved / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Medium</span>
                <span className="text-sm font-semibold text-yellow-600">
                  {stats.mediumSolved}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.mediumSolved / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Hard</span>
                <span className="text-sm font-semibold text-red-600">
                  {stats.hardSolved}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.hardSolved / 30) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalSolved > 0
                  ? Math.round((stats.totalSolved / stats.totalAttempts) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Zap size={20} className="text-orange-500" />
            <span>Contest Performance</span>
          </h2>

          {contestScores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No contests attempted yet. Start a contest to see scores here!
            </div>
          ) : (
            <div className="space-y-3">
              {contestScores.map(contest => (
                <div
                  key={contest.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {contest.contest_title}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {contest.problems_solved}/{contest.total_problems} solved
                      </span>
                      <span>
                        {new Date(contest.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">
                      {contest.score}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {contest.max_score} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Keep Going!</h2>
        <p className="text-blue-100 mb-4">
          You're making great progress. Solve one more problem today to maintain your streak!
        </p>
        <button className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium transition">
          Solve a Problem
        </button>
      </div>
    </div>
  );
}
