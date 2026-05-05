## Clone Graph

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val = 0, neighbors = None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
"""

class Solution:
    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:
        # doing dfs because adjacency list
        visited = {}
        def dfs(node, visited) -> Optional['Node']:
            if (node not in visited):
                
                new_node = Node(node.val)
                neighbors_list = []
                visited[node] = new_node
                for neighbor in node.neighbors:
                    neighbors_list.append(dfs(neighbor, visited))
                visited[node].neighbors = neighbors_list
                
                return new_node
            else:
                return visited[node]
        if node is None:
            return
        root = Node(node.val)
        root_neighbors = []
        for n in node.neighbors:
            new_node = dfs(n, visited)
            root_neighbors.append(new_node)
        root.neighbors = root_neighbors
        return root




                
        
```