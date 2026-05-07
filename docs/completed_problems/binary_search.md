## Binary Search

```python
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        nums_length = len(nums)
        nums_copy = nums.copy()
        to_return =0
        def helper(self, nums: List[int], start:int, end:int) -> int:
            midpoint = (end + start) // 2
            if end < start :
                return -1
        
            if nums[midpoint] == target:
                return midpoint 
       
            
            if nums[midpoint ] <= target:
                return helper(self, nums, midpoint + 1,  end)

            else:
                return helper(self, nums, start , midpoint - 1)
            
                

        to_return = helper(self, nums,0, nums_length -1  )
        return to_return

    # while loop would decrease to O(1) time and space complexity
        
        
```