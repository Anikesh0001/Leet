import { useState } from 'react';
import { Code2, User, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => onViewChange('problems')}
                className="flex items-center space-x-2 text-xl font-bold text-gray-900"
              >
                <Code2 size={28} className="text-blue-600" />
                <span>CodeArena</span>
              </button>

              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => onViewChange('problems')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentView === 'problems'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Problems
                </button>
                <button
                  onClick={() => onViewChange('contests')}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1 ${
                    currentView === 'contests'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Zap size={16} />
                  <span>Contests</span>
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => onViewChange('dashboard')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentView === 'dashboard'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => onViewChange('submissions')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentView === 'submissions'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      My Submissions
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onViewChange('profile')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <User size={20} />
                    <span className="hidden sm:inline text-sm font-medium">Profile</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <LogOut size={20} />
                    <span className="hidden sm:inline text-sm">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
