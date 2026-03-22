# Price vs Cost: Understanding the Difference

## 📊 Quick Answer

**They are DIFFERENT!**

| Field | Purpose | Who Sees It | Used For |
|-------|---------|-------------|----------|
| **Price** | Selling price to customers | Customers in POS/Menu | Revenue, Billing |
| **Cost** | Your cost to make/buy the item | Internal only (Management) | Profit calculation, Reports |

---

## 💰 Detailed Explanation

### **PRICE** = What You Charge the Customer
- **Definition:** The amount customers pay when they order this item
- **Visibility:** Shown in POS, displayed to customers
- **Example:** If you sell a Pancake for ₹250, the **Price** is ₹250
- **Required:** ✅ Yes - Every item must have a price

### **COST** = What It Costs You to Make/Buy
- **Definition:** Your expense to prepare or purchase this item
- **Visibility:** Internal only - customers never see this
- **Example:** If ingredients for Pancake cost you ₹80, the **Cost** is ₹80
- **Required:** ❌ No - Optional, but useful for profit tracking

---

## 🧮 Real-World Example

### Scenario: Adding "Masala Dosa" to Menu

```
Item: Masala Dosa

YOUR COSTS (what you spend):
- Rice/Lentils: ₹20
- Potato filling: ₹15
- Oil/spices: ₹10
- Labor/overhead: ₹15
─────────────────────
TOTAL COST: ₹60  ← Enter this in "Cost" field

YOUR PRICING (what customer pays):
- You want 150% markup for profit
- Cost (₹60) × 2.5 = ₹150
─────────────────────
SELLING PRICE: ₹150  ← Enter this in "Price" field

PROFIT PER ITEM:
Price - Cost = ₹150 - ₹60 = ₹90 profit! 💰
```

---

## 📋 When Entering a Menu Item

### What You Should Enter:

```
┌────────────────────────────────────────────────┐
│  Add Menu Item                                 │
├────────────────────────────────────────────────┤
│  Name: Masala Dosa                            │
│  Category: Breakfast                           │
│  Section: Cafe-Restaurant                      │
│                                                │
│  Price: ₹150  ← What customer pays            │
│  Cost:  ₹60   ← What it costs you (optional)  │
│                                                │
│  [Save Item]                                   │
└────────────────────────────────────────────────┘
```

### In the POS System (Customer View):

```
┌─────────────┐
│     🍳      │
│ Masala Dosa │
│   ₹150.00   │  ← Only PRICE is shown
│  breakfast  │
└─────────────┘

Customer pays: ₹150
(They never see the ₹60 cost)
```

---

## 📊 How This Helps Your Business

### 1. **Profit Tracking**
```
If you entered both Price and Cost:

Reports will show:
- Revenue: ₹15,000 (100 dosas × ₹150)
- Cost: ₹6,000 (100 dosas × ₹60)
- Profit: ₹9,000 (60% profit margin!)
```

### 2. **Pricing Decisions**
```
Compare items to see which are most profitable:

Item A: Price ₹200, Cost ₹80  = ₹120 profit (60%)
Item B: Price ₹300, Cost ₹250 = ₹50 profit (17%)

→ Item A is more profitable despite lower price!
```

### 3. **Inventory Management**
- Know which items are worth keeping on menu
- Identify items with low profit margins
- Make data-driven menu decisions

---

## ⚙️ Current System Behavior

### Price Field:
- **Required:** ✅ Yes - Cannot save without price
- **Used in:** POS, Customer bills, Revenue reports
- **Validation:** Must be greater than 0

### Cost Field:
- **Required:** ❌ No - Can be left empty
- **Used in:** Internal reports, Profit calculations
- **Validation:** Optional, defaults to NULL if not provided

---

## 💡 Best Practices

### ✅ DO:
1. **Always enter Price** - This is mandatory
2. **Enter Cost for tracking** - Helps monitor profitability
3. **Update costs regularly** - Ingredient prices change
4. **Price should be > Cost** - Otherwise you lose money!
5. **Consider markup** - Typical restaurant markup is 200-300%

