# VendorBridge Screen Specifications

Each screen spec describes: purpose, layout, key components, data sources, and actions.

---

## Screen 1 — Login (`/`)

**Purpose:** Authenticate users, redirect to dashboard.

**Layout:** Split-screen — left dark branding panel, right white form.

**Left panel (`#0f1117`):**
- "VendorBridge" in white, 32px bold
- Subtitle: "Procurement & Vendor Management ERP"
- 3 bullet points: Manage Vendors / Track RFQs / Generate Invoices

**Right panel (white):**
- "Welcome Back" heading, "Sign in to your account" subtext
- Email input + Password input (with show/hide toggle)
- "Forgot Password?" link right-aligned
- Green "Sign In" primary button (full width)
- "Don't have an account? Register" link

**Actions:**
- On submit: `supabase.auth.signInWithPassword()` → navigate to `/dashboard`
- On error: show inline error below button

**Validation:** email format required, password min 6 chars.

---

## Screen 2 — Register (`/register`)

**Purpose:** Create a new account with role selection.

**Layout:** Centered white card on `#f4f5f7` background.

**Form fields (2-column grid):**
- Profile photo upload circle (optional, placeholder silhouette)
- First Name | Last Name
- Email Address | Phone Number
- Role dropdown (Admin / Procurement Officer / Manager / Vendor) | Country
- Additional Information textarea (full width, optional)
- "Register" green button (full width)
- "Already have an account? Sign In" link

**Actions:**
- `supabase.auth.signUp()` then insert into `profiles` table
- Navigate to `/dashboard` on success

---

## Screen 3 — Dashboard (`/dashboard`)

**Purpose:** Overview of procurement activity at a glance.

**Layout:** Sidebar + main content.

**Top:** Page title "Dashboard", user greeting with role, date.

**Stats row (4 KPI cards):**
- Active RFQs (green) — count from `rfqs` where status='Open'
- Pending Approvals (amber) — count from `purchase_orders` where status='Pending'
- Total Spend (blue) — sum of `grand_total` from approved POs
- Invoices Pending (red) — count

**Recent Purchase Orders table:**
- Columns: PO Number | Vendor | Amount | Status | Date
- Last 5 records from `purchase_orders` joined with `quotations → vendors`

**Quick Actions row:**
- "New RFQ" → navigate to `/rfqs/create`
- "Add Vendor" → navigate to `/vendors` (focus add form)
- "View Invoices" → navigate to `/purchase-orders`

**Monthly Trend chart:**
- Bar chart (Recharts) — group POs by month, sum grand_total

---

## Screen 4 — Vendors (`/vendors`)

**Purpose:** Full CRUD for vendor records.

**Top:** "Vendors" heading + "+ Add Vendor" green button.

**Search/Filter bar:**
- Text search (name, GST, category)
- Category dropdown filter
- Status dropdown filter (Active / Inactive / Pending)

**Vendors table:**
- Columns: Name | Category | GST Number | Contact | Location | Status | Actions
- Status: color-coded badge
- Actions: "Edit" icon button, "Toggle Status" icon button

**Add Vendor:**
- Slide-over panel or modal with: Name, Category, GST, Phone, Email, Location
- On save: insert to `vendors` table, log to activity

---

## Screen 5 — RFQ Creation (`/rfqs/create`)

**Purpose:** Create a new Request for Quotation.

**Layout:** 3-step form with horizontal step indicator at top.

**Step 1 — RFQ Details:**
- RFQ Title (text input)
- Category dropdown
- Priority dropdown (Low / Medium / High / Urgent)
- Deadline date picker | Expected Delivery date picker
- Description textarea
- File attachment drop zone (for reference docs)

**Step 2 — Add Items:**
- Table with rows: Item Name | Quantity | Unit | Target Price | Delete button
- "+ Add Item" button to add rows
- Must have at least 1 item to proceed

**Step 3 — Assign Vendors:**
- Checkbox list of all active vendors grouped by category
- "Select All" toggle

**Bottom actions:**
- "Save as Draft" (outlined) — saves with status='Draft'
- "Save & Send to Vendors" (green) — saves with status='Open', logs activity

---

## Screen 6 — Quotations (`/quotations`)

**Purpose:** Vendor submits a quote in response to an RFQ.

**Top:** Shows RFQ title, deadline, status badge.

**RFQ Items summary (read-only card):**
- Table showing items the buyer requested: Name | Qty | Unit

**Quotation Form:**
- Editable table: Item Name | Unit Price | Qty | Total (auto-calc) | Notes
- Delivery Timeline (days input)
- Payment Terms dropdown
- Validity Period (days input)
- Additional Notes textarea

