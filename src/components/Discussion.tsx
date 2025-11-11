import { useEffect, useState } from 'react';
import { ArrowLeft, ThumbsUp, MessageCircle, Send, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Discussion {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  is_solution: boolean;
  created_at: string;
  user_profiles: {
    username: string;
  };
}

interface DiscussionProps {
  problemId: string;
  problemTitle: string;
  onBack: () => void;
}

export function Discussion({ problemId, problemTitle, onBack }: DiscussionProps) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDiscussions();
  }, [problemId]);

  const loadDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          user_profiles:user_id (
            username
          )
        `)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to post');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('discussions').insert({
        problem_id: problemId,
        user_id: user.id,
        title: newTitle,
        content: newContent
      });

      if (error) throw error;

      setNewTitle('');
      setNewContent('');
      setShowNewPost(false);
      loadDiscussions();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (discussionId: string) => {
    if (!user) {
      alert('Please sign in to upvote');
      return;
    }

    const discussion = discussions.find(d => d.id === discussionId);
    if (!discussion) return;

    try {
      const { error } = await supabase
        .from('discussions')
        .update({ upvotes: discussion.upvotes + 1 })
        .eq('id', discussionId);

      if (error) throw error;
      loadDiscussions();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading discussions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft size={20} />
          <span>Back to Problem</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{problemTitle} - Discussion</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <MessageCircle size={20} />
            <span>{discussions.length} discussions</span>
          </div>
          {user && !showNewPost && (
            <button
              onClick={() => setShowNewPost(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              New Discussion
            </button>
          )}
        </div>

        {showNewPost && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">New Discussion</h2>
            <form onSubmit={handleSubmitPost}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's your question or insight?"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  placeholder="Share your thoughts..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>{submitting ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {discussions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No discussions yet
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to start a discussion about this problem!
            </p>
            {user && (
              <button
                onClick={() => setShowNewPost(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Start Discussion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map(discussion => (
              <div
                key={discussion.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                {discussion.is_solution && (
                  <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium mb-3">
                    <span>✓ Solution</span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {discussion.title}
                </h3>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {discussion.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User size={16} />
                      <span>{discussion.user_profiles?.username || 'Anonymous'}</span>
                    </div>
                    <span>
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpvote(discussion.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                  >
                    <ThumbsUp size={16} />
                    <span>{discussion.upvotes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
