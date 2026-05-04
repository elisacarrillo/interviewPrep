## Maximum Depth of Binary Tree

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        def dfs(tNode: Optional[TreeNode]) -> int:
            if (tNode is None):
                return 0
            lefty = dfs(tNode.left) 
            righty = dfs(tNode.right) 
            return max(lefty, righty) + 1

        return dfs(root)

```