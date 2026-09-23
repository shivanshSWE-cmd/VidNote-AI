# Design System & UI/UX Specifications

**Document Version:** 1.0.0  
**Author:** Principal Software Architect & Lead Systems Engineer  
**Status:** Approved UI/UX Design System  

---

## 1. Design Philosophy

The visual design system of **VidNote AI** centers on four core principles:

1. **Minimalist & Distraction-Free:** Focus entire visual hierarchy on video content frames and selection state clarity. Eliminate superfluous decorative elements.
2. **Utility-Driven:** Provide dense, information-rich user interfaces with explicit action feedback (hover states, selection counters, status badges).
3. **High Contrast:** Ensure full compliance with WCAG AAA contrast ratios across dark mode primitives for optimal legibility during long lecture study sessions.
4. **Fluid & Responsive:** Fluid grid layouts adapting seamlessly from mobile single-column views to 4-column desktop display walls.

---

## 2. Color Palette & Token Specifications

| Token Role | Hex Code | Tailwind CSS Class | Visual Context & Usage |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#0B0F17` | `bg-[#0B0F17]` / `bg-slate-950` | Deep obsidian canvas background for main application container. |
| **Secondary Background** | `#161E2E` | `bg-[#161E2E]` / `bg-slate-900` | Card background, modal background, sticky toolbar container. |
| **Muted Background** | `#1F293D` | `bg-[#1F293D]` / `bg-slate-800` | Input fields, dropdown menus, hover background states. |
| **Border Default** | `#2A364F` | `border-[#2A364F]` / `border-slate-800` | Subtle structural divider borders around cards and inputs. |
| **Primary Accent / CTA** | `#4F46E5` | `bg-indigo-600` / `hover:bg-indigo-500` | Primary action buttons ("Extract Frames", "Generate PDF"). |
| **Accent Glow / Highlight**| `#6366F1` | `text-indigo-400` / `border-indigo-500` | Active selection state outlines and focused input rings. |
| **Selection Highlight** | `#312E81` | `bg-indigo-950/80` | Card background overlay when selected. |
| **Timestamp Badge BG** | `#000000` | `bg-black/80` (Backdrop blur) | Semi-transparent dark overlay for timecode badges on 16:9 images. |
| **Text Primary** | `#F8FAFC` | `text-slate-50` | Headings, primary button text, selected counts. |
| **Text Secondary** | `#94A3B8` | `text-slate-400` | Subtitles, helper captions, secondary labels. |
| **Error / Alert BG** | `#7F1D1D` | `bg-red-950` | Error banner background container. |
| **Error / Alert Text** | `#EF4444` | `text-red-500` / `border-red-600` | Form validation errors, stream failure toast notifications. |
| **Success / Active Badge**| `#10B981` | `text-emerald-400` / `bg-emerald-950` | Successful extraction completion badge. |

---

## 3. Typography & Hierarchy

### 3.1 Font Families
- **Primary Body & UI Font:** `Inter`, system-ui, sans-serif. Used for headings, labels, button text, and body copy.
- **Monospaced Technical Font:** `JetBrains Mono`, `ui-monospace`, monospace. Used strictly for timecodes (`00:14:00`), video IDs, file sizes, and API technical badges.

### 3.2 Type Scale & Hierarchy

```
H1: 2.25rem (36px) / Line Height 1.25 / Font Weight: 700 (Bold) / Inter
    -> Page Title ("YouTube Frame Extractor & PDF Compiler")

H2: 1.5rem (24px) / Line Height 1.33 / Font Weight: 600 (SemiBold) / Inter
    -> Section Headers ("Extracted Frames", "Export Settings")

H3 / Card Header: 1.125rem (18px) / Line Height 1.4 / Font Weight: 600 / Inter
    -> Video Title in Header Bar

Body Standard: 1.0rem (16px) / Line Height 1.5 / Font Weight: 400 (Regular) / Inter
    -> Explanatory text, modal descriptions

Label Small: 0.875rem (14px) / Line Height 1.4 / Font Weight: 500 (Medium) / Inter
    -> Input labels, layout toggle buttons

Timestamp Monospace: 0.75rem (12px) / Line Height 1.0 / Font Weight: 700 / JetBrains Mono
    -> Timecode badges overlaid on video frames (e.g. 01:23:00)
```

---

## 4. Component Layout Specifications

### 4.1 Frame Card Component (`FrameCard.tsx`)
- **Aspect Ratio:** Enforce strict `16:9` aspect ratio container (`aspect-video` Tailwind class) for frame thumbnail images to prevent layout shift.
- **Card Container:**
  - Standard State: `bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-200 cursor-pointer`
  - Selected State: `bg-indigo-950/40 border-2 border-indigo-500 rounded-xl shadow-lg shadow-indigo-500/10`
- **Selection Badge Overlay (Top-Right):**
  - 24px x 24px circular checkbox element.
  - Checked: `bg-indigo-600 text-white border-indigo-400` with Lucide `Check` icon.
  - Unchecked: `bg-slate-900/80 border border-slate-600 hover:border-indigo-400`
- **Timestamp Badge Overlay (Bottom-Left):**
  - Absolute positioning: `bottom-2 left-2`
  - Styling: `px-2 py-1 bg-black/80 backdrop-blur-md rounded text-xs font-mono font-bold text-slate-200 border border-slate-700/50`

### 4.2 Ingestion Header Form (`UrlForm.tsx`)
- Centered container (`max-w-3xl mx-auto py-8 px-4`).
- Input Bar with embedded URL icon and action button:
  - Input: `w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-36 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`
  - Interval Selector: Integrated inline dropdown menu (`15s`, `30s`, `1m`, `2m`, `5m`).

### 4.3 Sticky Export Bar (`PdfExportBar.tsx`)
- Fixed bottom screen bar: `fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 py-4 px-6`
- **Left Side:** Active counter badge (`text-slate-200 font-medium` -> "14 of 45 frames selected").
- **Center:** Layout mode toggle pill (`1 Frame / Page` vs `2 Frames / Page`).
- **Right Side:** "Select All", "Deselect All" text buttons + Primary CTA "Export PDF" button (`bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-600/25 transition-all`).

### 4.4 Full-Screen Lightbox Modal (`ModalPreview.tsx`)
- Overlay backdrop: `fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4`
- Centered high-resolution image container preserving native aspect ratio.
- Navigation arrows (`chevron-left`, `chevron-right`) positioned on left/right screen edges.
