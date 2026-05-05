## Best Time to Buy and Sell Stock

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        buy = 0
        sell = 1
        max_profit = 0
        for buy in range(len(prices)):
            for sell in range(len(prices)):
                profit = prices[sell] - prices[buy]
                if (profit > max_profit and sell > buy):
                    max_profit = profit
        return max_profit
        
```