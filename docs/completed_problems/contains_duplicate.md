## Contains Duplicate

```python
def hasDuplicate(self, nums: List[int]) -> bool:
    sety = set(nums)
    return not (len(sety) == len(nums))

```