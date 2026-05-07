## Top K Frequent Elements

```python
import heapq
class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        frq = {}
        for val in nums:
            if val in frq:
                frq[val] += 1
            else:
                frq[val] = 1

        heap = []
        for val in frq.keys():
            heapq.heappush(heap, (frq[val], val))
            print(heap)
            if (len(heap)>k):
                heapq.heappop(heap)
        res = []
        for i in range(k):
            res.append(heapq.heappop(heap)[1])

        return res

        
```