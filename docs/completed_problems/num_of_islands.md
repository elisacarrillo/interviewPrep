## Number of Islands (BFS)

```python
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        row = len(grid)
        col = len(grid[0])
        visited = set()
        island_count = 0
        def dfs(i, j, visited, island_count):
            if ((i,j) not in visited):
                
                visited.add((i,j))
                neighbor1 = i + 1
                neighbor2 = i - 1
                neighbor3 = j + 1
                neighbor4 = j - 1
                if (neighbor1 < row):
                    if (grid[neighbor1][j] == "1" and (neighbor1,j) not in visited):
                        island_count = island_count + 1
                        dfs(neighbor1, j, visited, island_count)
                if (neighbor2 >= 0):
                    if (grid[neighbor2][j] == "1" and (neighbor2,j) not in visited):
                        island_count = island_count + 1
                        dfs(neighbor2, j, visited, island_count)
                if (neighbor3 < col):
                    if (grid[i][neighbor3] == "1" and (i,neighbor3) not in visited):
                        island_count = island_count + 1
                        dfs(i, neighbor3, visited, island_count)
                if (neighbor4 >= 0):
                    if (grid[i][neighbor4] == "1" and (i,neighbor4) not in visited):
                        island_count = island_count + 1
                        dfs(i, neighbor4, visited, island_count)
        
        i = 0
        j = 0 
        for i in range(row):
            for j in range(col):
                if (grid[i][j] == "1" and (i,j) not in visited):
                    island_count = island_count + 1
                    dfs(i, j, visited, island_count)
                    
                j = j+1
            i = i + 1
            j = 0
        return island_count
```