**Quotation Summary box:**
- Sub Total, GST 18%, Grand Total (bold green)

**Actions:**
- "Save Draft" / "Submit Quotation" (green)
- On submit: insert to `quotations` table

---

## Screen 7 — Quotation Comparison (`/quotations/compare`)

**Purpose:** Side-by-side comparison of vendor quotes for one RFQ.

**Top:** RFQ title, number of quotations received, "Proceed to Approval" button.

**Comparison table:**
- First column: criteria labels (items, totals, delivery, terms, rating)
- One column per vendor
- Lowest value in each row highlighted with green background + bold
- Recommended vendor column has green header + "LOWEST PRICE" badge

**Row groups:**
1. Item prices (one row per RFQ item)
2. Sub Total / GST / Grand Total
3. Delivery Timeline
4. Payment Terms
5. Vendor Rating (stars)

**Actions per vendor column:**
- "Select & Approve" green button (only on recommended vendor)
- "Reject" outlined red button

---

## Screen 8 — Approvals (`/approvals`)

**Purpose:** Manager reviews and approves/rejects procurement requests.

**Layout:** Horizontal stepper + two-column content + timeline.

**3-step stepper:**
1. Quotation Selected ✓ (green)
2. Manager Review (active, pulsing)
3. Final Approval (grey)

**Left panel — Procurement Summary card:**
- RFQ Title, Selected Vendor, Amount, Delivery, Payment Terms, Submitted By, Date

**Right panel — Approval Action card:**
- "Approval Remarks" textarea (required before deciding)
- "Approve" green button (half width) | "Reject" red button (half width)
- "Request More Info" text link

**Approval Timeline (full width below):**
- Vertical list: RFQ Created → Quotations Received → Quote Selected → Pending Approval → PO Generated
- Each step shows: icon, label, user, timestamp

**Actions:**
- Approve: update `purchase_orders` status to 'Approved', log activity, generate PO number
- Reject: update status to 'Rejected', log activity

---

## Screen 9 — Purchase Orders & Invoices (`/purchase-orders`)

**Purpose:** View generated POs, download/print/email invoices.

**Top action bar:**
- "Download PDF" button (outlined, download icon)
- "Print" button (outlined, print icon)
- "Email to Vendor" button (outlined, mail icon)

**Invoice Document card** (looks like a real printed document):

*Header:*
- Left: VendorBridge name + address
- Right: "TAX INVOICE" label, PO Number, Invoice Date, Due Date

*Vendor Info (2-col):*
- Bill From: vendor name, address, GST
- Bill To: buyer org name, address, GST

*Items table:* # | Description | Qty | Unit | Unit Price | Total

*Totals (right-aligned):*
- Sub Total, GST 18%, **Grand Total** (bold, green, larger)

*Footer:* Payment terms, signature line.

**Actions:**
- Download: call `generateInvoicePDF()` from data-layer.md
- Print: `window.print()`
- Email: update `sent_at` in `purchase_orders`, show success toast

---

## Screen 10 — Activity & Logs (`/activity`)

**Purpose:** Procurement audit trail for all users.

**Top:** Filter tabs: All | RFQs | Approvals | Invoices | Vendors
Right: date range picker + "Export Logs" button.

**Info banner (dismissible):**
- Blue: e.g. "3 quotations received for RFQ: Office Furniture Q2. View Now →"

**Activity Feed (vertical list):**
Each item:
- Colored dot (green=created/approved, blue=system/received, amber=pending, red=rejected)
- Bold action text + grey details
- User name + timestamp right-aligned
- Activity type badge (pill)

Fetch from `activity_logs` table joined with `profiles`.

**Notifications panel (right column):**
- 3 compact notification cards: warning, success, info variants

---

## Screen 11 — Reports (`/reports`)

**Purpose:** Analytics and procurement insights.

**Top:** "Reports & Analytics" + month/year selector + "Export Report" outlined button.

**4 KPI metric cards:** Total Spend | Active Vendors | On-Time Delivery % | Monthly POs

**Spend by Category (Recharts HorizontalBarChart):**
- Categories: IT Hardware, Furniture, Stationery, Logistics
- Green bars, label left, amount right
- Fetch: group `purchase_orders` by vendor category, sum grand_total

**Top Vendors by Spend (table):**
- Columns: Vendor | Spend (₹) | POs
- Fetch: join purchase_orders → quotations → vendors, aggregate

**Monthly Procurement Trend (Recharts BarChart, full width):**
- 6-month bar chart
- Green bars, current month highlighted
- Fetch: group purchase_orders by month of created_at
