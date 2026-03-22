# Responsive Design Visual Examples

**Visual guide showing responsive layouts at different screen sizes**

---

## 📱 Screen Size Comparison

### Mobile (375px)
```
┌─────────────────────┐
│   ☰  Cafe Delicacy │ ← Hamburger menu
├─────────────────────┤
│                     │
│  [Dashboard Card]   │ ← 1 column
│  Orders: 25         │
│                     │
│  [Dashboard Card]   │
│  Revenue: $1,250    │
│                     │
│  [Recent Orders]    │ ← Stacked
│  • Order #123       │
│  • Order #124       │
│                     │
└─────────────────────┘
```

### Tablet (768px)
```
┌─────────────────────────────────────┐
│  ☰  Cafe Delicacy             User  │
├─────────────────────────────────────┤
│                                     │
│  [Card 1]    [Card 2]              │ ← 2 columns
│  Orders: 25  Revenue                │
│                                     │
│  [Card 3]    [Card 4]              │
│  Tables      Customers              │
│                                     │
│  [Recent Orders]                    │
│  • Order #123  Dine-in  $45.00     │
│  • Order #124  Takeaway $32.50     │
│                                     │
└─────────────────────────────────────┘
```

### Desktop (1280px)
```
┌─────┬───────────────────────────────────────────┐
│  ☕ │  Cafe Delicacy              User Menu ▼  │
│     ├───────────────────────────────────────────┤
│ 🏠  │                                           │
│ Dash│  [Card 1]  [Card 2]  [Card 3]  [Card 4] │ ← 4 columns
│     │  Orders    Revenue   Tables    Customers │
│ 🛒  │                                           │
│ POS │  ┌─────────────────────────────────────┐ │
│     │  │ Recent Orders                       │ │
│ 📋  │  │ #123  Dine-in  $45.00  Preparing   │ │
│ Ord.│  │ #124  Takeaway $32.50  Ready       │ │
│     │  │ #125  Delivery $67.80  Confirmed   │ │
│ 📖  │  └─────────────────────────────────────┘ │
│ Menu│                                           │
│     │  ┌─────────────────┐ ┌─────────────────┐ │
│ 📦  │  │ Chart           │ │ Performance     │ │
│ Inv.│  │                 │ │                 │ │
│     │  │    [Graph]      │ │  [Statistics]   │ │
│ 📅  │  └─────────────────┘ └─────────────────┘ │
│ Res.│                                           │
│     │                                           │
└─────┴───────────────────────────────────────────┘
  ↑                        ↑
Sidebar           Main Content Area
(72 = 18rem)         (adjusts automatically)
```

---

## 🎨 Component Layouts

### POS System Layout

#### Mobile (375px)
```
┌─────────────────────┐
│ ☰  POS              │
├─────────────────────┤
│ [Section Filter]    │
│ [Lodge] [Cafe]      │
├─────────────────────┤
│ Categories          │
│ [All] [Breakfast]   │
│ [Beverages] [Main]  │
├─────────────────────┤
│ Menu Items (2 cols) │
│ ┌─────┐  ┌─────┐   │
│ │ Item│  │ Item│   │
│ │  1  │  │  2  │   │
│ └─────┘  └─────┘   │
│ ┌─────┐  ┌─────┐   │
│ │ Item│  │ Item│   │
│ │  3  │  │  4  │   │
│ └─────┘  └─────┘   │
├─────────────────────┤
│ Cart (Full Width)   │
│ • Coffee x2  $8.00  │
│ • Sandwich   $6.50  │
│                     │
│ Total: $14.50       │
│ [Checkout Button]   │
└─────────────────────┘
```

