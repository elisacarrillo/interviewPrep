## Islands and Treasure

```python
class Solution:
    def islandsAndTreasure(self, grid: List[List[int]]) -> None:
        # use bfs (ripple effect)
        row = len(grid)
        col = len(grid[0])
        def bfs():
            i = 0
            j = 0
            queue = []
            visited = set()
            for i in range(row):
                for j in range(col):
                    if (grid[i][j] == 0 and i < row and j < col and i >= 0 and j >= 0):
                        queue.append(((i,j), 0))
                        visited.add((i,j))
                    
            while len(queue) > 0 :
                node, dist = queue.pop(0)
                i,j = node
                if (grid[i][j] != -1 ):
                    if (i+1 < row and (i+1,j) not in visited and grid[i+1][j] != -1):
                        visited.add((i+1, j))
                        grid[i+1][j] = dist + 1
                        queue.append(((i+1,j), dist + 1))
                    if (i-1 >= 0 and (i-1,j) not in visited and grid[i-1][j] != -1):
                        visited.add((i-1,j))
                        grid[i-1][ j]= dist + 1
                        queue.append(((i-1, j), dist + 1))
                    if (j+1 < col and (i,j+1) not in visited and grid[i][j+1] != -1):
                        visited.add((i, j + 1))
                        grid[i][j+1] =  dist + 1
                        queue.append(((i,j+1), dist + 1))
                    if (j-1 >= 0 and (i,j-1) not in visited and grid[i][j-1] != -1):
                        visited.add((i, j-1))
                        grid[i][j-1] = dist+ 1
                        queue.append(((i,j-1), dist + 1))
        bfs()




          
```