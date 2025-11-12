import { useEffect, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ContestCard } from './ContestCard';
import { ContestRunner } from './ContestRunner';

interface Contest {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration_minutes: number;
  max_score: number;
  problem_ids: string[];
}

interface ContestPageProps {
  onBack: () => void;
}

export function ContestPage({ onBack }: ContestPageProps) {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      setContests(data || []);
    } catch (error) {
      console.error('Error loading contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartContest = (contestId: string) => {
    const contest = contests.find(c => c.id === contestId);
    if (contest) {
      setSelectedContest(contest);
      setIsRunning(true);
    }
  };

  const handleContestEnd = () => {
    setIsRunning(false);
    setSelectedContest(null);
    loadContests();
  };

  if (isRunning && selectedContest) {
    return (
      <ContestRunner
        contest={selectedContest}
        onEnd={handleContestEnd}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Contests</h1>
        <p className="text-gray-600">Challenge yourself with timed contests</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {contests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Contests Available
            </h3>
            <p className="text-gray-600">
              Check back soon for new contests!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map(contest => (
              <ContestCard
                key={contest.id}
                id={contest.id}
                title={contest.title}
                description={contest.description}
                difficulty={contest.difficulty}
                durationMinutes={contest.duration_minutes}
                maxScore={contest.max_score}
                problemCount={contest.problem_ids.length}
                onStart={handleStartContest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