#### Desktop (1280px)
```
┌───────────────────────────────────────────────────┐
│ POS                                    User Menu  │
├───────────────────────────────────────────────────┤
│                                                   │
│ ┌───────────────────────┐  ┌─────────────────┐  │
│ │ Menu Items (70%)      │  │ Cart (30%)      │  │
│ │                       │  │ Sticky Position │  │
│ │ Section: [Lodge][Cafe]│  │                 │  │
│ │                       │  │ Items:          │  │
│ │ Categories (scroll)   │  │ • Coffee x2     │  │
│ │ [All][Breakfast]...   │  │   $8.00         │  │
│ │                       │  │ • Sandwich x1   │  │
│ │ Items (4 columns)     │  │   $6.50         │  │
│ │ ┌────┐┌────┐┌────┐┌──│  │                 │  │
│ │ │Item││Item││Item││It│  │ Subtotal: $14.50│  │
│ │ │ 1  ││ 2  ││ 3  ││4 │  │ Tax:       $1.45│  │
│ │ └────┘└────┘└────┘└──│  │ Total:    $15.95│  │
│ │ ┌────┐┌────┐┌────┐┌──│  │                 │  │
│ │ │Item││Item││Item││It│  │ Customer Info:  │  │
│ │ │ 5  ││ 6  ││ 7  ││8 │  │ [Name Input]    │  │
│ │ └────┘└────┘└────┘└──│  │ [Phone Input]   │  │
│ │                       │  │                 │  │
│ │ (Scrollable)          │  │ [Checkout Btn]  │  │
│ └───────────────────────┘  └─────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 📋 Menu Management Layout

#### Mobile (375px)
```
┌─────────────────────┐
│ ☰  Menu             │
├─────────────────────┤
│ [+ Add Item]        │
├─────────────────────┤
│ Section Filter      │
│ [All] [Lodge] [Cafe]│
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Coffee          │ │
│ │ $4.00           │ │
│ │ Breakfast       │ │
│ │ [Edit] [Delete] │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Sandwich        │ │
│ │ $6.50           │ │
│ │ Main Course     │ │
│ │ [Edit] [Delete] │ │
│ └─────────────────┘ │
│                     │
│ (Scrollable List)   │
│                     │
└─────────────────────┘
```

#### Desktop (1280px)
```
┌─────────────────────────────────────────────────────────┐
│ Menu Management                          [+ Add Item]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Section Filter: [All Items] [Lodge-Dine] [Cafe-Rest]   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Name       │ Category  │ Section    │ Price │ Actions││
│ ├─────────────────────────────────────────────────────┤ │
│ │ Coffee     │ Breakfast │ Both       │ $4.00 │ [E][D]││
│ │ Sandwich   │ Main      │ Lodge      │ $6.50 │ [E][D]││
│ │ Juice      │ Beverages │ Cafe       │ $3.50 │ [E][D]││
│ │ Pasta      │ Main      │ Both       │ $9.00 │ [E][D]││
│ │ Cake       │ Desserts  │ Cafe       │ $5.50 │ [E][D]││
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Showing 5 of 50 items                    [Pagination]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard Layout Progression

### Extra Small Phone (320px)
```
┌───────────────┐
│ Dashboard     │
├───────────────┤
│               │
│ [Card]        │ ← 1 column
│ Orders: 25    │   Stacked
│               │
│ [Card]        │
│ Revenue       │
│ $1,250        │
│               │
│ [Card]        │
│ Tables: 12    │
│               │
│ [Card]        │
│ Customers     │
│ 145           │
│               │
└───────────────┘
```

### Tablet (768px)
```
┌─────────────────────────┐
│ Dashboard               │
├─────────────────────────┤
│                         │
│ [Card 1]    [Card 2]   │ ← 2 columns
│ Orders: 25  Revenue    │
│             $1,250     │
│                         │
│ [Card 3]    [Card 4]   │
│ Tables: 12  Customers  │
│             145        │
│                         │
│ [Recent Activity]       │ ← Full width
│ • Order #123            │
│ • Table reserved        │
│                         │
└─────────────────────────┘
```

### Desktop (1280px)
```
┌─────────────────────────────────────────────┐
│ Dashboard                                   │
├─────────────────────────────────────────────┤
│                                             │
│ [Card 1]  [Card 2]  [Card 3]  [Card 4]    │ ← 4 columns
│ Orders:25 Revenue   Tables:12 Customers    │
│ ↑ 12%    $1,250    ↑ 3       145          │
│           ↑ 8%     tables     ↑ 15%       │
│                                             │
│ ┌─────────────────┐ ┌──────────────────┐  │
│ │ Revenue Chart   │ │ Recent Orders    │  │
│ │                 │ │ #123  $45  Ready │  │
│ │    [Graph]      │ │ #124  $32  Prep  │  │
│ │                 │ │ #125  $67  Conf  │  │
│ └─────────────────┘ └──────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Form Layouts

### Mobile Form (375px)
```
┌─────────────────────┐
│ Add Menu Item       │
├─────────────────────┤
│                     │
│ Name *              │
│ [____________]      │ ← Full width
│                     │   Stacked
│ Category *          │   fields
│ [▼ Select__]        │
│                     │
│ Section *           │
│ [▼ Both____]        │
│                     │
│ Price *             │
│ [____________]      │
│                     │
│ Cost                │
│ [____________]      │
│                     │
│ Description         │
│ [____________]      │
│ [____________]      │
│                     │
│ ☐ Available         │
│                     │
│ [Cancel] [Save]     │
│                     │
└─────────────────────┘
```

### Desktop Form (1280px)
```
┌───────────────────────────────────────┐
│ Add Menu Item                         │
├───────────────────────────────────────┤
│                                       │
│ Name *                Category *      │ ← 2 columns
│ [___________]         [▼ Select___]   │
│                                       │
│ Section *             Price *         │
│ [▼ Both_____]         [__________]    │
│                                       │
│ Cost                                  │
│ [__________]                          │
│                                       │
│ Description                           │ ← Full width
│ [_________________________________]   │
│ [_________________________________]   │
│                                       │
│ ☐ Available for ordering              │
│                                       │
│          [Cancel]  [Save Item]        │ ← Right aligned
│                                       │
└───────────────────────────────────────┘
```

---

## 📱 Modal Behavior

### Mobile Modal (Full Screen)
```
┌─────────────────────┐
│ ✕  Edit Menu Item   │ ← Header
├─────────────────────┤
│                     │
│                     │
│   [Form Content]    │ ← Full screen
│                     │   Scrollable
│                     │
│                     │
│                     │
│                     │
│                     │
│                     │
├─────────────────────┤
│ [Cancel]   [Save]   │ ← Footer
└─────────────────────┘
```

### Desktop Modal (Centered)
```
        ┌─────────────────────────┐
        │ ✕  Edit Menu Item       │
        ├─────────────────────────┤
        │                         │
        │  [Form Fields]          │
        │  in 2 columns           │
        │                         │
        │                         │
        ├─────────────────────────┤
        │       [Cancel] [Save]   │
        └─────────────────────────┘
               ↑
          Centered on screen
          Max-width: 600px
          Drop shadow around
