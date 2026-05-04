## Two Sum

```python
def twoSum(self, nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        sub = target - num
        if sub in seen:
            return [seen[sub], i]
        else:
            seen[num] = i
         
```