### ❌ DON'T:
1. **Don't confuse the two** - Price ≠ Cost
2. **Don't skip Cost** - You'll miss profit insights
3. **Don't price below cost** - Unless it's a loss leader
4. **Don't share cost with customers** - Keep it internal

---

## 📈 Markup Guidelines

Common restaurant markup formulas:

### Method 1: Simple Markup
```
Price = Cost × 3
Example: Cost ₹60 → Price ₹180
```

### Method 2: Percentage Markup
```
Price = Cost + (Cost × Markup%)
Example: Cost ₹60 + (60 × 150%) = ₹210
```

### Method 3: Target Profit Margin
```
If you want 70% profit margin:
Price = Cost ÷ (1 - 0.70) = Cost ÷ 0.30
Example: ₹60 ÷ 0.30 = ₹200
```

---

## 🎯 Quick Reference

### Food & Beverage Typical Markups:

| Item Type | Typical Cost | Typical Price | Markup |
|-----------|--------------|---------------|--------|
| Coffee | ₹20 | ₹80-100 | 400% |
| Breakfast | ₹50-80 | ₹150-250 | 200% |
| Main Course | ₹100-150 | ₹300-500 | 250% |
| Beverages | ₹15-30 | ₹60-120 | 300% |
| Desserts | ₹40-60 | ₹120-200 | 250% |

---

## 🔍 How to Calculate Your Costs

### Step-by-Step Guide:

1. **Ingredient Costs**
   ```
   List all ingredients:
   - Rice: ₹15
   - Vegetables: ₹20
   - Spices: ₹5
   Total: ₹40
   ```

2. **Labor Costs** (estimated per item)
   ```
   Chef time: ₹10
   Server time: ₹5
   Total: ₹15
   ```

3. **Overhead** (utilities, rent, etc.)
   ```
   Estimated per dish: ₹5
   ```

4. **Total Cost**
   ```
   Ingredients (₹40) + Labor (₹15) + Overhead (₹5) = ₹60
   ```

---

## 📊 Example: Complete Menu Setup

### Coffee Shop Example:

| Item | Ingredients Cost | Labor | Overhead | **Total Cost** | **Selling Price** | Profit |
|------|------------------|-------|----------|----------------|-------------------|--------|
| Cappuccino | ₹15 | ₹5 | ₹5 | **₹25** | **₹100** | ₹75 |
| Sandwich | ₹40 | ₹15 | ₹5 | **₹60** | **₹180** | ₹120 |
| Pancakes | ₹50 | ₹20 | ₹10 | **₹80** | **₹250** | ₹170 |

**Result:** 
- Most profitable: Pancakes (₹170 profit per order)
- Highest margin: Cappuccino (75% profit margin)

---

## 🚨 Important Notes

### Why Cost is Optional:
- Some restaurants don't track detailed costs
- New items may not have cost data yet
- Some items (free water, etc.) have negligible cost

### Why Price is Required:
- Every item must have a price for POS to work
- Cannot complete order without knowing what to charge
- Legal requirement for billing

### Privacy:
- **Cost data is NEVER shown to customers**
- Only appears in management/admin reports
- Helps you make business decisions privately

---

## 🎓 Summary

```
┌─────────────────────────────────────────────────┐
│  PRICE vs COST                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  PRICE = Revenue (Money IN)                    │
│   ↓                                             │
│   What customer pays                            │
│   Shown in POS                                  │
│   Required field                                │
│                                                 │
│  COST = Expense (Money OUT)                    │
│   ↓                                             │
│   What it costs you                             │
│   Hidden from customers                         │
│   Optional but recommended                      │
│                                                 │
│  PROFIT = Price - Cost                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Recommendation

**Always fill in BOTH fields:**
- **Price:** Required for sales
- **Cost:** Optional but valuable for business intelligence

This way you can:
- Track profitability per item
- Make informed pricing decisions
- Identify best-selling vs most-profitable items
- Monitor if ingredient costs are eating into margins

---

**Need help calculating costs?**  
The Reports section will eventually show profit analysis based on your cost data! 📊
