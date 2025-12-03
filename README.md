# Digital Twin - Capacitor Bank Monitoring System

## ✅ LATEST UPDATE (December 3, 2025)

### **🎯 VISUAL ALIGNMENT & PRECISION STYLING**

**Final Polish:** Dashboard sekarang memiliki alignment sempurna antara grafik atas dan bawah, dengan custom legend berwarna dan checkbox layout yang simetris.

#### **1. Perfect Chart Alignment (Timeframe Synchronization)**
- **Problem Solved**: Sumbu X (waktu) pada grafik Total dan grafik Bus sekarang **tegak lurus sempurna**
- **Solution**:
  - `layout.padding`: `{ left: 10, right: 20, top: 0, bottom: 0 }` pada KEDUA chart
  - `scales.y.afterFit`: Lock Y-axis width di **60px** untuk konsistensi
  - Vertical grid lines sekarang **perfectly aligned** dari atas ke bawah
  - Single timestamp generation untuk sinkronisasi data

#### **2. Custom Colored Legend (Checkbox as Legend)**
- **Problem Solved**: Legenda default Chart.js memakan tempat dan tidak customizable
- **Solution**:
  - Chart.js legend disabled: `legend: { display: false }`
  - **Dynamic checkbox generation** dengan JavaScript
  - **Text label berwarna** sesuai garis bus (Bus 1 = #FF6384, Bus 2 = #36A2EB, dll)
  - Font-weight: 600 untuk visibility maksimal
  - Hover effect: `transform: translateY(-1px)`

#### **3. Centered Checkbox Layout**
- **Problem Solved**: Bus 12 & 13 "menggantung" di kiri, tidak simetris
- **Solution**:
  - `justify-content: center` pada flex container
  - `gap: 15px` untuk spacing konsisten
  - **SEMUA checkbox** (termasuk row terakhir) sekarang centered
  - Margin-bottom: 10px dari grafik

#### **4. Data Synchronization**
- ✅ Single timestamp variable (`timeStr`) untuk kedua chart
- ✅ Total data calculated dengan `reduce()` dari bus data aktif
- ✅ Simultaneous chart updates (no desync)

---

### **🎯 SINGLE VIEWPORT DASHBOARD (100vh Architecture)**

**Problem Solved:** Dashboard tidak lagi "tumpah" melebihi layar laptop. Seluruh komponen (Header + 2x2 Grid) terlihat SEKALIGUS tanpa scroll halaman.

#### **Key Architecture Changes:**

1. **Global 100vh Layout**
   - `body`: `height: 100vh`, `width: 100vw`, `overflow: hidden`
   - Main container: CSS Grid dengan `grid-template-rows: auto 1fr`
   - Row 1: Header (auto height ~10-15%)
   - Row 2: Content area (remaining space)

2. **2x2 Grid with Perfect 50:50 Split**
   - **Columns**: `repeat(2, minmax(0, 1fr))` ← **CRITICAL** untuk prevent table overflow
   - **Rows**: `repeat(2, 1fr)` → Equal height untuk kedua baris
   - **Gap**: `10px` (compact untuk maximize space)

3. **Component Scaling**
   - Cards: `height: 100%`, `width: 100%`, `overflow: hidden`
   - Chart containers: `position: relative` + `flex: 1` + `min-height: 0`
   - Table containers: `overflow: auto` (scroll INSIDE cell, not page)
   - Compact font: `0.75em` untuk tables

4. **Visual Optimizations**
   - Checkbox filter: Compact dengan `flex-wrap`
   - Card padding: Reduced to `10px`
   - Header: Compact `1.5em` title
   - Sticky table headers dengan `position: sticky`

---

### **UI/UX & Animation Improvements**

#### **1. Simplified Bus Naming**
- ✅ Changed from IEEE node numbers (650, 646, 645...) to simple **Bus 1 through Bus 13**
- ✅ All labels, legends, and table headers now use "Bus N" format
- ✅ Table headers: `Q_injected Bus 1`, `Q_injected Bus 2`, etc.

#### **2. Interactive Checkbox Filter**
- ✅ Added filter container above multi-line chart with 13 checkboxes
- ✅ **Default view**: Only Bus 1, Bus 2, and Bus 3 are checked (visible)
- ✅ **Real-time toggle**: Check/uncheck to show/hide bus lines instantly
- ✅ Dark theme styling with hover effects

#### **3. Smooth Animations**
- ✅ Curved lines with `tension: 0.4` for natural flow
- ✅ Fluid animations: `duration: 2000ms`, `easing: 'easeInOutQuart'`
- ✅ Smooth data transitions every 5 seconds

#### **4. Timing Updates**
- ✅ Changed update interval from **1 second** to **5 seconds** (5000ms)
- ✅ Less frequent updates = cleaner visualization

---

## 🚀 USAGE

1. Open `index.html` in a modern browser
2. Dashboard fits **PERFECTLY** in laptop screen (no scroll!)
3. System updates every **5 seconds** automatically
4. **Toggle bus visibility**: Check/uncheck boxes above the multi-line chart
5. Export data anytime using "Export" button

## 📊 Features

- **Single Viewport**: No page scroll, everything visible at once
- **Perfect 50:50 split**: Using `minmax(0, 1fr)` for column stability
- **In-cell scrolling**: Tables scroll inside their grid cells
- **Compact design**: Optimized padding and font sizes
- **Simplified naming**: Bus 1-13 (no more IEEE node numbers)
- **Interactive filters**: Real-time checkbox toggles for chart lines
- **Smooth animations**: Curved lines with fluid easeInOutQuart transitions
- **Dark mode UI** with cinematic theme
- **5-second updates** for cleaner data flow
- **Multi-sheet Excel export** with proper formatting

## 🔧 Technical Stack

- **HTML5** + **CSS3** (Flexbox + CSS Grid)
- **Chart.js 3.9.1** (Line charts with `maintainAspectRatio: false`)
- **SheetJS (XLSX)** (Excel export)
- **Vanilla JavaScript** (Event-driven checkbox filtering)

## 🎨 Layout Architecture

```
┌─────────────────────────────────────────────┐
│           HEADER (auto height)              │
├─────────────────────┬───────────────────────┤
│  Total Q_injected   │  Latest Monitoring    │
│  (Line Chart)       │  (Table with scroll)  │
│  50% width          │  50% width            │
├─────────────────────┼───────────────────────┤
│  Bus Q_injected     │  Data Injeksi per Bus │
│  (Multi-line Chart) │  (Wide Table + scroll)│
│  50% width          │  50% width            │
└─────────────────────┴───────────────────────┘
          100vh (No Page Scroll)
```

## ⚙️ Key CSS Configuration

```css
/* Global 100vh */
html, body {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

/* Main Grid */
.main-container {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100vh;
}

/* 2x2 Grid (CRITICAL) */
.monitoring-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
    height: 100%;
}

/* Chart Container */
.chart-container {
    position: relative;
    flex: 1;
    min-height: 0;
}

/* Table Scroll Inside Cell */
.table-wrapper {
    flex: 1;
    overflow: auto;
    min-height: 0;
}
```

## 📝 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (CSS Grid + Flexbox)
- Internet Explorer: ❌ Not supported (use modern browser)
