import { useEffect, useState } from "react";
import { CheckCircle, Circle, TrendingUp, Search, Filter } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Problem {
  id: string;
  title: string;
  slug?: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  acceptance_rate: number;
  likes: number;
}

interface ProblemListProps {
  onProblemSelect: (problemId: string | number, problemTitle?: string) => void;
}

export function ProblemList({ onProblemSelect }: ProblemListProps) {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    loadProblems();
    setLoading(false);
  }, []);

  const loadProblems = () => {
    const baseProblems: Problem[] = [
      // === ARRAY & HASHMAP ===
      { id: "1", title: "Two Sum", difficulty: "easy", category: "Array", tags: ["hashmap", "array"], acceptance_rate: 49.2, likes: 150 },
      { id: "2", title: "Best Time to Buy and Sell Stock", difficulty: "easy", category: "Array", tags: ["greedy", "dp"], acceptance_rate: 52.4, likes: 112 },
      { id: "3", title: "Contains Duplicate", difficulty: "easy", category: "Array", tags: ["hashset", "array"], acceptance_rate: 61.8, likes: 90 },
      { id: "4", title: "Product of Array Except Self", difficulty: "medium", category: "Array", tags: ["prefix-sum"], acceptance_rate: 48.2, likes: 188 },
      { id: "5", title: "Maximum Subarray", difficulty: "easy", category: "Array", tags: ["dp", "kadane"], acceptance_rate: 48.9, likes: 178 },
      { id: "6", title: "Merge Intervals", difficulty: "medium", category: "Array", tags: ["sorting", "intervals"], acceptance_rate: 48.5, likes: 134 },
      { id: "7", title: "Rotate Image", difficulty: "medium", category: "Matrix", tags: ["array", "rotation"], acceptance_rate: 55.7, likes: 102 },
      { id: "8", title: "Set Matrix Zeroes", difficulty: "medium", category: "Matrix", tags: ["matrix"], acceptance_rate: 46.5, likes: 89 },
      { id: "9", title: "Spiral Matrix", difficulty: "medium", category: "Matrix", tags: ["simulation"], acceptance_rate: 41.1, likes: 101 },
      { id: "10", title: "Jump Game", difficulty: "medium", category: "Array", tags: ["greedy"], acceptance_rate: 43.7, likes: 110 },

      // === STRINGS ===
      { id: "11", title: "Valid Palindrome", difficulty: "easy", category: "String", tags: ["two-pointers"], acceptance_rate: 55.3, likes: 97 },
      { id: "12", title: "Longest Substring Without Repeating Characters", difficulty: "medium", category: "String", tags: ["hashmap", "sliding-window"], acceptance_rate: 33.8, likes: 200 },
      { id: "13", title: "Group Anagrams", difficulty: "medium", category: "String", tags: ["hashmap", "sorting"], acceptance_rate: 43.9, likes: 96 },
      { id: "14", title: "Valid Anagram", difficulty: "easy", category: "String", tags: ["hashmap"], acceptance_rate: 55.1, likes: 75 },
      { id: "15", title: "Minimum Window Substring", difficulty: "hard", category: "String", tags: ["sliding-window"], acceptance_rate: 29.4, likes: 165 },
      { id: "16", title: "String to Integer (atoi)", difficulty: "medium", category: "String", tags: ["parsing"], acceptance_rate: 21.8, likes: 91 },
      { id: "17", title: "Longest Palindromic Substring", difficulty: "medium", category: "String", tags: ["dp", "expand-center"], acceptance_rate: 34.9, likes: 132 },
      { id: "18", title: "Zigzag Conversion", difficulty: "medium", category: "String", tags: ["simulation"], acceptance_rate: 45.0, likes: 78 },
      { id: "19", title: "Count and Say", difficulty: "easy", category: "String", tags: ["recursion"], acceptance_rate: 40.5, likes: 67 },
      { id: "20", title: "Roman to Integer", difficulty: "easy", category: "String", tags: ["hashmap"], acceptance_rate: 57.7, likes: 80 },

      // === LINKED LISTS ===
      { id: "21", title: "Add Two Numbers", difficulty: "medium", category: "Linked List", tags: ["math", "linked-list"], acceptance_rate: 38.7, likes: 120 },
      { id: "22", title: "Reverse Linked List", difficulty: "easy", category: "Linked List", tags: ["recursion"], acceptance_rate: 45.3, likes: 87 },
      { id: "23", title: "Merge Two Sorted Lists", difficulty: "easy", category: "Linked List", tags: ["two-pointers"], acceptance_rate: 59.2, likes: 99 },
      { id: "24", title: "Linked List Cycle", difficulty: "easy", category: "Linked List", tags: ["two-pointers"], acceptance_rate: 52.0, likes: 77 },
      { id: "25", title: "Reorder List", difficulty: "medium", category: "Linked List", tags: ["stack", "pointers"], acceptance_rate: 47.8, likes: 95 },

      // === STACK / QUEUE ===
      { id: "26", title: "Valid Parentheses", difficulty: "easy", category: "Stack", tags: ["stack"], acceptance_rate: 40.1, likes: 99 },
      { id: "27", title: "Min Stack", difficulty: "medium", category: "Stack", tags: ["stack"], acceptance_rate: 45.6, likes: 112 },
      { id: "28", title: "Evaluate Reverse Polish Notation", difficulty: "medium", category: "Stack", tags: ["stack"], acceptance_rate: 50.2, likes: 108 },
      { id: "29", title: "Daily Temperatures", difficulty: "medium", category: "Stack", tags: ["monotonic-stack"], acceptance_rate: 48.1, likes: 119 },
      { id: "30", title: "Simplify Path", difficulty: "medium", category: "Stack", tags: ["string", "stack"], acceptance_rate: 37.9, likes: 84 },

      // === TREES ===
      { id: "31", title: "Maximum Depth of Binary Tree", difficulty: "easy", category: "Tree", tags: ["dfs"], acceptance_rate: 71.4, likes: 143 },
      { id: "32", title: "Validate Binary Search Tree", difficulty: "medium", category: "Tree", tags: ["dfs"], acceptance_rate: 50.6, likes: 124 },
      { id: "33", title: "Symmetric Tree", difficulty: "easy", category: "Tree", tags: ["bfs", "recursion"], acceptance_rate: 55.8, likes: 101 },
      { id: "34", title: "Binary Tree Level Order Traversal", difficulty: "medium", category: "Tree", tags: ["bfs"], acceptance_rate: 54.5, likes: 109 },
      { id: "35", title: "Lowest Common Ancestor of BST", difficulty: "easy", category: "Tree", tags: ["dfs"], acceptance_rate: 63.9, likes: 116 },

      // === GRAPH ===
      { id: "36", title: "Number of Islands", difficulty: "medium", category: "Graph", tags: ["dfs", "matrix"], acceptance_rate: 41.8, likes: 147 },
      { id: "37", title: "Clone Graph", difficulty: "medium", category: "Graph", tags: ["dfs", "bfs"], acceptance_rate: 47.6, likes: 112 },
      { id: "38", title: "Course Schedule", difficulty: "medium", category: "Graph", tags: ["topo-sort"], acceptance_rate: 40.2, likes: 130 },
      { id: "39", title: "Word Ladder", difficulty: "hard", category: "Graph", tags: ["bfs"], acceptance_rate: 29.1, likes: 78 },
      { id: "40", title: "Pacific Atlantic Water Flow", difficulty: "medium", category: "Graph", tags: ["dfs", "matrix"], acceptance_rate: 42.0, likes: 106 },

      // === DYNAMIC PROGRAMMING ===
      { id: "41", title: "Climbing Stairs", difficulty: "easy", category: "Dynamic Programming", tags: ["dp", "math"], acceptance_rate: 53.9, likes: 122 },
      { id: "42", title: "House Robber", difficulty: "medium", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 45.2, likes: 110 },
      { id: "43", title: "Coin Change", difficulty: "medium", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 37.8, likes: 125 },
      { id: "44", title: "Longest Increasing Subsequence", difficulty: "medium", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 46.9, likes: 132 },
      { id: "45", title: "Edit Distance", difficulty: "hard", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 30.4, likes: 89 },
      { id: "46", title: "Unique Paths", difficulty: "medium", category: "Dynamic Programming", tags: ["dp", "combinatorics"], acceptance_rate: 58.1, likes: 114 },
      { id: "47", title: "Word Break", difficulty: "medium", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 42.6, likes: 111 },
      { id: "48", title: "Decode Ways", difficulty: "medium", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 38.7, likes: 95 },
      { id: "49", title: "Best Time to Buy and Sell Stock with Cooldown", difficulty: "medium", category: "Dynamic Programming", tags: ["dp"], acceptance_rate: 43.9, likes: 98 },
      { id: "50", title: "Partition Equal Subset Sum", difficulty: "medium", category: "Dynamic Programming", tags: ["dp", "subset-sum"], acceptance_rate: 40.0, likes: 87 },

      // === SEARCH & SORT ===
      { id: "51", title: "Search in Rotated Sorted Array", difficulty: "medium", category: "Binary Search", tags: ["binary-search"], acceptance_rate: 37.8, likes: 109 },
      { id: "52", title: "Find Minimum in Rotated Sorted Array", difficulty: "medium", category: "Binary Search", tags: ["binary-search"], acceptance_rate: 45.2, likes: 95 },
      { id: "53", title: "Kth Largest Element in an Array", difficulty: "medium", category: "Heap", tags: ["heap", "sorting"], acceptance_rate: 53.4, likes: 108 },
      { id: "54", title: "Top K Frequent Elements", difficulty: "medium", category: "Heap", tags: ["heap", "hashmap"], acceptance_rate: 58.5, likes: 112 },
      { id: "55", title: "Merge K Sorted Lists", difficulty: "hard", category: "Heap", tags: ["linked-list", "heap"], acceptance_rate: 40.3, likes: 99 },

      // === MATH & MISC ===
      { id: "56", title: "Pow(x, n)", difficulty: "medium", category: "Math", tags: ["divide-conquer"], acceptance_rate: 32.4, likes: 88 },
      { id: "57", title: "Sqrt(x)", difficulty: "easy", category: "Math", tags: ["binary-search"], acceptance_rate: 41.3, likes: 76 },
      { id: "58", title: "Divide Two Integers", difficulty: "medium", category: "Math", tags: ["bit-manipulation"], acceptance_rate: 17.5, likes: 70 },
      { id: "59", title: "Factorial Trailing Zeroes", difficulty: "medium", category: "Math", tags: ["math"], acceptance_rate: 43.2, likes: 68 },
      { id: "60", title: "Excel Sheet Column Number", difficulty: "easy", category: "Math", tags: ["math"], acceptance_rate: 58.1, likes: 83 },
      { id: "61", title: "Majority Element", difficulty: "easy", category: "Array", tags: ["counting"], acceptance_rate: 61.9, likes: 97 },
      { id: "62", title: "Missing Number", difficulty: "easy", category: "Array", tags: ["math", "xor"], acceptance_rate: 53.3, likes: 90 },
      { id: "63", title: "Sum of Two Integers", difficulty: "medium", category: "Bit Manipulation", tags: ["bitwise"], acceptance_rate: 50.5, likes: 99 },
      { id: "64", title: "Number of 1 Bits", difficulty: "easy", category: "Bit Manipulation", tags: ["bitwise"], acceptance_rate: 59.0, likes: 92 },
      { id: "65", title: "Reverse Bits", difficulty: "easy", category: "Bit Manipulation", tags: ["bitwise"], acceptance_rate: 51.1, likes: 85 },
    ];

    setProblems(baseProblems);
  };

  const categories = ["all", ...new Set(problems.map((p) => p.category))];

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesDifficulty =
      difficultyFilter === "all" || problem.difficulty === difficultyFilter;
    const matchesCategory =
      categoryFilter === "all" || problem.category === categoryFilter;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (problemId: string | number) => {
    const status = userProgress.get(String(problemId));
    if (status === "solved") {
      return <CheckCircle className="text-green-500" size={20} />;
    } else if (status === "attempted") {
      return <Circle className="text-yellow-500" size={20} />;
    }
    return <Circle className="text-gray-300" size={20} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading problems...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Problems
        </h1>
        <p className="text-gray-600">
          Master algorithms and data structures
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acceptance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProblems.map((problem) => (
                <tr
                  key={problem.id}
                  onClick={() => onProblemSelect(problem.id, problem.title)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user && getStatusIcon(problem.id)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 hover:text-blue-600">
                        {problem.title}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty.charAt(0).toUpperCase() +
                        problem.difficulty.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {problem.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <TrendingUp size={16} />
                      <span>{problem.acceptance_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No problems found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}
