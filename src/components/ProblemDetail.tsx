import { useEffect, useState } from 'react';
import { ArrowLeft, ThumbsUp, MessageCircle, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import localdb from '../lib/localdb';
import ProctorPanel from './ProctorPanel';
import { useAuth } from '../contexts/AuthContext';
import { CodeEditor } from './CodeEditor';
import { Chatbot } from './Chatbot';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  likes: number;
}

interface Hint {
  id: string;
  hint_order: number;
  content: string;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual?: string;
  error?: string;
}

interface ProblemDetailProps {
  problemId: string | number;
  problemTitle?: string;
  onBack: () => void;
  onDiscussionOpen: () => void;
}

export function ProblemDetail({ problemId, problemTitle, onBack, onDiscussionOpen }: ProblemDetailProps) {
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'submissions'>('description');
  // Auto-enable proctor for exam mode when opening a problem
  const [proctorVisible, setProctorVisible] = useState(true);

  useEffect(() => {
    loadProblem();
    loadHints();
  }, [String(problemId)]);

  const loadProblem = async () => {
    try {
      const data = await localdb.getProblemById(problemId);
      setProblem(data as any);
    } catch (error) {
      console.error('Error loading problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHints = async () => {
    try {
      const data = await localdb.getHintsByProblemId(problemId);
      setHints(data || []);
    } catch (error) {
      console.error('Error loading hints:', error);
    }
  };

  const handleRun = async (_code: string) => {
    setRunning(true);
    setShowResults(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResults: TestResult[] = [
      {
        passed: true,
        input: '[2,7,11,15], target = 9',
        expected: '[0,1]',
        actual: '[0,1]'
      },
      {
        passed: true,
        input: '[3,2,4], target = 6',
        expected: '[1,2]',
        actual: '[1,2]'
      }
    ];

    setTestResults(mockResults);
    setRunning(false);
  };

  const handleSubmit = async (code: string) => {
    if (!user) {
      alert('Please sign in to submit solutions');
      return;
    }

    setRunning(true);
    setShowResults(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const allPassed = Math.random() > 0.3;
    const mockResults: TestResult[] = [
      {
        passed: true,
        input: '[2,7,11,15], target = 9',
        expected: '[0,1]',
        actual: '[0,1]'
      },
      {
        passed: allPassed,
        input: '[3,2,4], target = 6',
        expected: '[1,2]',
        actual: allPassed ? '[1,2]' : '[0,2]'
      }
    ];

    setTestResults(mockResults);

    try {
      await localdb.insertSubmission({
        user_id: user.id,
        problem_id: problemId,
        code,
        language,
        status: allPassed ? 'accepted' : 'wrong_answer',
        runtime_ms: Math.floor(Math.random() * 100) + 50,
        memory_kb: Math.floor(Math.random() * 1000) + 5000,
        test_cases_passed: allPassed ? 2 : 1,
        test_cases_total: 2,
        created_at: new Date().toISOString()
      });

      await localdb.upsertUserProgress({
        user_id: user.id,
        problem_id: problemId,
        status: allPassed ? 'solved' : 'attempted',
        attempts: 1,
        last_attempted_at: new Date().toISOString(),
        ...(allPassed && { solved_at: new Date().toISOString() })
      });
    } catch (error) {
      console.error('Error saving submission:', error);
    }

    setRunning(false);
  };

  const revealNextHint = () => {
    if (revealedHints < hints.length) {
      setRevealedHints(revealedHints + 1);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading problem...</div>
      </div>
    );
  }
  // If we don't have the full problem data locally but the app passed the
  // problem title (from the ProblemList click), use a minimal fallback
  // so the user can still open any listed problem.
  let displayProblem: Problem | null = problem;
  if (!loading && !problem && problemTitle) {
    displayProblem = {
      id: String(problemId),
      title: problemTitle,
      description: 'No detailed description available for this demo.',
      difficulty: 'easy',
      category: 'General',
      tags: [],
      likes: 0
    };
  }

  if (!loading && !displayProblem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-xl font-semibold text-gray-800 mb-4">Problem not found</div>
        <div className="text-gray-600 mb-6">We couldn't find the requested problem.</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Problems
        </button>
      </div>
    );
  }

  const dp = displayProblem as Problem;

  const starterCode = {
    javascript: `function solution(nums, target) {\n  // Write your code here\n  \n}\n`,
    python: `def solution(nums, target):\n    # Write your code here\n    pass\n`,
    java: `class Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your code here\n        \n    }\n}\n`,
    cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};\n`
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Back to Problems</span>
          </button>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
              <ThumbsUp size={18} />
              <span className="text-sm">{dp.likes}</span>
            </button>
            <button
              onClick={onDiscussionOpen}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
            >
              <MessageCircle size={18} />
              <span className="text-sm">Discuss</span>
            </button>
            <button
              onClick={() => setProctorVisible(!proctorVisible)}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
            >
              <span className="text-sm">{proctorVisible ? 'Hide Proctor' : 'Start Proctor'}</span>
            </button>
          </div>
        </div>
      </div>

      <Chatbot problemId={problemId} problemTitle={dp.title} />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              {(['description', 'hints', 'submissions'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {dp.title}
                </h1>

                <div className="flex items-center space-x-3 mb-6">
                  <span className={`font-medium ${getDifficultyColor(dp.difficulty)}`}>
                    {dp.difficulty.charAt(0).toUpperCase() + dp.difficulty.slice(1)}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">{dp.category}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {dp.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: dp.description.replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'hints' && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <Lightbulb className="text-yellow-500" />
                  <span>Hints</span>
                </h2>

                {hints.length === 0 ? (
                  <p className="text-gray-500">No hints available for this problem.</p>
                ) : (
                  <div className="space-y-4">
                    {hints.slice(0, revealedHints).map((hint, index) => (
                      <div key={hint.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-900 mb-2">
                          Hint {index + 1}
                        </div>
                        <p className="text-gray-700">{hint.content}</p>
                      </div>
                    ))}

                    {revealedHints < hints.length && (
                      <button
                        onClick={revealNextHint}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
                      >
                        Reveal Next Hint ({revealedHints + 1}/{hints.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Your Submissions</h2>
                {user ? (
                  <p className="text-gray-500">Your submission history will appear here.</p>
                ) : (
                  <p className="text-gray-500">Sign in to view your submissions.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1 flex flex-col">
            {proctorVisible && (
              <div className="h-96 overflow-hidden border-b border-gray-200">
                <ProctorPanel userId={user?.id} problemId={problemId} />
              </div>
            )}

            <CodeEditor
              initialCode={starterCode[language as keyof typeof starterCode]}
              language={language}
              onLanguageChange={setLanguage}
              onRun={handleRun}
              onSubmit={handleSubmit}
              running={running}
            />
          </div>

          {showResults && (
            <div className="h-64 border-t border-gray-200 overflow-y-auto bg-gray-50">
              <div className="p-4">
                <h3 className="font-semibold mb-3">Test Results</h3>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {result.passed ? (
                          <CheckCircle className="text-green-600" size={18} />
                        ) : (
                          <XCircle className="text-red-600" size={18} />
                        )}
                        <span className="font-medium">
                          Test Case {index + 1}
                        </span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-700">
                        <div>Input: {result.input}</div>
                        <div>Expected: {result.expected}</div>
                        {result.actual && <div>Output: {result.actual}</div>}
                        {result.error && (
                          <div className="text-red-600">Error: {result.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
