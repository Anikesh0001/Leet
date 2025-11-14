import { useEffect, useState } from 'react';
import { ArrowLeft, Filter, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import localdb from '../lib/localdb';
import { useAuth } from '../contexts/AuthContext';

interface Submission {
  id: string;
  problem_title: string;
  status: string;
  language: string;
  runtime_ms: number;
  memory_kb: number;
  test_cases_passed: number;
  test_cases_total: number;
  created_at: string;
  is_contest: boolean;
}

interface SubmissionsPageProps {
  onBack: () => void;
}

export function SubmissionsPage({ onBack }: SubmissionsPageProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'problems' | 'contests'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'accepted' | 'wrong_answer'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    if (user) {
      loadSubmissions();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortSubmissions();
  }, [submissions, filterType, filterStatus, sortBy]);

  const loadSubmissions = async () => {
    try {
      const subs = await localdb.getAllSubmissionsForUser(user!.id);
      const mapped: Submission[] = (subs || []).map((sub: any) => ({
        id: sub.id,
        problem_title: sub.problem_id || sub.problem_title || 'Unknown',
        status: sub.status,
        language: sub.language,
        runtime_ms: sub.runtime_ms || 0,
        memory_kb: sub.memory_kb || 0,
        test_cases_passed: sub.test_cases_passed || 0,
        test_cases_total: sub.test_cases_total || 0,
        created_at: sub.created_at,
        is_contest: false
      }));

      setSubmissions(mapped);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubmissions = () => {
    let result = [...submissions];

    if (filterType === 'problems') {
      result = result.filter(s => !s.is_contest);
    } else if (filterType === 'contests') {
      result = result.filter(s => s.is_contest);
    }

    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }

    if (sortBy === 'oldest') {
      result.reverse();
    }

    setFilteredSubmissions(result);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') {
      return <CheckCircle className="text-green-600" size={20} />;
    } else if (status === 'wrong_answer') {
      return <XCircle className="text-red-600" size={20} />;
    }
    return <AlertCircle className="text-yellow-600" size={20} />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'accepted') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'wrong_answer') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading submissions...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-600">Review your submission history and performance</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Filter size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Filters & Sort</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Submissions</option>
                <option value="problems">Problems Only</option>
                <option value="contests">Contests Only</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="wrong_answer">Wrong Answer</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Found</h3>
            <p className="text-gray-600">
              No submissions match your current filters. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map(submission => (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {submission.problem_title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(submission.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(submission.status)}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(submission.status)}`}
                      >
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Language</p>
                    <p className="font-medium text-gray-900 text-sm capitalize">
                      {submission.language}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Test Cases</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {submission.test_cases_passed}/{submission.test_cases_total}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Runtime</p>
                    <div className="flex items-center space-x-2">
                      <Zap size={14} className="text-orange-500" />
                      <p className="font-medium text-gray-900 text-sm">
                        {submission.runtime_ms}ms
                      </p>
                    </div>
                  </div>
                </div>

                {submission.memory_kb > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Memory: {submission.memory_kb.toLocaleString()} KB
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Accepted</p>
              <p className="text-2xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'accepted').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Wrong Answer</p>
              <p className="text-2xl font-bold text-red-600">
                {submissions.filter(s => s.status === 'wrong_answer').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {submissions.length > 0
                  ? Math.round(
                    (submissions.filter(s => s.status === 'accepted').length / submissions.length) *
                    100
                  )
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
