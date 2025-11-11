import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  initialCode?: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  onRun: (code: string) => void;
  onSubmit: (code: string) => void;
  running?: boolean;
}

export function CodeEditor({
  initialCode = '',
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  running = false
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
  ];

  const handleReset = () => {
    setCode(initialCode);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-gray-900 text-gray-100"
          spellCheck="false"
          placeholder="Write your code here..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 p-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => onRun(code)}
          disabled={running}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Play size={16} />
          <span>{running ? 'Running...' : 'Run'}</span>
        </button>
        <button
          onClick={() => onSubmit(code)}
          disabled={running}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
