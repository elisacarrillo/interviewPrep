## Level Order Traversal

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        visited = []
        def bfs():
            queue = []       
            queue.append((root, 0))
            while (queue):
                node, level = queue.pop()
                if (node == None):
                    return 
                if (len(visited) <= level ):
                    visited.append([])

                visited[level].append(node.val)
                if (node.right):
                    queue.append((node.right, level + 1))
                if (node.left):
                    queue.append((node.left, level + 1))
               

        bfs()
        return visited

        
```