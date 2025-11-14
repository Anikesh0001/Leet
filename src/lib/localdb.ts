// Lightweight local data layer backed by localStorage for demo purposes
// Provides a minimal API used across components so the app runs without Supabase.

type Problem = {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  difficulty: 'easy'|'medium'|'hard';
  category: string;
  tags: string[];
  acceptance_rate?: number;
  likes?: number;
};

type Hint = { id: string; hint_order: number; content: string; problem_id: string };

type Submission = any;

const STORAGE_KEYS = {
  SUBMISSIONS: 'leet_submissions',
  USER_PROGRESS: 'leet_user_progress',
  CHAT: 'leet_chat_messages',
  CONTEST_ATTEMPTS: 'leet_contest_attempts',
  CONTEST_SUBMISSIONS: 'leet_contest_submissions',
  DISCUSSIONS: 'leet_discussions',
  USER_PROFILES: 'leet_user_profiles',
  DETECTION_LOGS: 'leet_detection_logs'
};

const BASE_PROBLEMS: Problem[] = [
  { id: '1', title: 'Two Sum', difficulty: 'easy', category: 'Array', tags: ['hashmap', 'array'], acceptance_rate: 49.2, likes: 150, description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.' },
  { id: '2', title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', category: 'Array', tags: ['greedy', 'dp'], acceptance_rate: 52.4, likes: 112, description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve.' },
  { id: '3', title: 'Contains Duplicate', difficulty: 'easy', category: 'Array', tags: ['hashset', 'array'], acceptance_rate: 61.8, likes: 90, description: 'Given an integer array nums, return true if any value appears at least twice in the array.' },
  { id: '4', title: 'Product of Array Except Self', difficulty: 'medium', category: 'Array', tags: ['prefix-sum'], acceptance_rate: 48.2, likes: 188, description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].' },
  { id: '5', title: 'Maximum Subarray', difficulty: 'easy', category: 'Array', tags: ['dp', 'kadane'], acceptance_rate: 48.9, likes: 178, description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.' },
  { id: '6', title: 'Merge Intervals', difficulty: 'medium', category: 'Array', tags: ['sorting', 'intervals'], acceptance_rate: 48.5, likes: 134, description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.' },
  { id: '7', title: 'Rotate Image', difficulty: 'medium', category: 'Matrix', tags: ['array', 'rotation'], acceptance_rate: 55.7, likes: 102, description: 'You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees (clockwise).' },
  { id: '8', title: 'Set Matrix Zeroes', difficulty: 'medium', category: 'Matrix', tags: ['matrix'], acceptance_rate: 46.5, likes: 89, description: 'Given an m x n matrix, if an element is 0, set its entire row and column to 0.' },
  { id: '9', title: 'Spiral Matrix', difficulty: 'medium', category: 'Matrix', tags: ['simulation'], acceptance_rate: 41.1, likes: 101, description: 'Given an m x n matrix, return all elements of the matrix in spiral order.' },
  { id: '10', title: 'Jump Game', difficulty: 'medium', category: 'Array', tags: ['greedy'], acceptance_rate: 43.7, likes: 110, description: 'Given an array of non-negative integers, you are initially positioned at the first index of the array. Determine if you are able to reach the last index.' },

  { id: '11', title: 'Valid Palindrome', difficulty: 'easy', category: 'String', tags: ['two-pointers'], acceptance_rate: 55.3, likes: 97, description: 'Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.' },
  { id: '12', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', category: 'String', tags: ['hashmap', 'sliding-window'], acceptance_rate: 33.8, likes: 200, description: 'Given a string s, find the length of the longest substring without repeating characters.' },
  { id: '13', title: 'Group Anagrams', difficulty: 'medium', category: 'String', tags: ['hashmap', 'sorting'], acceptance_rate: 43.9, likes: 96, description: 'Group the anagrams together from a list of strings.' },
  { id: '14', title: 'Valid Anagram', difficulty: 'easy', category: 'String', tags: ['hashmap'], acceptance_rate: 55.1, likes: 75, description: 'Given two strings, determine if the second is an anagram of the first.' },
  { id: '15', title: 'Minimum Window Substring', difficulty: 'hard', category: 'String', tags: ['sliding-window'], acceptance_rate: 29.4, likes: 165, description: 'Given strings s and t, return the minimum window in s which will contain all the characters in t.' },
  { id: '16', title: 'String to Integer (atoi)', difficulty: 'medium', category: 'String', tags: ['parsing'], acceptance_rate: 21.8, likes: 91, description: 'Implement atoi which converts a string to an integer.' },
  { id: '17', title: 'Longest Palindromic Substring', difficulty: 'medium', category: 'String', tags: ['dp', 'expand-center'], acceptance_rate: 34.9, likes: 132, description: 'Given a string s, return the longest palindromic substring in s.' },
  { id: '18', title: 'Zigzag Conversion', difficulty: 'medium', category: 'String', tags: ['simulation'], acceptance_rate: 45.0, likes: 78, description: 'Convert a string to a zigzag pattern on a given number of rows.' },
  { id: '19', title: 'Count and Say', difficulty: 'easy', category: 'String', tags: ['recursion'], acceptance_rate: 40.5, likes: 67, description: 'Given an integer n, return the nth term of the count-and-say sequence.' },
  { id: '20', title: 'Roman to Integer', difficulty: 'easy', category: 'String', tags: ['hashmap'], acceptance_rate: 57.7, likes: 80, description: 'Convert a Roman numeral to an integer.' },

  { id: '21', title: 'Add Two Numbers', difficulty: 'medium', category: 'Linked List', tags: ['math', 'linked-list'], acceptance_rate: 38.7, likes: 120, description: 'Add two numbers represented by linked lists and return the sum as a linked list.' },
  { id: '22', title: 'Reverse Linked List', difficulty: 'easy', category: 'Linked List', tags: ['recursion'], acceptance_rate: 45.3, likes: 87, description: 'Reverse a singly linked list.' },
  { id: '23', title: 'Merge Two Sorted Lists', difficulty: 'easy', category: 'Linked List', tags: ['two-pointers'], acceptance_rate: 59.2, likes: 99, description: 'Merge two sorted linked lists and return it as a sorted list.' },
  { id: '24', title: 'Linked List Cycle', difficulty: 'easy', category: 'Linked List', tags: ['two-pointers'], acceptance_rate: 52.0, likes: 77, description: 'Detect if a linked list has a cycle in it.' },
  { id: '25', title: 'Reorder List', difficulty: 'medium', category: 'Linked List', tags: ['stack', 'pointers'], acceptance_rate: 47.8, likes: 95, description: 'Reorder a list in a specific pattern without altering node values.' },

  { id: '26', title: 'Valid Parentheses', difficulty: 'easy', category: 'Stack', tags: ['stack'], acceptance_rate: 40.1, likes: 99, description: 'Given a string containing parentheses, determine if it is valid.' },
  { id: '27', title: 'Min Stack', difficulty: 'medium', category: 'Stack', tags: ['stack'], acceptance_rate: 45.6, likes: 112, description: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.' },
  { id: '28', title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', category: 'Stack', tags: ['stack'], acceptance_rate: 50.2, likes: 108, description: 'Evaluate the value of an arithmetic expression in Reverse Polish Notation.' },
  { id: '29', title: 'Daily Temperatures', difficulty: 'medium', category: 'Stack', tags: ['monotonic-stack'], acceptance_rate: 48.1, likes: 119, description: 'Given daily temperatures, return an array such that for each day you know how many days to wait until a warmer temperature.' },
  { id: '30', title: 'Simplify Path', difficulty: 'medium', category: 'Stack', tags: ['string', 'stack'], acceptance_rate: 37.9, likes: 84, description: 'Simplify a Unix-style file path.' },

  { id: '31', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', category: 'Tree', tags: ['dfs'], acceptance_rate: 71.4, likes: 143, description: 'Given the root of a binary tree, return its maximum depth.' },
  { id: '32', title: 'Validate Binary Search Tree', difficulty: 'medium', category: 'Tree', tags: ['dfs'], acceptance_rate: 50.6, likes: 124, description: 'Determine if a binary tree is a valid binary search tree.' },
  { id: '33', title: 'Symmetric Tree', difficulty: 'easy', category: 'Tree', tags: ['bfs', 'recursion'], acceptance_rate: 55.8, likes: 101, description: 'Check whether a binary tree is symmetric around its center.' },
  { id: '34', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', category: 'Tree', tags: ['bfs'], acceptance_rate: 54.5, likes: 109, description: 'Return the level order traversal of a binary tree.' },
  { id: '35', title: 'Lowest Common Ancestor of BST', difficulty: 'easy', category: 'Tree', tags: ['dfs'], acceptance_rate: 63.9, likes: 116, description: 'Find the lowest common ancestor of two nodes in a BST.' },

  { id: '36', title: 'Number of Islands', difficulty: 'medium', category: 'Graph', tags: ['dfs', 'matrix'], acceptance_rate: 41.8, likes: 147, description: 'Given a 2D grid map of 1s (land) and 0s (water), count the number of islands.' },
  { id: '37', title: 'Clone Graph', difficulty: 'medium', category: 'Graph', tags: ['dfs', 'bfs'], acceptance_rate: 47.6, likes: 112, description: 'Clone an undirected graph.' },
  { id: '38', title: 'Course Schedule', difficulty: 'medium', category: 'Graph', tags: ['topo-sort'], acceptance_rate: 40.2, likes: 130, description: 'There are a total of numCourses you must take; determine if you can finish all courses given prerequisites.' },
  { id: '39', title: 'Word Ladder', difficulty: 'hard', category: 'Graph', tags: ['bfs'], acceptance_rate: 29.1, likes: 78, description: 'Given two words and a dictionary, return the length of shortest transformation sequence.' },
  { id: '40', title: 'Pacific Atlantic Water Flow', difficulty: 'medium', category: 'Graph', tags: ['dfs', 'matrix'], acceptance_rate: 42.0, likes: 106, description: 'Find cells where water can flow to both the Pacific and Atlantic ocean.' },

  { id: '41', title: 'Climbing Stairs', difficulty: 'easy', category: 'Dynamic Programming', tags: ['dp', 'math'], acceptance_rate: 53.9, likes: 122, description: 'You are climbing a staircase. Each time you can climb 1 or 2 steps. How many distinct ways to reach the top?' },
  { id: '42', title: 'House Robber', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 45.2, likes: 110, description: 'Given a list of non-negative integers representing money in houses, determine the maximum amount you can rob without robbing adjacent houses.' },
  { id: '43', title: 'Coin Change', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 37.8, likes: 125, description: 'Given coins and an amount, compute the fewest number of coins to make up the amount.' },
  { id: '44', title: 'Longest Increasing Subsequence', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 46.9, likes: 132, description: 'Find the length of longest increasing subsequence in an array.' },
  { id: '45', title: 'Edit Distance', difficulty: 'hard', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 30.4, likes: 89, description: 'Given two strings, compute the minimum number of operations to convert one string to another.' },
  { id: '46', title: 'Unique Paths', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp', 'combinatorics'], acceptance_rate: 58.1, likes: 114, description: 'A robot is located at the top-left corner; count the number of unique paths to bottom-right.' },
  { id: '47', title: 'Word Break', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 42.6, likes: 111, description: 'Given a string and a dictionary, determine if the string can be segmented into a sequence of dictionary words.' },
  { id: '48', title: 'Decode Ways', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 38.7, likes: 95, description: 'A message containing letters is encoded; determine number of ways to decode it.' },
  { id: '49', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp'], acceptance_rate: 43.9, likes: 98, description: 'Maximize profit with cooldown after selling stock.' },
  { id: '50', title: 'Partition Equal Subset Sum', difficulty: 'medium', category: 'Dynamic Programming', tags: ['dp', 'subset-sum'], acceptance_rate: 40.0, likes: 87, description: 'Determine if an array can be partitioned into two subsets with equal sum.' },

  { id: '51', title: 'Search in Rotated Sorted Array', difficulty: 'medium', category: 'Binary Search', tags: ['binary-search'], acceptance_rate: 37.8, likes: 109, description: 'Search target in a rotated sorted array.' },
  { id: '52', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', category: 'Binary Search', tags: ['binary-search'], acceptance_rate: 45.2, likes: 95, description: 'Find minimum element in a rotated sorted array.' },
  { id: '53', title: 'Kth Largest Element in an Array', difficulty: 'medium', category: 'Heap', tags: ['heap', 'sorting'], acceptance_rate: 53.4, likes: 108, description: 'Find the k-th largest element in an unsorted array.' },
  { id: '54', title: 'Top K Frequent Elements', difficulty: 'medium', category: 'Heap', tags: ['heap', 'hashmap'], acceptance_rate: 58.5, likes: 112, description: 'Return the k most frequent elements.' },
  { id: '55', title: 'Merge K Sorted Lists', difficulty: 'hard', category: 'Heap', tags: ['linked-list', 'heap'], acceptance_rate: 40.3, likes: 99, description: 'Merge k sorted linked lists and return it as one sorted list.' },

  { id: '56', title: 'Pow(x, n)', difficulty: 'medium', category: 'Math', tags: ['divide-conquer'], acceptance_rate: 32.4, likes: 88, description: 'Implement pow(x, n), which calculates x raised to the power n.' },
  { id: '57', title: 'Sqrt(x)', difficulty: 'easy', category: 'Math', tags: ['binary-search'], acceptance_rate: 41.3, likes: 76, description: 'Implement int sqrt(int x).' },
  { id: '58', title: 'Divide Two Integers', difficulty: 'medium', category: 'Math', tags: ['bit-manipulation'], acceptance_rate: 17.5, likes: 70, description: 'Divide two integers without using multiplication, division and mod operator.' },
  { id: '59', title: 'Factorial Trailing Zeroes', difficulty: 'medium', category: 'Math', tags: ['math'], acceptance_rate: 43.2, likes: 68, description: 'Return the number of trailing zeroes in n!.' },
  { id: '60', title: 'Excel Sheet Column Number', difficulty: 'easy', category: 'Math', tags: ['math'], acceptance_rate: 58.1, likes: 83, description: 'Given a column title as appear in an Excel sheet, return its corresponding column number.' },
  { id: '61', title: 'Majority Element', difficulty: 'easy', category: 'Array', tags: ['counting'], acceptance_rate: 61.9, likes: 97, description: 'Find the majority element that appears more than floor(n/2) times.' },
  { id: '62', title: 'Missing Number', difficulty: 'easy', category: 'Array', tags: ['math', 'xor'], acceptance_rate: 53.3, likes: 90, description: 'Given an array containing n distinct numbers from 0 to n, return the missing number.' },
  { id: '63', title: 'Sum of Two Integers', difficulty: 'medium', category: 'Bit Manipulation', tags: ['bitwise'], acceptance_rate: 50.5, likes: 99, description: 'Calculate the sum of two integers without using + and - operators.' },
  { id: '64', title: 'Number of 1 Bits', difficulty: 'easy', category: 'Bit Manipulation', tags: ['bitwise'], acceptance_rate: 59.0, likes: 92, description: 'Write a function that takes an unsigned integer and returns the number of 1 bits it has.' },
  { id: '65', title: 'Reverse Bits', difficulty: 'easy', category: 'Bit Manipulation', tags: ['bitwise'], acceptance_rate: 51.1, likes: 85, description: 'Reverse bits of a given 32 bits unsigned integer.' },
];

const BASE_HINTS: Hint[] = [
  { id: 'h-1', hint_order: 1, content: 'Think about complements and a hash map.', problem_id: '1' },
  { id: 'h-2', hint_order: 2, content: 'Store number -> index as you iterate once.', problem_id: '1' },
  { id: 'h-3', hint_order: 1, content: 'Track min price and compute profit at each step.', problem_id: '2' }
];

const BASE_CONTESTS = [
  { id: 'c-1', title: 'Starter Contest', description: 'A short contest', difficulty: 'easy', duration_minutes: 30, max_score: 300, problem_ids: BASE_PROBLEMS.map(p => p.id) }
];

function readKey(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeKey(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getProblems() {
  return BASE_PROBLEMS;
}

export async function getProblemById(id: string | number) {
  const sid = String(id);
  const p = BASE_PROBLEMS.find((x) => x.id === sid) || null;
  return p;
}

export async function getHintsByProblemId(problemId: string | number) {
  const pid = String(problemId);
  return BASE_HINTS.filter((h) => h.problem_id === pid);
}

export async function getContests() {
  return BASE_CONTESTS;
}

export async function getProblemsByIds(ids: Array<string | number>) {
  const sid = ids.map(String);
  return BASE_PROBLEMS.filter((p) => sid.includes(p.id));
}

export async function insertSubmission(sub: Submission) {
  const submissions = readKey(STORAGE_KEYS.SUBMISSIONS);
  const id = Date.now().toString();
  submissions.unshift({ id, ...sub });
  writeKey(STORAGE_KEYS.SUBMISSIONS, submissions);
  return { id };
}

export async function upsertUserProgress(progress: any) {
  const arr = readKey(STORAGE_KEYS.USER_PROGRESS);
  const idx = arr.findIndex((p: any) => p.user_id === progress.user_id && p.problem_id === progress.problem_id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...progress };
  else arr.push(progress);
  writeKey(STORAGE_KEYS.USER_PROGRESS, arr);
}

export async function getUserSubmissions(userId: string | number) {
  const uid = String(userId);
  const subs = readKey(STORAGE_KEYS.SUBMISSIONS);
  return subs.filter((s: any) => String(s.user_id) === uid);
}

export async function getChatMessages(userId: string | number, problemId: string | number) {
  const uid = String(userId);
  const pid = String(problemId);
  const msgs = readKey(STORAGE_KEYS.CHAT);
  return msgs.filter((m: any) => String(m.user_id) === uid && String(m.problem_id) === pid).sort((a: any,b:any)=> new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function insertChatMessage(msg: any) {
  const msgs = readKey(STORAGE_KEYS.CHAT);
  msgs.push({ id: Date.now().toString(), created_at: new Date().toISOString(), ...msg });
  writeKey(STORAGE_KEYS.CHAT, msgs);
}

export async function insertDetectionLog(log: any) {
  const arr = readKey(STORAGE_KEYS.DETECTION_LOGS);
  arr.unshift({ id: Date.now().toString(), created_at: new Date().toISOString(), ...log });
  writeKey(STORAGE_KEYS.DETECTION_LOGS, arr);
}

export async function getDetectionLogs(userId?: string | number) {
  const arr = readKey(STORAGE_KEYS.DETECTION_LOGS);
  if (userId === undefined || userId === null) return arr;
  const uid = String(userId);
  return arr.filter((l: any) => String(l.user_id) === uid);
}

export async function getDiscussions(problemId: string | number) {
  const pid = String(problemId);
  const d = readKey(STORAGE_KEYS.DISCUSSIONS);
  return d.filter((x: any) => String(x.problem_id) === pid).sort((a:any,b:any)=> new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
}

export async function insertDiscussion(discussion: any) {
  const arr = readKey(STORAGE_KEYS.DISCUSSIONS);
  arr.unshift({ id: Date.now().toString(), created_at: new Date().toISOString(), upvotes: 0, ...discussion });
  writeKey(STORAGE_KEYS.DISCUSSIONS, arr);
}

export async function upvoteDiscussion(id: string) {
  const arr = readKey(STORAGE_KEYS.DISCUSSIONS);
  const idx = arr.findIndex((d: any) => d.id === id);
  if (idx >= 0) {
    arr[idx].upvotes = (arr[idx].upvotes || 0) + 1;
    writeKey(STORAGE_KEYS.DISCUSSIONS, arr);
  }
}

export async function saveUserProfile(profile: any) {
  const arr = readKey(STORAGE_KEYS.USER_PROFILES);
  const idx = arr.findIndex((p: any) => String(p.id) === String(profile.id));
  if (idx >= 0) arr[idx] = { ...arr[idx], ...profile };
  else arr.push(profile);
  writeKey(STORAGE_KEYS.USER_PROFILES, arr);
}

export async function getUserProfile(id: string | number) {
  const sid = String(id);
  const arr = readKey(STORAGE_KEYS.USER_PROFILES);
  return arr.find((p: any) => String(p.id) === sid) || null;
}

export async function getDashboardDataForUser(userId: string | number) {
  const uid = String(userId);
  const progress = readKey(STORAGE_KEYS.USER_PROGRESS).filter((p:any)=>String(p.user_id)===uid);
  const submissions = readKey(STORAGE_KEYS.SUBMISSIONS).filter((s:any)=>String(s.user_id)===uid);
  const profile = await getUserProfile(uid);

  return { progress, submissions, profile };
}

export async function getAllSubmissionsForUser(userId: string | number) {
  const uid = String(userId);
  return readKey(STORAGE_KEYS.SUBMISSIONS).filter((s:any)=>String(s.user_id)===uid);
}

export async function createContestAttempt(userId: string | number, contestId: string | number, totalProblems: number) {
  const arr = readKey(STORAGE_KEYS.CONTEST_ATTEMPTS);
  const id = Date.now().toString();
  const rec = { id, user_id: String(userId), contest_id: String(contestId), total_problems: totalProblems, created_at: new Date().toISOString() };
  arr.unshift(rec);
  writeKey(STORAGE_KEYS.CONTEST_ATTEMPTS, arr);
  return rec;
}

export async function updateContestAttempt(id: string, updates: any) {
  const arr = readKey(STORAGE_KEYS.CONTEST_ATTEMPTS);
  const idx = arr.findIndex((a:any)=>a.id===id);
  if (idx>=0) { arr[idx] = { ...arr[idx], ...updates }; writeKey(STORAGE_KEYS.CONTEST_ATTEMPTS, arr); }
}

export default {
  getProblems,
  getProblemById,
  getHintsByProblemId,
  insertSubmission,
  upsertUserProgress,
  getUserSubmissions,
  getChatMessages,
  insertChatMessage,
  insertDetectionLog,
  getDetectionLogs,
  getDiscussions,
  insertDiscussion,
  upvoteDiscussion,
  getContests,
  getProblemsByIds,
  saveUserProfile,
  getUserProfile,
  getDashboardDataForUser,
  getAllSubmissionsForUser,
  createContestAttempt,
  updateContestAttempt
};
