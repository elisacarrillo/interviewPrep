## encode and decode strings

```python
class Solution:

    def encode(self, strs: List[str]) -> str:
        result = ""
        for s in strs:
            length = len(s)
            result += f"{len(s)}#{s}"
        return result

    def decode(self, s: str) -> List[str]:
        strs = [] 
        i = 0
        while i < len(s):
            str_num= ""
            while (s[i] != '#' ):
                str_num += s[i]
                i = i + 1
                
            print("STRNUM" + str_num)
            num = int(str_num)
            print(s[i + 1:i+num + 1])

            strs.append(s[i + 1:i+num + 1])
            
            
            i = i + int(str_num) + 1
            

        return strs


```