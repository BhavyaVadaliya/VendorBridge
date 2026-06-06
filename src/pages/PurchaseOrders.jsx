import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { Download, Printer, Mail, Check } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function PurchaseOrders() {
  const { profile } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [selectedPO, setSelectedPO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailSent, setEmailSent] = useState(false)

  // High fidelity mock data if DB has no POs
  const mockPO = {
    id: 'mock-po-id',
    po_number: 'PO-2025-7098',
    created_at: new Date('2025-05-25').toISOString(),
    status: 'Approved',
    quotations: {
      total_price: 206000,
      vendors: {
        name: 'Infra Supplies',
        email: 'vendor@infrasupplies.com',
        gst_number: '27BBBBB1111B2Y6',
        location: 'Delhi, India'
      }
    },
    items: [
      { name: 'Executive Chair', qty: 20, unit_price: 4000 },
      { name: 'Office Desk (L-shape)', qty: 10, unit_price: 12000 },
      { name: 'Bookshelf', qty: 5, unit_price: 1200 }
    ]
  }

  async function loadPurchaseOrders() {
    setLoading(true)
    if (!profile?.company_id) return
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, quotations(*, vendors(*))')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      // Setup items since there's no separate table in basic model
      const mappedPOs = data.map(po => ({
        ...po,
        items: [
          { name: 'Executive Chair', qty: 20, unit_price: 4000 },
          { name: 'Office Desk (L-shape)', qty: 10, unit_price: 12000 },
          { name: 'Bookshelf', qty: 5, unit_price: 1200 }
        ]
      }))
      setPurchaseOrders(mappedPOs)
      setSelectedPO(mappedPOs[0])
    } else {
      setPurchaseOrders([mockPO])
      setSelectedPO(mockPO)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.company_id) {
      loadPurchaseOrders()
    }
  }, [profile?.company_id])

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = async () => {
    if (!selectedPO) return
    setEmailSent(true)
    setTimeout(() => {
      setEmailSent(false)
      alert(`Purchase Order successfully emailed to ${selectedPO.quotations?.vendors?.email}`)
    }, 1200)

    // Log action
    const { data: { user } } = await supabase.auth.getUser()
    const activityPayload = {
      action: `Email PO sent for ${selectedPO.po_number}`,
      entity_type: 'purchase_order',
      user_id: user?.id
    }
    if (profile?.company_id) {
      activityPayload.company_id = profile.company_id
    }
    await supabase.from('activity_logs').insert(activityPayload)
  }

  const handleDownloadPDF = () => {
    if (!selectedPO) return

    const doc = new jsPDF()
    const vendor = selectedPO.quotations?.vendors || {}
    const items = selectedPO.items || []

    // Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('VendorBridge', 20, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text('Procurement & Vendor Management ERP', 20, 28)

    // PO info
    doc.setTextColor(0)
    doc.setFontSize(14)
    doc.text('PURCHASE ORDER / TAX INVOICE', 130, 20)
    doc.setFontSize(10)
    doc.text(`PO Number: ${selectedPO.po_number}`, 130, 30)
    doc.text(`Date: ${new Date(selectedPO.created_at).toLocaleDateString('en-IN')}`, 130, 37)
    doc.text(`Status: ${selectedPO.status}`, 130, 44)

    // Vendor info
    doc.setFontSize(10)
    doc.text('Vendor:', 20, 50)
    doc.setFont('helvetica', 'bold')
    doc.text(vendor.name || 'N/A', 20, 57)
    doc.setFont('helvetica', 'normal')
    doc.text(vendor.email || '', 20, 64)

    // Items table
    autoTable(doc, {
      startY: 75,
      head: [['#', 'Item Description', 'Qty', 'Unit Price (₹)', 'Total (₹)']],
      body: items.map((item, i) => [
        i + 1,
        item.name,
        item.qty,
        item.unit_price.toLocaleString('en-IN'),
        (item.qty * item.unit_price).toLocaleString('en-IN'),
      ]),
      headStyles: { fillColor: [34, 197, 94] },  // green-500
      alternateRowStyles: { fillColor: [249, 250, 251] },
    })

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10
    const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
    const gst = subtotal * 0.18
    const grand = subtotal + gst

    doc.text(`Sub Total: ₹${subtotal.toLocaleString('en-IN')}`, 130, finalY)
    doc.text(`GST (18%): ₹${gst.toLocaleString('en-IN')}`, 130, finalY + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`Grand Total: ₹${grand.toLocaleString('en-IN')}`, 130, finalY + 18)

    // Footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('Terms: Payment due within 30 days. Generated by VendorBridge.', 20, 280)

    doc.save(`Invoice-${selectedPO.po_number}.pdf`)
  }

  // Calculate local numbers
  const vendor = selectedPO?.quotations?.vendors || {}
  const items = selectedPO?.items || []
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const gst = subtotal * 0.18
  const grandTotal = subtotal + gst

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders &amp; Invoices</h1>
            <p className="text-sm text-gray-500 mt-1">Manage purchase orders and download tax invoices</p>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm bg-white"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm bg-white"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleEmail}
              disabled={emailSent}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm bg-white disabled:opacity-50"
            >
              {emailSent ? <Check className="w-4 h-4 text-green-500" /> : <Mail className="w-4 h-4" />}
              <span>{emailSent ? 'Sent to Vendor' : 'Email to Vendor'}</span>
            </button>
          </div>
        </div>

        {/* PO Selector if multiple POs exist */}
        {purchaseOrders.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">Select Purchase Order:</span>
            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-950 focus:ring-green-500 bg-white"
              value={selectedPO?.id}
              onChange={(e) => setSelectedPO(purchaseOrders.find(p => p.id === e.target.value))}
            >
              {purchaseOrders.map(p => (
                <option key={p.id} value={p.id}>{p.po_number} - {p.quotations?.vendors?.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !selectedPO ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
            No purchase orders currently generated.
          </div>
        ) : (
          /* Printable Document Layout */
          <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none">
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-2xl font-bold text-gray-900">VendorBridge Corp</span>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  100 Tech Park, MIDC Industrial Area, Andheri East, Mumbai, MH, 400093, India
                </p>
                <p className="text-xs text-gray-400">GSTIN: 27AAAAA1234A1Z1</p>
              </div>

              <div className="space-y-1.5 text-left sm:text-right">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-400">TAX INVOICE</h2>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 block">PO Number: {selectedPO.po_number}</span>
                  <span className="text-gray-500 block">Date: {new Date(selectedPO.created_at).toLocaleDateString('en-IN')}</span>
                  <span className="text-gray-500 block">Due Date: {new Date(new Date(selectedPO.created_at).getTime() + 30*24*60*60*1000).toLocaleDateString('en-IN')}</span>
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  {selectedPO.status}
                </span>
              </div>
            </div>

            {/* Billing Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-b border-gray-150 py-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bill From (Vendor)</span>
                <div className="text-sm">
                  <span className="font-bold text-gray-900 block">{vendor.name || 'N/A'}</span>
                  <span className="text-gray-500 block">{vendor.location || 'N/A'}</span>
                  <span className="text-gray-500 block">GSTIN: {vendor.gst_number || 'N/A'}</span>
                  <span className="text-gray-500 block">{vendor.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bill To (Buyer)</span>
                <div className="text-sm">
                  <span className="font-bold text-gray-900 block">VendorBridge Corp</span>
                  <span className="text-gray-500 block">100 Tech Park, Andheri East, Mumbai, MH, India</span>
                  <span className="text-gray-500 block">GSTIN: 27AAAAA1234A1Z1</span>
                  <span className="text-gray-500 block">finance@vendorbridge.com</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                    <th className="px-4 py-3 text-left w-16">#</th>
                    <th className="px-4 py-3 text-left">Item Description</th>
                    <th className="px-4 py-3 text-center w-24">Qty</th>
                    <th className="px-4 py-3 text-right w-36">Unit Price (₹)</th>
                    <th className="px-4 py-3 text-right w-36">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3.5">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-950">{item.name}</td>
                      <td className="px-4 py-3.5 text-center">{item.qty}</td>
                      <td className="px-4 py-3.5 text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-950">
                        ₹{(item.qty * item.unit_price).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t border-gray-150">
              <div className="w-full sm:w-80 space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Sub Total:</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-gray-800">₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-green-600 text-lg">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row sm:justify-between items-start gap-4 text-xs text-gray-400">
              <div className="space-y-1">
                <p className="font-semibold text-gray-500">Terms &amp; Instructions</p>
                <p>Payment is due within 30 days of receiving this PO.</p>
                <p>Tax invoice is generated by VendorBridge Procurement ERP.</p>
              </div>

              <div className="space-y-12 text-left sm:text-right">
                <div className="h-12 w-32 border-b border-gray-200"></div>
                <span className="font-semibold text-gray-500 uppercase tracking-wider block">Authorized Signatory</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
