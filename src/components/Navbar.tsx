import { useState } from "react";
import { Code2, User, LogOut, Zap, Edit2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import localdb from "../lib/localdb";

import React from "react";

type Views =
  | "problems"
  | "problem-detail"
  | "dashboard"
  | "discussion"
  | "contests"
  | "submissions"
  | "admin"
  | "admin-login";

interface NavbarProps {
  currentView: string;
  onViewChange: React.Dispatch<React.SetStateAction<Views>>;
}

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || user?.user_metadata?.name || "User",
    email: user?.email || "user@example.com",
    github: "https://github.com/user",
    about: "Software Engineer",
  });

  const handleSaveProfile = async () => {
    try {
      await localdb.saveUserProfile({
        id: user?.id,
        name: profileData.name,
        email: profileData.email,
        github: profileData.github,
        about: profileData.about,
      });
      alert("✅ Profile updated successfully!");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("❌ Failed to update profile.");
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section: Logo and navigation */}
            <div className="flex items-center space-x-8">
              <button
                onClick={() => onViewChange("problems")}
                className="flex items-center space-x-2 text-xl font-bold text-gray-900"
              >
                <Code2 size={28} className="text-blue-600" />
                <span>CodeArena</span>
              </button>

              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => onViewChange("problems")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentView === "problems"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Problems
                </button>
                <button
                  onClick={() => onViewChange("contests")}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1 ${
                    currentView === "contests"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Zap size={16} />
                  <span>Contests</span>
                </button>
                <button
                  onClick={() => onViewChange((user && (user as any).is_admin) ? "admin" : "admin-login")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentView === "admin" || currentView === "admin-login"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Admin
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => onViewChange("dashboard")}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentView === "dashboard"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Dashboard
                    </button>
                    {user.is_admin && (
                      <button
                        onClick={() => onViewChange("admin")}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          currentView === "admin"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Admin
                      </button>
                    )}
                    <button
                      onClick={() => onViewChange("submissions")}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentView === "submissions"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      My Submissions
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right section: Profile and Sign out */}
            <div className="flex items-center space-x-4 relative">
              {user ? (
                <>
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <User size={20} />
                    <span className="hidden sm:inline text-sm font-medium">
                      Profile
                    </span>
                  </button>

                  <button
                    onClick={signOut}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <LogOut size={20} />
                    <span className="hidden sm:inline text-sm">Sign Out</span>
                  </button>

                  {/* Profile Dropdown */}
                  {showProfile && (
                    <div className="absolute top-12 right-0 w-80 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          My Profile
                        </h3>
                        <button
                          onClick={() => setShowProfile(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {!editing ? (
                        <>
                          <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                              {profileData.name.charAt(0)}
                            </div>
                            <h3 className="mt-2 text-lg font-semibold text-gray-900">
                              {profileData.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {profileData.email}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {profileData.about}
                          </p>
                          <p className="text-sm text-blue-600 break-all">
                            <a
                              href={profileData.github}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {profileData.github}
                            </a>
                          </p>
                          <button
                            onClick={() => setEditing(true)}
                            className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex justify-center items-center space-x-1"
                          >
                            <Edit2 size={16} />
                            <span>Edit Profile</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <h4 className="text-md font-medium mb-2">
                            Edit Profile
                          </h4>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                name: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
                            placeholder="Your Name"
                          />
                          <input
                            type="text"
                            value={profileData.github}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                github: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
                            placeholder="GitHub URL"
                          />
                          <textarea
                            value={profileData.about}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                about: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
                            placeholder="About you..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveProfile}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditing(false)}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
