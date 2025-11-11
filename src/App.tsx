import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { ProblemList } from './components/ProblemList';
import { ProblemDetail } from './components/ProblemDetail';
import { Dashboard } from './components/Dashboard';
import { Discussion } from './components/Discussion';

function App() {
  const [currentView, setCurrentView] = useState<'problems' | 'problem-detail' | 'dashboard' | 'discussion'>('problems');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedProblemTitle, setSelectedProblemTitle] = useState<string>('');

  const handleProblemSelect = (problemId: string) => {
    setSelectedProblemId(problemId);
    setCurrentView('problem-detail');
  };

  const handleBackToProblems = () => {
    setSelectedProblemId(null);
    setCurrentView('problems');
  };

  const handleDiscussionOpen = () => {
    setCurrentView('discussion');
  };

  const handleBackToProblem = () => {
    setCurrentView('problem-detail');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {currentView !== 'problem-detail' && currentView !== 'discussion' && (
          <Navbar currentView={currentView} onViewChange={setCurrentView} />
        )}

        {currentView === 'problems' && (
          <ProblemList onProblemSelect={handleProblemSelect} />
        )}

        {currentView === 'problem-detail' && selectedProblemId && (
          <ProblemDetail
            problemId={selectedProblemId}
            onBack={handleBackToProblems}
            onDiscussionOpen={handleDiscussionOpen}
          />
        )}

        {currentView === 'dashboard' && <Dashboard />}

        {currentView === 'discussion' && selectedProblemId && (
          <Discussion
            problemId={selectedProblemId}
            problemTitle={selectedProblemTitle}
            onBack={handleBackToProblem}
          />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
