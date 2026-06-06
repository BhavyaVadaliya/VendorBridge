# VendorBridge — Complete Hackathon Guide
## Antigravity Prompts + Developer Action Guide

---

# PART 1: ALL ANTIGRAVITY PROMPTS (Copy-Paste Ready)

> Paste each prompt separately into Antigravity. Each is self-contained.
> Design System to maintain across ALL screens:
> - Color: Dark sidebar (#0f1117), White main area, Green accent (#22c55e), Dark cards
> - Font: Professional sans-serif, clean hierarchy
> - Layout: Left sidebar navigation + main content area
> - Branding: "VendorBridge" logo top-left sidebar

---

## PROMPT 1 — Login Screen

```
Design a professional Login screen for "VendorBridge", a Procurement & Vendor Management ERP web application.

Layout:
- Split screen layout: left side has dark background (#0f1117) with VendorBridge branding, logo, and tagline "Simplify. Digitize. Procure."
- Right side has white/light background with the login form

Login Form (right side):
- Heading: "Welcome Back" in bold, subtext: "Sign in to your account"
- Input field: "Email Address" with email icon
- Input field: "Password" with eye toggle icon to show/hide
- "Forgot Password?" link aligned right below password field
- Large primary button: "Sign In" — green (#22c55e) background, white text, full width
- Divider line with "OR"
- Text below: "Don't have an account?" with "Register" link in green

Left branding panel:
- Dark background (#0f1117)
- "VendorBridge" logo text, large and bold, white
- Subtitle: "Procurement & Vendor Management ERP"
- 3 bullet points with checkmark icons listing: "Manage Vendors", "Track RFQs", "Generate Invoices"
- Bottom: version tag or copyright text

Style rules:
- No gradients, no purple, no generic AI look
- Sharp, enterprise-grade aesthetic — think SAP or Odoo login
- Input fields have subtle border, rounded corners, grey placeholder text
- Green is used ONLY for the primary CTA button
- Use Geist or DM Sans or similar professional font
- Mobile responsive
- No background images or illustrations — keep it clean and corporate
```

---

## PROMPT 2 — Registration Screen

```
Design a professional Registration / Sign Up screen for "VendorBridge" ERP.

Layout:
- Centered card on a light grey background (#f4f5f7)
- VendorBridge logo at top center
- Heading: "Create Your Account", subtext: "Join VendorBridge to manage procurement"

Form fields (in a clean 2-column grid where applicable):
- Profile photo upload circle at top center (click to upload, shows placeholder silhouette)
- Row 1: "First Name" | "Last Name"
- Row 2: "Email Address" | "Phone Number"
- Row 3: "Role" dropdown (options: Admin, Procurement Officer, Manager/Approver, Vendor) | "Country" dropdown
- Full-width textarea: "Additional Information" (optional, placeholder: "Tell us about your organization...")
- Full-width primary button: "Register" — green (#22c55e) background, white text
- Below button: "Already have an account?" with "Sign In" link in green

Style rules:
- Clean white card with subtle box shadow
- Labels above each input field, small and grey
- Consistent 12px gap between fields
- Photo upload circle: dashed border, grey background, camera icon in center
- No animations needed, focus on clarity
- Enterprise / professional aesthetic, not startup-casual
- Fully responsive
```

---

## PROMPT 3 — Dashboard / Home Screen

```
Design the main Dashboard screen for "VendorBridge" ERP — a Procurement & Vendor Management platform.

Overall Layout:
- Left sidebar (dark, #0f1117, fixed, 220px wide) with:
  - "VendorBridge" logo at top
  - Navigation links with icons: Dashboard, Vendors, RFQs, Quotations, Approvals, Purchase Orders, Invoices, Reports, Activity
  - "Dashboard" link is currently active (highlighted in green #22c55e with left border indicator)
  - User avatar + name at bottom of sidebar

- Main content area (white/light grey #f8f9fa background):

Top bar:
  - Heading: "Dashboard"
  - Subtext: "Welcome back, Procurement Officer — Today's Overview"
  - Right side: date/time display

Stats row (4 metric cards in a grid):
  - Card 1: "12 Active RFQs" — icon: document, green accent
  - Card 2: "5 Pending Approvals" — icon: clock, amber/yellow accent
  - Card 3: "$2.3M POs this year" — icon: dollar, blue accent
  - Card 4: "3 invoices pending" — icon: receipt, red accent
  - Each card: white background, subtle shadow, number large and bold, label small and grey

Recent Activity table section:
  - Section heading: "Recent Purchase Orders"
  - Table columns: PO Number | Vendor | Amount | Status | Date
  - 3-4 sample rows with status badges (Approved = green, Pending = amber, Rejected = red)
  - "View All" link top-right of section

Quick Action buttons row:
  - "New RFQ" button (green, filled)
  - "Add Vendor" button (outlined, dark border)
  - "View Invoices" button (outlined)

Analytics card (right column or bottom):
  - Simple bar chart placeholder showing "Monthly Procurement Trend"
  - Clean chart with 6 month bars, green color

Style rules:
- Sidebar dark (#0f1117), main area light (#f8f9fa), cards white
- Green (#22c55e) for active states, primary actions, and positive metrics
- Amber for warnings, red for alerts, blue for neutral info
- Professional ERP look — no gradients, no illustrations
- Consistent 24px padding in main content area
```

---

## PROMPT 4 — Vendor Management Screen

```
Design the Vendor Management screen for "VendorBridge" ERP.

Overall Layout:
- Same left sidebar (dark #0f1117) with "Vendors" nav item active
- Main content area with white background

Top section:
- Page heading: "Vendors" (bold, large)
- Subtext: "Manage supplier profiles and registrations"
- Right side: "+ Add Vendor" button (green #22c55e, white text)

Filter/Search bar row:
- Search input: "Search by name, GST, category..." with search icon
- Filter dropdowns: "Category" | "Status" (Active / Inactive / Pending)
- "Filter" button and "Export" button (outlined)

Vendor table:
- Columns: Vendor Name | Category | GST Number | Contact | Location | Status | Actions
- 5 sample vendor rows:
  Row 1: TechCorp Ltd | IT Hardware | 22AAAAA0000A1Z5 | +91-9876543210 | Mumbai | Active (green badge) | View / Edit buttons
  Row 2: Infra Supplies | Furniture | 27BBBBB1111B2Y6 | +91-9988776655 | Delhi | Active (green badge)
  Row 3: StatioMart | Stationery | 29CCCCC2222C3X7 | +91-8877665544 | Bangalore | Inactive (grey badge)
  Row 4: FurnCo | Furniture | 24DDDDD3333D4W8 | +91-7766554433 | Chennai | Pending (amber badge)
  Row 5: LogiPro | Logistics | 33EEEEE4444E5V9 | +91-6655443322 | Pune | Active (green badge)
- Actions column: small "View" and "Edit" text buttons or icon buttons
- Table has alternating row shading (very subtle, #f9f9f9 alternate rows)

Pagination at bottom: showing "Showing 1-5 of 24 vendors" with prev/next buttons

Style rules:
- Table header: light grey background, bold column labels
- Status badges: pill shape, color-coded (green=Active, grey=Inactive, amber=Pending)
- No illustration or empty state needed — table has data
- Consistent with dashboard sidebar and header style
- "+ Add Vendor" modal is NOT required — just show the button
```

---

## PROMPT 5 — RFQ Creation Screen

```
Design the RFQ (Request for Quotation) Creation screen for "VendorBridge" ERP.

Overall Layout:
- Same dark sidebar, "RFQs" nav item active
- Main area: multi-step form layout

Top section:
- Breadcrumb: "RFQs > Create New RFQ"
- Page heading: "Create RFQ"
- Subtext: "New request for quotation"
- Step indicator at top right showing 3 steps: [1. RFQ Details] [2. Add Items] [3. Assign Vendors]
  - Step 1 is currently active (filled green circle), others are outlined grey

Step 1 Form — "RFQ Details" (currently visible):
Left column:
- "RFQ Title" text input (e.g. "Office Furniture Procurement Q2")
- "Category" dropdown (IT Hardware / Furniture / Stationery / Logistics / Other)
- "Priority" dropdown (Low / Medium / High / Urgent)

Right column:
- "RFQ Deadline" date picker input
- "Expected Delivery Date" date picker input
- "Description" textarea (multi-line, placeholder: "Describe the procurement requirement...")

Full width below:
- "Attachments" drag-and-drop zone: dashed border box, upload icon, text "Drag files here or click to upload", accepts PDF/XLSX/DOC

Bottom action buttons:
- Left: "Save as Draft" button (outlined, grey)
- Right: "Save & Send to Vendors" primary button (green, filled)

Step 2 preview (collapsed/next state, show as inactive tab):
- Will show: Item Name | Quantity | Unit | Target Price | Add Row button

Step 3 preview (collapsed/next state):
- Will show: Vendor selection checkboxes

Style:
- Clean form layout, 2-column grid where applicable
- Step indicator uses numbered circles: active = green filled, done = green with checkmark, inactive = grey outlined
- Form inputs match design system: white background, grey border, rounded
- Professional, structured ERP form aesthetic
```

---

## PROMPT 6 — Vendor Quotation Submission Screen

```
Design the Vendor Quotation Submission screen for "VendorBridge" ERP.

Context: A vendor has received an RFQ invitation and is submitting their price quote.

Overall Layout:
- Same dark sidebar, "Quotations" nav item active
- Main content area

Top section:
- Breadcrumb: "Quotations > Submit Quotation"
- Page heading: "Submit Quotations"
- Subtext: "RFQ: Office Furniture Procurement Q2 — deadline 15 June 2025"
- Right badge showing RFQ status: "Open" (green)

RFQ Summary card (read-only info box, grey background):
- Items listed: 3 rows showing Item Name | Required Qty | Unit
  Row 1: Executive Chair | 20 | Pcs
  Row 2: Office Desk (L-shape) | 10 | Pcs
  Row 3: Bookshelf | 5 | Pcs

Quotation Form below:
- Table with columns: Item Name | Your Unit Price (₹) | Quantity | Total (₹) | Notes
- Pre-filled item names from RFQ, editable price fields
- Auto-calculated Total column
- "+ Add Item" small text link below table to add custom items

Below table:
- "Delivery Timeline" input: "Estimated delivery in ___ days" (number input)
- "Payment Terms" dropdown: Net 30 / Net 60 / Advance / COD
- "Validity Period" input: "Quote valid for ___ days"
- "Additional Notes" textarea

Quotation Summary card (right side or bottom):
- Sub Total: ₹20,000
- GST (18%): ₹3,600
- Grand Total: ₹23,600 (bold, larger text)

Action buttons:
- "Save Draft" (outlined)
- "Submit Quotation" (green, filled, primary)

Style:
- Clean form with pricing table
- Total column auto-highlighted in light green background
- Grand Total displayed prominently in a summary box
- Professional vendor portal aesthetic
```

---

## PROMPT 7 — Quotation Comparison Screen

```
Design the Quotation Comparison screen for "VendorBridge" ERP.

Context: Procurement Officer compares quotations from multiple vendors for the same RFQ.

Overall Layout:
- Same dark sidebar, "Quotations" nav item active
- Main content area

Top section:
- Breadcrumb: "RFQs > Office Furniture Q2 > Compare Quotations"
- Page heading: "Quotation Comparison"
- Subtext: "RFQ: Office Furniture Procurement Q2 — 3 quotations received"
- Right: "Proceed to Approval" button (green, filled)

Comparison Table (main element of this screen):
- First column: Item/criteria labels (sticky left)
- 3 vendor columns: "Infra Supplies" | "TechCore Ltd" | "FurnCo"
- The lowest-price vendor column (Infra Supplies) has a green header with "LOWEST PRICE" badge

Rows in comparison table:
  RFQ Item Rows:
  - Executive Chair (20 pcs): ₹4,000 | ₹4,500 | ₹3,800 (3,800 highlighted green — lowest)
  - Office Desk (10 pcs): ₹12,000 | ₹11,500 | ₹13,000 (11,500 highlighted green)
  - Bookshelf (5 pcs): ₹1,200 | ₹1,000 | ₹1,100 (1,000 highlighted green)
  Separator row
  - Sub Total: ₹85,000 | ₹82,000 | ₹89,000
  - GST (18%): ₹15,300 | ₹14,760 | ₹16,020
  - Grand Total: ₹1,00,300 | ₹96,760 | ₹1,05,020 (₹96,760 bold + green — lowest)
  Separator row
  - Delivery Timeline: 15 days | 12 days | 18 days (12 days highlighted green)
  - Payment Terms: Net 30 | Net 30 | Advance
  - Validity: 30 days | 45 days | 30 days
  - Vendor Rating: ⭐⭐⭐⭐ (4.2) | ⭐⭐⭐⭐⭐ (4.8) | ⭐⭐⭐ (3.5)

Below table:
- "Select & Approve" button under recommended vendor column (green)
- "Reject All" button (outlined red)

Note text at bottom: "Select preferred vendor to initiate approval workflow"

Style:
- Table has clear column separation with borders
- Lowest price cells: light green background (#dcfce7), green text
- Recommended column: subtle green left border or header highlight
- Horizontal scroll on smaller screens
- "LOWEST PRICE" badge: green pill in column header
- Rating shown as star icons + number
```

---

## PROMPT 8 — Approval Workflow Screen

```
Design the Approval Workflow screen for "VendorBridge" ERP.

Context: A Manager/Approver reviews and approves or rejects a procurement request.

Overall Layout:
- Same dark sidebar, "Approvals" nav item active
- Main content area

Top section:
- Breadcrumb: "Approvals > Review"
- Page heading: "Approval Workflow"
- Subtext: "RFQ: Office Furniture Q2 — Vendor: Infra Supplies — ₹95,400"

Approval Progress Stepper (horizontal, top of content):
- 3 steps shown: [1. Quotation Selected ✓] → [2. Manager Review (active)] → [3. Final Approval]
- Step 1: green filled checkmark (completed)
- Step 2: green outlined circle, pulsing or bold (current)
- Step 3: grey outlined circle (pending)

Left panel — Procurement Summary card:
- RFQ Title: Office Furniture Procurement Q2
- Selected Vendor: Infra Supplies
- Quotation Amount: ₹95,400
- Delivery Timeline: 15 Days
- Payment Terms: Net 30
- Submitted by: John Doe (Procurement Officer)
- Submission date: 22 May 2025

Right panel — Approval Action card:
- Heading: "Review & Decision"
- "Approval Remarks" textarea (placeholder: "Add your comments or remarks...")
- Two large action buttons side by side:
  - "Approve" button: green background (#22c55e), white text, checkmark icon, full width half
  - "Reject" button: red background (#ef4444), white text, X icon, full width half
- Below: "Request More Information" link text (grey)

Approval Timeline (below both panels, full width):
- Vertical timeline showing:
  Entry 1: ✓ green — "RFQ Created" — John Doe — 10 May 2025
  Entry 2: ✓ green — "Quotations Received (3)" — System — 18 May 2025
  Entry 3: ✓ green — "Best Quote Selected" — John Doe — 22 May 2025
  Entry 4: 🔵 blue (current) — "Pending Manager Approval" — Awaiting...
  Entry 5: ○ grey — "Purchase Order Generation" — Pending

Style:
- Left/right panels side by side on desktop, stacked on mobile
- Approve button large and prominent — this is the primary action
- Timeline: vertical line with dots, clean and minimal
- Status progression clearly visible
- Professional workflow UI, not colorful
```

---

## PROMPT 9 — Purchase Order & Invoice Screen

```
Design the Purchase Order & Invoice screen for "VendorBridge" ERP.

Context: After approval, a PO is auto-generated and an invoice can be created from it.

Overall Layout:
- Same dark sidebar, "Invoices" nav item active
- Main content area

Top section:
- Page heading: "Purchase Order & Invoice"
- Subtext: "PO-2024 auto-generated after approval"
- Action buttons row (right aligned):
  - "Download" button (outlined, download icon)
  - "Print" button (outlined, print icon)  
  - "Email" button (outlined, email icon)

PO/Invoice Document area (white card, looks like a printed document):

Header section:
- Left: "VendorBridge" company logo/name, address details
- Right: "PURCHASE ORDER" or "TAX INVOICE" label (large, grey)
  PO Number: PO-2025-7098
  Invoice Date: 25 May 2025
  Due Date: 25 June 2025

Vendor & Billing Info (2 column):
- Left: "Bill From:" — Infra Supplies, address, GST number
- Right: "Bill To:" — Buyer Organization name, address, GST

Items Table:
- Columns: # | Item Description | Qty | Unit | Unit Price | Total
- Row 1: 1 | Executive Chair | 20 | Pcs | ₹4,000 | ₹80,000
- Row 2: 2 | Office Desk (L-shape) | 10 | Pcs | ₹12,000 | ₹1,20,000 (not needed, keep 2-3 items)
- Row 3: 3 | Bookshelf | 5 | Pcs | ₹1,200 | ₹6,000

Totals section (right aligned):
- Sub Total: ₹ 2,06,000
- GST (18%): ₹ 37,080
- Grand Total: ₹ 2,43,080 (large, bold, green)

Footer of document:
- "Terms: Payment due within 30 days"
- Authorized signature line

Status badge at top of document: "APPROVED" (green) or "PENDING" (amber)

Below document:
- Note: "Invoice will be sent to vendor@infrasupplies.com" in small grey text

Style:
- The PO/Invoice itself looks like a real printed document — clean white card, subtle border
- Outside the document: standard ERP UI with sidebar
- Download/Print/Email buttons prominent
- Grand Total row: larger font, green color, bold
- Professional accounting document aesthetic
```

---

## PROMPT 10 — Activity Logs & Notifications Screen

```
Design the Activity & Logs screen for "VendorBridge" ERP.

Context: Shows procurement audit trail and system notifications.

Overall Layout:
- Same dark sidebar, "Activity" nav item active
- Main content area

Top section:
- Page heading: "Activity & Logs"
- Subtext: "Procurement audit trail"
- Filter tabs: All | RFQs | Approvals | Invoices | Vendors (tab-style, "All" active with green underline)
- Right: Date range filter + "Export Logs" button (outlined)

Notification/Alert banner (top, dismissible):
- Blue info banner: "3 quotations received for RFQ: Office Furniture Q2. Ready for comparison." with "View Now →" link

Activity Feed (main content):
Vertical list of activity items, each item has:
- Left: colored circle icon (color = activity type)
- Middle: bold action text + grey details text + timestamp
- Right: small link or badge

Sample entries (5-6):
1. 🟢 (green dot) — "RFQ Office Furniture Q2 created and sent to 3 vendors" — John Doe · 10 May 2025, 9:30 AM
2. 🔵 (blue dot) — "Quotation received from Infra Supplies — ₹95,400" — System · 15 May 2025, 2:15 PM
3. 🔵 (blue dot) — "Quotation received from TechCore Ltd — ₹96,760" — System · 16 May 2025, 11:00 AM
4. 🟡 (amber dot) — "PO #PO-2025-7098 pending approval by Manager" — John Doe · 22 May 2025, 4:45 PM
5. 🟢 (green dot) — "Purchase Order PO-2025-7098 approved by Sarah Manager" — Sarah Johnson · 23 May 2025, 10:00 AM
6. 🔵 (blue dot) — "Invoice INV-2025-0234 generated and sent to vendor email" — System · 24 May 2025, 3:00 PM

Each entry:
- White card with subtle border
- Timestamp in small grey text
- Activity type badge (RFQ, Quotation, Approval, Invoice) as small pill

Notifications panel (right sidebar or bottom section):
- Heading: "Recent Notifications"
- 3 notification cards:
  - "RFQ deadline approaching in 2 days" (amber warning)
  - "Invoice INV-0234 sent successfully" (green success)
  - "New vendor TechParts registered" (blue info)

Style:
- Activity feed: vertical timeline-style list
- Color-coded dots for activity type
- Clean card per entry, no heavy borders
- Notifications: right column, compact cards with icon
```

---

## PROMPT 11 — Reports & Analytics Screen

```
Design the Reports & Analytics screen for "VendorBridge" ERP.

Overall Layout:
- Same dark sidebar, "Reports" nav item active
- Main content area

Top section:
- Page heading: "Reports & Analytics"
- Subtext: "Procurement Insights — May 2025"
- Right side: Month/Year selector dropdown (showing "May 2025") + "Export Report" button (outlined)

4 KPI Metric cards in a row:
- Card 1: "₹2.4L" — "Total Spend" — green up-arrow trend icon
- Card 2: "28" — "Active Vendors"
- Card 3: "94%" — "On-Time Delivery" — green percentage
- Card 4: "3" — "Monthly POs"

Main analytics section (2 column layout):

LEFT COLUMN — Spend by Category (donut/bar chart):
- Section heading: "Spend by Category"
- Horizontal bar chart showing:
  IT Hardware   ——————————— ₹94,6L  (green bar, widest)
  Furniture     —————————— ₹93,2L
  Stationery    ——— ₹2,1L
  Logistics     —— ₹2,3L
- Each bar: green fill with category label left, amount right

RIGHT COLUMN — Top Vendors by Spend (table):
- Section heading: "Top Vendors by Spend"
- Columns: Vendor | Spend (₹) | POs
  TechCore Ltd | ₹4,20,000 | 6
  Infra Supplies | ₹3,10,000 | 4
  FurnCo | ₹1,00,000 | 2
  LogiPro | ₹80,000 | 3

Bottom section — Monthly Procurement Trend (full width):
- Section heading: "Monthly Trend"
- Bar chart (6 months): Jan | Feb | Mar | Apr | May | Jun
- Bars in green, May bar highlighted (tallest)
- Y-axis: ₹ amounts, X-axis: months
- Clean chart, no gridlines clutter

Style:
- KPI cards: white background, large bold number, small grey label, colored trend arrow
- Charts: use green (#22c55e) as primary chart color
- No interactive chart libraries needed — use SVG or CSS bars to represent data visually
- Tables: clean, minimal, alternating rows
- Section headings: grey, uppercase, small tracking
- Professional analytics dashboard aesthetic — think Tableau or Power BI aesthetic
```

---

# PART 2: DEVELOPER ACTION GUIDE

## Step 1 — Project Setup (Day 1 Morning)

### Initialize the project:
```bash
npm create vite@latest vendorbridge -- --template react
cd vendorbridge
npm install
npm install react-router-dom @supabase/supabase-js
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npm install jspdf jspdf-autotable
npm install react-hook-form
npm install recharts
npx tailwindcss init -p
```

### Folder structure to create:
```
src/
  pages/         ← One file per Antigravity screen
  components/    ← Sidebar, Header, StatusBadge, etc.
  lib/
    supabase.js  ← Supabase client setup
  context/
    AuthContext.jsx
```

---

## Step 2 — Supabase Setup (Day 1 Morning)

### Where to go:
1. Go to **supabase.com** → Sign up free
2. Create new project: "vendorbridge"
3. Wait ~2 minutes for provisioning
4. Go to **Settings → API** → copy:
   - Project URL
   - anon/public key

### Create `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'YOUR_URL_HERE'
const SUPABASE_ANON_KEY = 'YOUR_KEY_HERE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Run this SQL in Supabase SQL Editor (Table Editor → SQL):
```sql
-- Users table (Supabase auth handles passwords automatically)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('admin','officer','vendor','manager')),
  phone text,
  country text,
  created_at timestamptz default now()
);

-- Vendors
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  gst_number text,
  contact_phone text,
  email text,
  location text,
  status text default 'Active',
  created_at timestamptz default now()
);

-- RFQs
create table rfqs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  priority text,
  deadline date,
  description text,
  status text default 'Open',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Quotations
create table quotations (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid references rfqs(id),
  vendor_id uuid references vendors(id),
  total_price numeric,
  delivery_days integer,
  payment_terms text,
  status text default 'Submitted',
  created_at timestamptz default now()
);

-- Purchase Orders
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid references quotations(id),
  po_number text unique,
  status text default 'Pending',
  approved_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Activity Logs
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

## Step 3 — Connect Antigravity Screens to Supabase

### After pasting each Antigravity prompt, add this data layer:

#### Login Page — add this logic:
```javascript
import { supabase } from '../lib/supabase'

const handleLogin = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) alert(error.message)
  else navigate('/dashboard')
}
```

#### Vendors Page — fetch real vendors:
```javascript
const [vendors, setVendors] = useState([])

