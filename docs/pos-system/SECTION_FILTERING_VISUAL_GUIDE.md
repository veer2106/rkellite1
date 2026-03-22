# Visual Guide: How Section Filtering Works

## 🎨 Section Filtering Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MENU MANAGEMENT                           │
│  Add/Edit Items with Section Assignment                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Assigns section to each item
                           ▼
    ┌──────────────────────────────────────────────────┐
    │            DATABASE (menu_items)                 │
    │                                                  │
    │  Item A: section = 'lodge-dine'                 │
    │  Item B: section = 'cafe-restaurant'            │
    │  Item C: section = 'both'                       │
    └──────────────────────────────────────────────────┘
                           │
                           │ Fetches all items
                           ▼
    ┌──────────────────────────────────────────────────┐
    │                 POS SYSTEM                       │
    │                                                  │
    │  User selects: ○ Lodge-Dine  ○ Cafe-Restaurant │
    └──────────────────────────────────────────────────┘
                           │
                           │ Filters items
                           ▼
         ┌─────────────────────────────────┐
         │   SECTION FILTER LOGIC          │
         │                                 │
         │  Show item IF:                  │
         │    item.section == selected     │
         │         OR                      │
         │    item.section == 'both'       │
         └─────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│   LODGE-DINE POS   │         │ CAFE-RESTAURANT POS │
│                     │         │                     │
│  Shows:             │         │  Shows:             │
│  ✅ Item A          │         │  ❌ Item A          │
│  ❌ Item B          │         │  ✅ Item B          │
│  ✅ Item C          │         │  ✅ Item C          │
└─────────────────────┘         └─────────────────────┘
```

---

## 🍳 Breakfast Category Example

### Scenario: Adding Breakfast Items

```
MENU MANAGEMENT:
┌──────────────────────────────────────────────────┐
│  Add Item                                        │
│  ────────────────────────────────────────────   │
│  Name: Pancakes                                  │
│  Category: [Breakfast ▼]  ← NEW OPTION!        │
│  Section: [Lodge-Dine Only ▼]                   │
│  Price: ₹250                                     │
│  [✓] Available                                   │
│                                                  │
│  [Save]  [Cancel]                               │
└──────────────────────────────────────────────────┘
```

### Result in POS:

```
LODGE-DINE POS:
┌─────────────┐
│     🍳      │  ← Breakfast icon
│  Pancakes   │
│   ₹250.00   │
│  breakfast  │
└─────────────┘
✅ VISIBLE

CAFE-RESTAURANT POS:
(Empty - Pancakes not shown)
❌ HIDDEN
```

---

## 📊 Complete Example with Multiple Items

### Items in Database:

| Item           | Category    | Section            | Price |
|----------------|-------------|--------------------|-------|
| Pancakes       | Breakfast   | lodge-dine         | ₹250  |
| Masala Dosa    | Breakfast   | cafe-restaurant    | ₹150  |
| Coffee         | Beverages   | both               | ₹100  |
| Club Sandwich  | Snacks      | lodge-dine         | ₹200  |
| Veg Burger     | Snacks      | cafe-restaurant    | ₹180  |

### POS Display:

```
┌────────────────────────────────────────────────────────────┐
│                    POINT OF SALE                           │
│  ○ Lodge-Dine  ○ Cafe-Restaurant                          │
└────────────────────────────────────────────────────────────┘

WHEN LODGE-DINE SELECTED:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│     🍳      │  │     ☕      │  │     🥪      │
│  Pancakes   │  │   Coffee    │  │ Club Sandwich│
│   ₹250.00   │  │   ₹100.00   │  │   ₹200.00   │
└─────────────┘  └─────────────┘  └─────────────┘
  (breakfast)      (beverages)       (snacks)

Items shown: 3 (Pancakes, Coffee, Club Sandwich)
Items hidden: 2 (Masala Dosa, Veg Burger)


WHEN CAFE-RESTAURANT SELECTED:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│     🍳      │  │     ☕      │  │     🥪      │
│ Masala Dosa │  │   Coffee    │  │ Veg Burger  │
│   ₹150.00   │  │   ₹100.00   │  │   ₹180.00   │
└─────────────┘  └─────────────┘  └─────────────┘
  (breakfast)      (beverages)       (snacks)

Items shown: 3 (Masala Dosa, Coffee, Veg Burger)
Items hidden: 2 (Pancakes, Club Sandwich)
```

---

## 🔍 Category Filter + Section Filter

### Combined Filtering:

```
USER ACTIONS:
1. Select section: Lodge-Dine
2. Select category: Breakfast

FILTER LOGIC:
┌─────────────────────────────────────────────────┐
│  Step 1: Filter by Section                     │
│  Keep only: (section = lodge-dine OR both)     │
│                                                 │
│  Result: Pancakes ✅, Coffee ✅                 │
│                                                 │
│  Step 2: Filter by Category                    │
│  Keep only: (category = breakfast)             │
│                                                 │
│  Final Result: Pancakes ✅                      │
└─────────────────────────────────────────────────┘

POS DISPLAY:
┌─────────────┐
│     🍳      │
│  Pancakes   │
│   ₹250.00   │
│  breakfast  │
└─────────────┘
Only 1 item shown
```

---

## 🎯 Visual Summary

### Section Assignment Options:

```
┌─────────────────────────────────────────────────────────┐
│  SECTION DROPDOWN IN MENU MANAGEMENT:                   │
│                                                          │
│  ○ Both (Lodge-Dine & Cafe-Restaurant)                  │
│     → Shows in BOTH POS sections                        │
│     → Use for: Common items (Coffee, Water, etc.)       │
│                                                          │
│  ○ Lodge-Dine Only                                      │
│     → Shows ONLY in Lodge-Dine POS                      │
│     → Use for: Premium/hotel items                      │
│                                                          │
│  ○ Cafe-Restaurant Only                                 │
│     → Shows ONLY in Cafe-Restaurant POS                 │
│     → Use for: Casual/cafe items                        │
└─────────────────────────────────────────────────────────┘
```

### Category Icons Reference:

```
🍳 Breakfast       (NEW!)
☕ Beverages
🍽️ Appetizers
🍛 Main Course
🍰 Desserts
🥪 Snacks
🍴 Starters
```

---

## 💡 Quick Tips

### ✅ Best Practices:
- Assign **premium breakfast** items to Lodge-Dine
- Assign **quick breakfast** items to Cafe-Restaurant
- Use **'Both'** for common items like coffee, tea, juice
- Keep categories consistent for better filtering

### ❌ Common Mistakes:
- Don't forget to set section when adding items
- Don't use 'Both' for section-specific items
- Don't mix up category with section

---

## 🚀 Usage Workflow

```
1. ADD ITEM IN MENU MANAGEMENT
   ↓
2. SELECT CATEGORY (e.g., Breakfast)
   ↓
3. SELECT SECTION (Lodge-Dine/Cafe-Restaurant/Both)
   ↓
4. SAVE ITEM
   ↓
5. GO TO POS
   ↓
6. SELECT SECTION (Toggle between Lodge-Dine/Cafe-Restaurant)
   ↓
7. ITEM APPEARS ONLY IN ASSIGNED SECTION
   ↓
8. (OPTIONAL) FILTER BY CATEGORY
   ↓
9. ADD TO CART & CREATE ORDER
```

---

**🎊 Section filtering is now working correctly!**  
**Items appear only where they should** ✨
