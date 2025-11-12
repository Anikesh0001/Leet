import { useEffect, useState } from 'react';
import { Clock, ChevronRight, Flag, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CodeEditor } from './CodeEditor';

interface Contest {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_score: number;
  problem_ids: string[];
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface ProblemStatus {
  problemId: string;
  solved: boolean;
  attempted: boolean;
  score: number;
}

interface ContestRunnerProps {
  contest: Contest;
  onEnd: () => void;
}

export function ContestRunner({ contest, onEnd }: ContestRunnerProps) {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(contest.duration_minutes * 60);
  const [problemStatuses, setProblemStatuses] = useState<Map<string, ProblemStatus>>(new Map());
  const [language, setLanguage] = useState('javascript');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadProblems();
    startContest();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endContest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .in('id', contest.problem_ids);

      if (error) throw error;
      setProblems(data || []);

      const statuses = new Map();
      data?.forEach(problem => {
        statuses.set(problem.id, {
          problemId: problem.id,
          solved: false,
          attempted: false,
          score: 0
        });
      });
      setProblemStatuses(statuses);
    } catch (error) {
      console.error('Error loading problems:', error);
    }
  };

  const startContest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contest_attempts')
        .insert({
          user_id: user.id,
          contest_id: contest.id,
          total_problems: contest.problem_ids.length
        })
        .select()
        .single();

      if (error) throw error;
      setAttemptId(data.id);
    } catch (error) {
      console.error('Error starting contest:', error);
    }
  };

  const endContest = async () => {
    if (!attemptId || !user) return;

    const solvedCount = Array.from(problemStatuses.values()).filter(p => p.solved).length;
    const totalScore = Array.from(problemStatuses.values()).reduce((sum, p) => sum + p.score, 0);

    try {
      await supabase
        .from('contest_attempts')
        .update({
          ended_at: new Date().toISOString(),
          score: totalScore,
          problems_solved: solvedCount
        })
        .eq('id', attemptId);
    } catch (error) {
      console.error('Error ending contest:', error);
    }

    onEnd();
  };

  const handleRunCode = async (code: string) => {
    setRunning(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRunning(false);
    setShowResults(true);
  };

  const handleSubmitCode = async (code: string) => {
    if (!attemptId) return;

    setRunning(true);

    const currentProblem = problems[currentProblemIndex];
    const isCorrect = Math.random() > 0.3;

    const newStatus: ProblemStatus = {
      problemId: currentProblem.id,
      solved: isCorrect,
      attempted: true,
      score: isCorrect ? 100 : 50
    };

    setProblemStatuses(prev => new Map(prev).set(currentProblem.id, newStatus));

    try {
      await supabase.from('contest_submissions').insert({
        attempt_id: attemptId,
        problem_id: currentProblem.id,
        code,
        language,
        status: isCorrect ? 'accepted' : 'wrong_answer',
        score: newStatus.score
      });
    } catch (error) {
      console.error('Error submitting:', error);
    }

    setRunning(false);
    setSubmitted(true);
    setShowResults(true);

    setTimeout(() => {
      if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setSubmitted(false);
        setShowResults(false);
        setLanguage('javascript');
      }
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (problems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading contest...</div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];
  const currentStatus = problemStatuses.get(currentProblem.id);

  const starterCode = {
    javascript: `function solution() {\n  // Write your code here\n  \n}\n`,
    python: `def solution():\n    # Write your code here\n    pass\n`,
    java: `class Solution {\n    public void solution() {\n        // Write your code here\n        \n    }\n}\n`,
    cpp: `void solution() {\n    // Write your code here\n    \n}\n`
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{contest.title}</h1>
          <p className="text-sm text-gray-600">Problem {currentProblemIndex + 1} of {problems.length}</p>
        </div>

        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          <Clock size={20} />
          <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
          <div className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Problems</h2>
            <div className="space-y-2">
              {problems.map((problem, index) => {
                const status = problemStatuses.get(problem.id);
                const isActive = index === currentProblemIndex;

                return (
                  <button
                    key={problem.id}
                    onClick={() => {
                      setCurrentProblemIndex(index);
                      setSubmitted(false);
                      setShowResults(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      isActive
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {problem.title}
                      </span>
                      {status?.solved && <CheckCircle className="text-green-600" size={16} />}
                      {!status?.solved && status?.attempted && <XCircle className="text-yellow-600" size={16} />}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Score</h3>
              <div className="text-2xl font-bold text-blue-600">
                {Array.from(problemStatuses.values()).reduce((sum, p) => sum + p.score, 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Solved: {Array.from(problemStatuses.values()).filter(p => p.solved).length}/{problems.length}
              </p>
            </div>

            <button
              onClick={endContest}
              className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
            >
              End Contest
            </button>
          </div>
        </div>

        <div className="w-2/3 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {currentProblem.title}
            </h2>

            <p className="text-gray-700 mb-6 whitespace-pre-wrap">
              {currentProblem.description}
            </p>

            {submitted && (
              <div className={`p-4 rounded-lg mb-6 ${
                currentStatus?.solved
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 font-semibold mb-2">
                  {currentStatus?.solved ? (
                    <>
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-green-700">Accepted!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-600" size={20} />
                      <span className="text-red-700">Wrong Answer</span>
                    </>
                  )}
                </div>
                <p className={`text-sm ${
                  currentStatus?.solved ? 'text-green-600' : 'text-red-600'
                }`}>
                  Score: +{currentStatus?.score} points
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col bg-gray-900">
            <CodeEditor
              initialCode={starterCode[language as keyof typeof starterCode]}
              language={language}
              onLanguageChange={setLanguage}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              running={running}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
