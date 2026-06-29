const supabase = require('./src/config/supabaseClient');

const CHEATSHEETS = {
  'Two Sum': {
    optimalSolution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    timeComplexity: "O(N) - We traverse the list exactly once. Each lookup in the hash table costs only O(1) time.",
    spaceComplexity: "O(N) - The extra space required depends on the number of items stored in the hash table, which stores at most N elements.",
    edgeCases: ["Empty array", "Array with one element", "Negative numbers in array", "No valid solution exists"]
  },
  'Valid Parentheses': {
    optimalSolution: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (let char of s) {
    if (!map[char]) {
      stack.push(char);
    } else if (stack.pop() !== map[char]) {
      return false;
    }
  }
  return stack.length === 0;
}`,
    timeComplexity: "O(N) - We traverse the string exactly once.",
    spaceComplexity: "O(N) - In the worst case (all open brackets), the stack size is N.",
    edgeCases: ["Empty string", "String with odd length", "Only closing brackets", "Only opening brackets"]
  },
  'Container With Most Water': {
    optimalSolution: `function maxArea(height) {
  let left = 0, right = height.length - 1;
  let maxWater = 0;
  
  while (left < right) {
    let width = right - left;
    let h = Math.min(height[left], height[right]);
    maxWater = Math.max(maxWater, width * h);
    
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return maxWater;
}`,
    timeComplexity: "O(N) - Single pass through the array using two pointers.",
    spaceComplexity: "O(1) - Constant extra space used.",
    edgeCases: ["Array length of 2", "All heights are 0", "Heights are strictly increasing/decreasing"]
  },
  '3Sum': {
    optimalSolution: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1, right = nums.length - 1;
    
    while (left < right) {
      let sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++; right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}`,
    timeComplexity: "O(N^2) - Sorting takes O(N log N), but the nested loops take O(N^2).",
    spaceComplexity: "O(1) or O(N) depending on the sorting algorithm implementation.",
    edgeCases: ["All zeros", "Fewer than 3 elements", "No triplets sum to zero", "Duplicate triplets"]
  },
  'Reverse Linked List': {
    optimalSolution: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
    timeComplexity: "O(N) - We traverse the list once.",
    spaceComplexity: "O(1) - We only use pointers, no extra memory.",
    edgeCases: ["Empty list (head is null)", "List with only one node"]
  },
  'Linked List Cycle': {
    optimalSolution: `function hasCycle(head) {
  let slow = head, fast = head;
  
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
    timeComplexity: "O(N) - In the worst case, we traverse the list once.",
    spaceComplexity: "O(1) - We only use two pointers.",
    edgeCases: ["Empty list", "Single node without cycle", "Cycle at the head node"]
  },
  'Daily Temperatures': {
    optimalSolution: `function dailyTemperatures(temperatures) {
  const result = new Array(temperatures.length).fill(0);
  const stack = []; // Stores indices
  
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      let prevIndex = stack.pop();
      result[prevIndex] = i - prevIndex;
    }
    stack.push(i);
  }
  return result;
}`,
    timeComplexity: "O(N) - Each element is pushed and popped from the stack at most once.",
    spaceComplexity: "O(N) - In the worst case, the stack stores N indices.",
    edgeCases: ["Temperatures constantly decreasing", "All temperatures the same", "Array of size 1"]
  },
  'Sliding Window Maximum': {
    optimalSolution: `function maxSlidingWindow(nums, k) {
  const result = [];
  const deque = []; // Stores indices
  
  for (let i = 0; i < nums.length; i++) {
    // Remove elements out of the current window
    if (deque.length > 0 && deque[0] < i - k + 1) {
      deque.shift();
    }
    // Remove smaller elements as they are useless
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    deque.push(i);
    // Window has reached size k
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }
  return result;
}`,
    timeComplexity: "O(N) - Each element is added and removed from the deque at most once.",
    spaceComplexity: "O(K) - The deque stores at most K indices.",
    edgeCases: ["k = 1", "k = nums.length", "Strictly decreasing/increasing arrays"]
  },
  'Invert Binary Tree': {
    optimalSolution: `function invertTree(root) {
  if (root === null) return null;
  
  const left = invertTree(root.left);
  const right = invertTree(root.right);
  
  root.left = right;
  root.right = left;
  
  return root;
}`,
    timeComplexity: "O(N) - We visit every node exactly once.",
    spaceComplexity: "O(H) - The call stack goes as deep as the height of the tree (worst O(N), best O(log N)).",
    edgeCases: ["Empty tree (root is null)", "Tree with only root", "Skewed tree (all left or right)"]
  },
  'Binary Tree Level Order Traversal': {
    optimalSolution: `function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }
  return result;
}`,
    timeComplexity: "O(N) - We visit every node exactly once.",
    spaceComplexity: "O(N) - In the worst case, the queue stores up to N/2 nodes at the lowest level.",
    edgeCases: ["Empty tree", "Single node tree", "Unbalanced tree"]
  },
  'Validate Binary Search Tree': {
    optimalSolution: `function isValidBST(root, min = -Infinity, max = Infinity) {
  if (root === null) return true;
  
  if (root.val <= min || root.val >= max) {
    return false;
  }
  
  return isValidBST(root.left, min, root.val) && 
         isValidBST(root.right, root.val, max);
}`,
    timeComplexity: "O(N) - We visit every node exactly once.",
    spaceComplexity: "O(H) - The recursive call stack goes as deep as the height of the tree.",
    edgeCases: ["Empty tree", "Single node", "Tree with duplicate values", "Values equal to MAX_SAFE_INTEGER"]
  }
};

const fallbackCheatsheet = {
  optimalSolution: `// Optimal solution not available yet for this problem.`,
  timeComplexity: "N/A",
  spaceComplexity: "N/A",
  edgeCases: ["Check null/empty inputs", "Check boundary constraints"]
};

async function migrate() {
  console.log('Starting migration...');
  try {
    const { data: questions, error: fetchErr } = await supabase.from('questions').select('id, title');
    if (fetchErr) throw fetchErr;

    for (let q of questions) {
      const sheet = CHEATSHEETS[q.title] || fallbackCheatsheet;
      console.log(`Updating ${q.title}...`);
      const { error: upErr } = await supabase
        .from('questions')
        .update({ cheatsheet: sheet })
        .eq('id', q.id);
      
      if (upErr) throw upErr;
    }
    console.log('Migration completed successfully!');
  } catch(e) {
    console.error('Error during migration:', e);
  }
}

migrate();
