import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, X, Lightbulb } from "lucide-react";
import localdb from "../lib/localdb";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  id: string;
  content: string;
  messageType: "user" | "assistant";
  hintLevel: number;
  timestamp: Date;
}

interface ChatbotProps {
  problemId: string | number;
  problemTitle: string;
}

export function Chatbot({ problemId, problemTitle }: ChatbotProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hintLevel, setHintLevel] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory();
    }
  }, [isOpen, user, String(problemId)]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const data = await localdb.getChatMessages(user!.id, problemId);
      const mappedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.message_type || msg.messageType || 'assistant',
        hintLevel: msg.hint_level || msg.hintLevel || 0,
        timestamp: new Date(msg.created_at || msg.timestamp),
      }));

      setMessages(mappedMessages);

      const maxHintLevel = Math.max(0, ...mappedMessages.map((m) => m.hintLevel));
      setHintLevel(maxHintLevel || 0);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  // 🧠 Generate hints (only 3 per problem)
  const generateHint = (level: number): string => {
    const hintSets: { [key: string]: string[] } = {
      "Two Sum": [
        "Hint 1️⃣: Think about how you can find two numbers that sum up to the target efficiently.",
        "Hint 2️⃣: Can you use a data structure to store previously seen numbers and check for the complement?",
        "Hint 3️⃣: Try using a hash map where key = number, value = index to find the pair in one pass.",
      ],
      "Reverse Linked List": [
        "Hint 1️⃣: What happens if you reverse the pointers one by one?",
        "Hint 2️⃣: Try keeping track of previous, current, and next nodes during iteration.",
        "Hint 3️⃣: Update the current node's next pointer to previous node, then move forward.",
      ],
      "Valid Parentheses": [
        "Hint 1️⃣: Think about what data structure helps with matching opening and closing symbols.",
        "Hint 2️⃣: Push opening brackets to a stack and pop when a matching closing one appears.",
        "Hint 3️⃣: The string is valid if the stack is empty at the end.",
      ],
    };

    const defaultHints = [
      "Hint 1️⃣: Try breaking down the problem into smaller steps.",
      "Hint 2️⃣: Think about which data structure can optimize your solution.",
      "Hint 3️⃣: Focus on edge cases and efficiency — now you’re close!",
    ];

    const hints = hintSets[problemTitle] || defaultHints;
    return hints[level - 1] || "You've received all hints for this problem. Time to code it yourself! 🚀";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      await localdb.insertChatMessage({
        user_id: user.id,
        problem_id: problemId,
        message_type: "user",
        content: userMessage,
        hint_level: 0,
        created_at: new Date().toISOString()
      });

      const newUserMessage: Message = {
        id: Date.now().toString(),
        content: userMessage,
        messageType: "user",
        hintLevel: 0,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newUserMessage]);

      let assistantResponse = "";
      let newHintLevel = hintLevel;

      const lowerInput = userMessage.toLowerCase();

      if (lowerInput.includes("hint") || lowerInput.includes("help")) {
        newHintLevel = Math.min(hintLevel + 1, 3);
        setHintLevel(newHintLevel);
        assistantResponse = generateHint(newHintLevel);
      } else if (lowerInput.includes("solution") || lowerInput.includes("code")) {
        assistantResponse =
          "Sorry, I can only provide hints — not the complete solution. Try applying the hints you’ve received! 💡";
      } else {
        assistantResponse =
          "I can only give you problem-solving hints. Try asking for a hint like 'Give me a hint for this problem'.";
      }

      await localdb.insertChatMessage({
        user_id: user.id,
        problem_id: problemId,
        message_type: "assistant",
        content: assistantResponse,
        hint_level: newHintLevel,
        created_at: new Date().toISOString()
      });

      const newAssistantMessage: Message = {
        id: Date.now().toString() + "_asst",
        content: assistantResponse,
        messageType: "assistant",
        hintLevel: newHintLevel,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 hover:scale-110 transition-transform z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[450px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb size={20} />
              <div>
                <h3 className="font-semibold">CodeArena Hints Bot</h3>
                <p className="text-xs text-blue-100">
                  {hintLevel < 3
                    ? `Hints left: ${3 - hintLevel}`
                    : "All hints unlocked"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500 text-center">
                <div>
                  <MessageCircle size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Ask for hints related to <b>{problemTitle}</b>
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.messageType === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    message.messageType === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.messageType === "assistant" && message.hintLevel > 0 && (
                    <div className="text-xs mt-1 opacity-70 flex items-center space-x-1">
                      <Lightbulb size={12} />
                      <span>Hint Level: {message.hintLevel}/3</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask for a hint..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
