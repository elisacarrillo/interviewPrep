## Max Area of Island

```python
class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        # im going to use dfs for this, need visited because its a graph NOT a tree
        visited = set()
        row = len(grid)
        col = len(grid[0])
        # node is gonna be i, j pair (i,j)
        def dfs(node, visited) -> int:
            if (node not in visited):
                visited.add(node)
                i, j = node 
                if (i < row and j < col and i >= 0 and j >= 0):
                    if (grid[i][j] == 1):
                        neighbor1 = dfs((i+1, j), visited)
                        neighbor2 = dfs((i-1, j), visited)
                        neighbor3 = dfs((i, j+1), visited)
                        neighbor4 = dfs((i, j-1), visited)
                        total = 1
                        if (neighbor1):
                            total = total + neighbor1
                        if (neighbor2):
                            total = total + neighbor2
                        if (neighbor3):
                            total = total + neighbor3
                        if (neighbor4):
                            total = total + neighbor4
                        return total
                    else:
                        return 0
            else:
                return 0


                
        
        i = 0
        j = 0
        max_total = 0 
        for i in range(row):
            for j in range(col):
                total = dfs((i,j), visited)
                if (total>max_total):
                    max_total = total
        return max_total

                

        
```