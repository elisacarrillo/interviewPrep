## Valid Anagram

```python
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # two strings, s and t
        # anagram - string that contains the exact same characters as another string in a different order

        #lets go with another approach
        #hashmap -> count frequencies
        # check if hashmaps are equal

        s_hash = {}
        t_hash = {}

        for char in s:
            if char in s_hash:
                s_hash[char] = s_hash[char] + 1
            else:
                s_hash[char] = 1
        
        for char in t:
            if char in t_hash:
                t_hash[char] = t_hash[char] + 1
            else:
                t_hash[char] = 1

        return t_hash == s_hash
        
```