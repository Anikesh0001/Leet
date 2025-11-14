import { Clock, Award, Zap } from 'lucide-react';

interface ContestCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  maxScore: number;
  problemCount: number;
  onStart: (contestId: string) => void;
}

export function ContestCard({
  id,
  title,
  description,
  difficulty,
  durationMinutes,
  maxScore,
  problemCount,
  onStart
}: ContestCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(difficulty)}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-gray-200">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-semibold text-gray-900">{durationMinutes} min</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Award size={16} className="text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Max Score</p>
            <p className="text-sm font-semibold text-gray-900">{maxScore} pts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Zap size={16} className="text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">Problems</p>
            <p className="text-sm font-semibold text-gray-900">{problemCount}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onStart(id)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
      >
        Start Contest
      </button>
    </div>
  );
}