useEffect(() => {
  supabase.from('vendors').select('*').then(({ data }) => setVendors(data))
}, [])
```

#### Dashboard — fetch counts:
```javascript
const { count: rfqCount } = await supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('status', 'Open')
const { count: poCount } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
```

---

## Step 4 — Invoice PDF Generation

### After Antigravity builds the Invoice screen, add this function:
```javascript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const downloadInvoice = (invoiceData) => {
  const doc = new jsPDF()
  doc.setFontSize(20)
  doc.text('VendorBridge', 20, 20)
  doc.setFontSize(12)
  doc.text(`Invoice: ${invoiceData.po_number}`, 20, 35)
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45)

  autoTable(doc, {
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: invoiceData.items.map(item => [
      item.name, item.qty, `₹${item.price}`, `₹${item.total}`
    ]),
    startY: 60
  })

  doc.save(`Invoice-${invoiceData.po_number}.pdf`)
}
```

---

## Step 5 — Git Strategy (REQUIRED by Odoo)

```bash
# Setup (Team Lead does this once)
git init
git remote add origin YOUR_GITHUB_REPO_URL

# Branch strategy
git checkout -b dev          # integration branch
git checkout -b feature/auth # each member's feature

# Each member workflow
git checkout -b feature/YOUR_MODULE
# work on code...
git add .
git commit -m "feat: add vendor listing page"
git push origin feature/YOUR_MODULE
# then open Pull Request to dev on GitHub
```

### Assign modules to team members:
- Member 1: Auth (Login/Register) + Sidebar layout
- Member 2: Vendors + RFQ screens
- Member 3: Quotations + Comparison + Approvals
- Member 4: PO/Invoice + Reports + Activity Logs

---

## Step 6 — Routing Setup

### `src/App.jsx`:
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import RFQCreate from './pages/RFQCreate'
import Quotations from './pages/Quotations'
import QuotationCompare from './pages/QuotationCompare'
import Approvals from './pages/Approvals'
import PurchaseOrders from './pages/PurchaseOrders'
import ActivityLogs from './pages/ActivityLogs'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/rfqs/create" element={<RFQCreate />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/compare" element={<QuotationCompare />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/activity" element={<ActivityLogs />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Step 7 — Quick Checklist Before Demo

- [ ] All 11 screens navigable via sidebar
- [ ] Login/logout works (Supabase Auth)
- [ ] Vendors list loads from Supabase (not hardcoded)
- [ ] Can create an RFQ (saves to DB)
- [ ] Invoice PDF downloads correctly
- [ ] Git has commits from all team members
- [ ] Responsive on laptop screen
- [ ] No console errors on page load
- [ ] Status badges color-coded correctly
- [ ] Sidebar active state updates on navigation

---

## Common Antigravity Tips

- After pasting a prompt, if the layout is off, add: *"Make it more like a professional ERP dashboard, less startup-style"*
- If sidebar is missing: *"Add the same dark sidebar from the previous screens with all navigation links"*
- For consistency: *"Use the exact same sidebar, color scheme, and typography as the dashboard screen I built earlier"*
- For mobile: *"Make the sidebar collapsible on mobile screens with a hamburger menu"*

---

*VendorBridge — Odoo ERP Hackathon | Built with React + Supabase + Tailwind*