```

---

## 🎨 Button Size Adaptation

### Mobile Buttons (Touch-Optimized)
```
┌─────────────────────┐
│                     │
│  [   Large Btn  ]   │ ← 48px height
│  [    Tap Me    ]   │   Easy to tap
│                     │
│  [Primary] [Cancel] │ ← Side by side
│                     │   Still large
└─────────────────────┘
```

### Desktop Buttons (Mouse-Optimized)
```
┌─────────────────────────────┐
│                             │
│  [  Medium Btn  ]           │ ← 40px height
│  [  Click Me   ]            │   Smaller, precise
│                             │
│           [Primary][Cancel] │ ← Right aligned
│                             │   Grouped
└─────────────────────────────┘
```

---

## 📊 Table Responsiveness

### Mobile Table (Scrollable)
```
┌─────────────────────┐
│ Orders ➡️          │ ← Scroll indicator
├─────────────────────┤
│ ← [Scrollable] →    │
│ ┌─────┬─────┬─────┐ │
│ │ #   │Name │Total│ │ ← Essential columns
│ ├─────┼─────┼─────┤ │   Others hidden
│ │ 123 │John │$45  │ │
│ │ 124 │Jane │$32  │ │
│ └─────┴─────┴─────┘ │
│                     │
└─────────────────────┘
```

### Desktop Table (Full View)
```
┌─────────────────────────────────────────────────────┐
│ Orders                                              │
├─────────────────────────────────────────────────────┤
│ ┌────┬────────┬──────┬───────┬────────┬──────────┐ │
│ │ #  │ Name   │ Type │ Total │ Status │ Actions  │ │
│ ├────┼────────┼──────┼───────┼────────┼──────────┤ │
│ │123 │ John   │Dine  │ $45.00│ Ready  │ [V][E][X]│ │
│ │124 │ Jane   │Take  │ $32.50│ Prep   │ [V][E][X]│ │
│ │125 │ Bob    │Deliv │ $67.80│ Conf   │ [V][E][X]│ │
│ └────┴────────┴──────┴───────┴────────┴──────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Typography Scaling

```
Mobile (375px)      Tablet (768px)      Desktop (1280px)
──────────────      ──────────────      ───────────────

H1: 24px            H1: 28px            H1: 32px
H2: 20px            H2: 24px            H2: 28px
H3: 18px            H3: 20px            H3: 24px
Body: 14px          Body: 15px          Body: 16px
Small: 12px         Small: 13px         Small: 14px
```

---

## 🎨 Spacing Scale

```
Mobile              Tablet              Desktop
──────              ──────              ───────

Padding:  16px      Padding:  24px      Padding:  32px
Margin:   12px      Margin:   16px      Margin:   20px
Gap:      12px      Gap:      16px      Gap:      20px
```

---

## ✅ Responsive Checklist Visual

```
Device Tests:
☐ 📱 iPhone SE (375px)
☐ 📱 iPhone 12 (390px)
☐ 📱 iPad Mini (768px)
☐ 💻 iPad Pro (1024px)
☐ 🖥️ MacBook (1280px)
☐ 🖥️ iMac (1920px)

Feature Tests:
☐ Navigation works on all sizes
☐ Forms are easy to fill
☐ Tables are readable
☐ Buttons are tappable
☐ Modals display correctly
☐ Images scale properly
☐ Text is readable
☐ No horizontal scroll

Orientation Tests:
☐ Portrait mode
☐ Landscape mode
```

---

## 🎉 Summary

Your application adapts beautifully across:
- **Mobile:** Single column, stacked, touch-optimized
- **Tablet:** 2 columns, hybrid layout
- **Desktop:** Multi-column, sidebar visible, spacious

Every component scales appropriately for the best user experience! 🚀

---

*Visual guide for Restaurant Cafe Management System responsive design*
