## Group Anagrams

```sh
class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        # anagram - string that contains the exact same characters as another string, 
        # in a different order

        # check for set and length equality
        # hashmap with index as key and (length, set ) as value
        # for each string i potentially can make a hashmap with index as char and val as char count
        map_res = {}
        list_res = []
        for strang in strs:
            string = "".join(sorted(strang))
            if (string in map_res):
                map_res[string].append(strang)
            else:
                map_res[string] = [strang]
    
        for item in map_res:
            list_res.append(map_res[item])
        
        return list_res




```