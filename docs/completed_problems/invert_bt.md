## Invert Binary Tree

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
      
        def bfs(node):
            if (node == None):
                return node

            root = node
            queue = [node]
            while (len(queue) > 0):
                node = queue.pop(0)
                temp = node.right
                node.right = node.left
                node.left = temp
    
                if (node.right is not None):
                    print(node.right.val)
                    queue.append(node.right)
                        
                    
                if (node.left is not None):
                    print(node.left.val)
                    queue.append(node.left)
            return root
                    
        return bfs(root)
```