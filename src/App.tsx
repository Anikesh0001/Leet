import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProblemList } from "./components/ProblemList";
import { ProblemDetail } from "./components/ProblemDetail";
import { Dashboard } from "./components/Dashboard";
import { Discussion } from "./components/Discussion";
import { ContestPage } from "./components/ContestPage";
import { SubmissionsPage } from "./components/SubmissionsPage";
import { Chatbot } from "./components/Chatbot";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";

function App() {
  const [currentView, setCurrentView] = useState<
    | "problems"
    | "problem-detail"
    | "dashboard"
    | "discussion"
    | "contests"
    | "submissions"
    | "admin"
    | "admin-login"
  >("problems");

  const [selectedProblemId, setSelectedProblemId] = useState<string | number | null>(null);
  const [selectedProblemTitle, setSelectedProblemTitle] = useState<string>("");

  const handleProblemSelect = (problemId: string | number, problemTitle?: string) => {
    setSelectedProblemId(problemId);
    if (problemTitle) setSelectedProblemTitle(problemTitle);
    setCurrentView("problem-detail");
  };

  const handleBackToProblems = () => {
    setSelectedProblemId(null);
    setSelectedProblemTitle("");
    setCurrentView("problems");
  };

  const handleDiscussionOpen = () => {
    setCurrentView("discussion");
  };

  const handleBackToProblem = () => {
    setCurrentView("problem-detail");
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative">
        {/* Navbar - hide for detail, discussion, and admin views */}
        {currentView !== "problem-detail" && currentView !== "discussion" && currentView !== "admin" && currentView !== "admin-login" && (
          <div className="sticky top-0 z-40 shadow-sm">
            <Navbar currentView={currentView} onViewChange={setCurrentView} />
          </div>
        )}

        {/* Problems Page */}
        {currentView === "problems" && (
          <div className="animate-fadeInUp">
            <ProblemList onProblemSelect={handleProblemSelect} />
          </div>
        )}

        {/* Problem Detail Page */}
        {currentView === "problem-detail" && selectedProblemId && (
          <div className="animate-fadeInUp">
            <ProblemDetail
              problemId={selectedProblemId}
              problemTitle={selectedProblemTitle}
              onBack={handleBackToProblems}
              onDiscussionOpen={handleDiscussionOpen}
            />
            {/* Floating Chatbot for Hints */}
            <Chatbot
              problemId={selectedProblemId}
              problemTitle={selectedProblemTitle || "Unknown Problem"}
            />
          </div>
        )}

        {/* Dashboard Page */}
        {currentView === "dashboard" && (
          <div className="p-4 animate-fadeInUp">
            <Dashboard />
          </div>
        )}

        {/* Contest Page */}
        {currentView === "contests" && (
          <div className="p-4 animate-fadeInUp">
            <ContestPage onBack={() => setCurrentView("problems")} />
          </div>
        )}

        {/* Submissions Page */}
        {currentView === "submissions" && (
          <div className="p-4 animate-fadeInUp">
            <SubmissionsPage onBack={() => setCurrentView("dashboard")} />
          </div>
        )}

        {/* Discussion Page */}
        {currentView === "discussion" && selectedProblemId && (
          <div className="p-4 animate-fadeInUp">
            <Discussion
              problemId={selectedProblemId}
              problemTitle={selectedProblemTitle}
              onBack={handleBackToProblem}
            />
          </div>
        )}

        {/* Admin Page */}
        {currentView === "admin" && (
          <div className="p-4 animate-fadeInUp">
            <AdminPanel />
          </div>
        )}
        {/* Admin Login Page */}
        {currentView === "admin-login" && (
          <div className="p-4 animate-fadeInUp">
            <AdminLogin onSuccess={() => setCurrentView('admin')} />
          </div>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
