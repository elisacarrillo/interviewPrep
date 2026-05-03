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

## Contains Duplicate

```python
def hasDuplicate(self, nums: List[int]) -> bool:
    sety = set(nums)
    return not (len(sety) == len(nums))

```