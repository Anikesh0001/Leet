import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, X, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  messageType: 'user' | 'assistant';
  hintLevel: number;
  timestamp: Date;
}

interface ChatbotProps {
  problemId: string;
  problemTitle: string;
}

export function Chatbot({ problemId, problemTitle }: ChatbotProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hintLevel, setHintLevel] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory();
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user?.id)
        .eq('problem_id', problemId)
        .order('created_at');

      if (error) throw error;

      const mappedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.message_type,
        hintLevel: msg.hint_level,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(mappedMessages);

      const maxHintLevel = Math.max(0, ...mappedMessages.map(m => m.hintLevel));
      setHintLevel(maxHintLevel);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const generateHint = (level: number): string => {
    const hints: { [key: number]: string } = {
      1: 'Consider the data structure needed. What structure helps you quickly lookup elements?',
      2: 'Think about using a hash map or object to store elements and their indices.',
      3: 'As you iterate through the array, store each element in a map. When you find the target difference, return the indices.'
    };
    return hints[level] || 'Feel free to ask me another question about this problem.';
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        problem_id: problemId,
        message_type: 'user',
        content: userMessage,
        hint_level: 0
      });

      const newUserMessage: Message = {
        id: Date.now().toString(),
        content: userMessage,
        messageType: 'user',
        hintLevel: 0,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newUserMessage]);

      let assistantResponse = '';
      let newHintLevel = hintLevel;

      const lowerInput = userMessage.toLowerCase();

      if (lowerInput.includes('hint') || lowerInput.includes('help') || lowerInput.includes('stuck')) {
        newHintLevel = Math.min(hintLevel + 1, 3);
        setHintLevel(newHintLevel);
        assistantResponse = `Here's hint ${newHintLevel}: ${generateHint(newHintLevel)}`;
      } else if (lowerInput.includes('approach') || lowerInput.includes('how') || lowerInput.includes('solve')) {
        assistantResponse = `Here's my advice for ${problemTitle}:\n\n1. Identify what data structure would be most efficient\n2. Think about the time complexity requirement\n3. Consider edge cases\n4. Write clean, readable code first\n5. Test with provided examples\n\nWould you like a hint to get started?`;
      } else if (lowerInput.includes('time complexity') || lowerInput.includes('space complexity')) {
        assistantResponse = 'Good question! Aim for O(n) time complexity using a hash map for this problem. Space complexity would also be O(n). This is optimal for most LeetCode-style problems. Would you like a hint on the approach?';
      } else if (lowerInput.includes('example') || lowerInput.includes('test case')) {
        assistantResponse = 'Let\'s work through the first example:\nInput: nums = [2,7,11,15], target = 9\n\nWe need to find two numbers that add up to 9.\n- 2 + 7 = 9 ✓\n- These are at indices 0 and 1\n\nSo the answer is [0, 1]. Does this help clarify the problem?';
      } else if (lowerInput.includes('thank') || lowerInput.includes('thanks') || lowerInput.includes('great')) {
        assistantResponse = 'You\'re welcome! Keep practicing and you\'ll master these problems in no time. Good luck with your solution!';
      } else {
        assistantResponse = `That's a great question about ${problemTitle}! Here are some thoughts:\n\n- Break down the problem into smaller steps\n- Consider what data structure would help\n- Think about edge cases\n- Start with a brute force solution, then optimize\n\nFeel free to ask for hints or specific guidance!`;
      }

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        problem_id: problemId,
        message_type: 'assistant',
        content: assistantResponse,
        hint_level: newHintLevel
      });

      const newAssistantMessage: Message = {
        id: Date.now().toString() + '_asst',
        content: assistantResponse,
        messageType: 'assistant',
        hintLevel: newHintLevel,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 hover:scale-110 transition-transform z-40"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-40">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb size={20} />
              <div>
                <h3 className="font-semibold">CodeArena Helper</h3>
                <p className="text-xs text-blue-100">Hints available: {3 - hintLevel}/3</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-gray-500">
                <div>
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ask me for hints or help with {problemTitle}</p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.messageType === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.messageType === 'assistant' && message.hintLevel > 0 && (
                    <div className="text-xs mt-1 opacity-75 flex items-center space-x-1">
                      <Lightbulb size={12} />
                      <span>Hint level: {message.hintLevel}/3</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask for a hint..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
