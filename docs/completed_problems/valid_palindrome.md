## Valid Palindrome

```python
class Solution:
    def isPalindrome(self, s: str) -> bool:
        # palindrome = string that reads the same forward and backward
        new_s = ""
        for char in s:
            if (char.isalnum()):
                new_s = new_s + char.lower()

            
        s = new_s
        ptr1 = 0
        ptr2 = len(s) - 1

        
        while (ptr1 < ptr2):
            print("one: " + s[ptr1] + " two: " + s[ptr2])
            if (s[ptr1] != s[ptr2]):
                return False
            else:
                ptr1 = ptr1 + 1
                ptr2 = ptr2 - 1
        return True
        
```