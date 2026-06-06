import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Check, X, Award, Star, ArrowRight, TrendingDown, AlertTriangle } from 'lucide-react'

// Exact mock data matching the guide spec (Screen 7)
const MOCK_VENDORS = [
  {
    id: '1',
    name: 'Infra Supplies',
    isLowestPrice: false,
    rating: 4.2,
    delivery: 15,
    terms: 'Net 30',
    validity: 30,
    prices: [4000, 12000, 1200],
    subtotal: 85000,
    gst: 15300,
    total: 100300
  },
  {
    id: '2',
    name: 'TechCore Ltd',
    isLowestPrice: true,   // lowest grand total = ₹96,760
    rating: 4.8,
    delivery: 12,
    terms: 'Net 30',
    validity: 45,
    prices: [4500, 11500, 1000],
    subtotal: 82000,
    gst: 14760,
    total: 96760
  },
  {
    id: '3',
    name: 'FurnCo',
    isLowestPrice: false,
    rating: 3.5,
    delivery: 18,
    terms: 'Advance',
    validity: 30,
    prices: [3800, 13000, 1100],
    subtotal: 89000,
    gst: 16020,
    total: 105020
  }
]

const MOCK_ITEMS = [
  { name: 'Executive Chair (20 pcs)', fieldIndex: 0 },
  { name: 'Office Desk (10 pcs)', fieldIndex: 1 },
  { name: 'Bookshelf (5 pcs)', fieldIndex: 2 }
]

function StarRating({ rating }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-400">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className="w-3.5 h-3.5 fill-current" />
        ))}
        {half && (
          <div className="relative w-3.5 h-3.5">
            <Star className="w-3.5 h-3.5 text-gray-200 fill-current absolute" />
            <div className="overflow-hidden w-[50%] absolute">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className="w-3.5 h-3.5 text-gray-200 fill-current" />
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-500">({rating})</span>
    </div>
  )
}

function getLowestIndex(values) {
  let min = Infinity, idx = -1
  values.forEach((v, i) => { if (v < min) { min = v; idx = i } })
  return idx
}

export default function QuotationCompare() {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [approved, setApproved] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: rfqsData } = await supabase.from('rfqs').select('*')
      if (rfqsData && rfqsData.length > 0) {
        setRfqs(rfqsData)
        setSelectedRfq(rfqsData[0])
        const { data: quotesData } = await supabase
          .from('quotations')
          .select('*, vendors(*)')
          .eq('rfq_id', rfqsData[0].id)
        if (quotesData) setQuotations(quotesData)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleApprove = async (vendorId, amount, vendorName, quotationId) => {
    if (!selectedRfq) return
    setSubmitting(true)
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      po_number: poNumber,
      status: 'Pending',
      grand_total: amount,
      approved_by: user?.id
    }
    if (quotationId) payload.quotation_id = quotationId

    const { error } = await supabase.from('purchase_orders').insert(payload).select().single()
    if (error) {
      alert(error.message)
    } else {
      await supabase.from('activity_logs').insert({
        action: `Quotation approved for ${selectedRfq.title}. PO ${poNumber} generated for ${vendorName}.`,
        entity_type: 'purchase_order',
        user_id: user?.id
      })
      setApproved(vendorId)
      setTimeout(() => navigate('/approvals'), 1200)
    }
    setSubmitting(false)
  }

  // Compute lowest indices
  const itemLowestIndices = MOCK_ITEMS.map((_, itemIdx) =>
    getLowestIndex(MOCK_VENDORS.map(v => v.prices[itemIdx]))
  )
  const subtotalLowestIdx = getLowestIndex(MOCK_VENDORS.map(v => v.subtotal))
  const grandTotalLowestIdx = getLowestIndex(MOCK_VENDORS.map(v => v.total))
  const deliveryLowestIdx = getLowestIndex(MOCK_VENDORS.map(v => v.delivery))

  const quotationCount = quotations.length > 0 ? quotations.length : 3

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-gray-200 gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              RFQs &gt; {selectedRfq?.title || 'Office Furniture Q2'} &gt; Compare Quotations
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Comparison</h1>
            <p className="text-sm text-gray-500 mt-1">
              RFQ: {selectedRfq?.title || 'Office Furniture Procurement Q2'} —{' '}
              <span className="font-semibold text-green-600">{quotationCount} quotations received</span>
            </p>
          </div>

          <button
            onClick={() => navigate('/approvals')}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition shadow-sm shrink-0"
          >
            <span>Proceed to Approval</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── RFQ selector (multi-RFQ) ─────────────────────────── */}
        {rfqs.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">Compare RFQ:</span>
            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-950 focus:ring-green-500 bg-white"
              value={selectedRfq?.id}
              onChange={(e) => setSelectedRfq(rfqs.find(r => r.id === e.target.value))}
            >
              {rfqs.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Comparison Table ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {/* Criteria column */}
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-gray-400 w-52 border-r border-gray-200 bg-gray-50">
                  Item / Criteria
                </th>

                {/* Vendor columns */}
                {MOCK_VENDORS.map((vendor, vIdx) => (
                  <th
                    key={vIdx}
                    className={`px-6 py-5 text-left border-r border-gray-200 last:border-r-0 ${
                      vendor.isLowestPrice
                        ? 'border-t-4 border-t-green-500 bg-green-50/60'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">{vendor.name}</span>
                        {vendor.isLowestPrice && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 shrink-0">
                            <TrendingDown className="w-3 h-3" />
                            LOWEST PRICE
                          </span>
                        )}
                      </div>
                      <StarRating rating={vendor.rating} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">

              {/* ── Item price rows ── */}
              {MOCK_ITEMS.map((item, itemIdx) => (
                <tr key={itemIdx} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-700 border-r border-gray-200 bg-gray-50/20">
                    {item.name}
                  </td>
                  {MOCK_VENDORS.map((vendor, vIdx) => {
                    const isLowest = itemLowestIndices[itemIdx] === vIdx
                    return (
                      <td
                        key={vIdx}
                        className={`px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium ${
                          isLowest ? 'bg-green-50 text-green-700 font-bold' : ''
                        }`}
                      >
                        ₹{vendor.prices[itemIdx].toLocaleString('en-IN')}
                        {isLowest && (
                          <span className="ml-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            LOWEST
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* ── Separator ── */}
              <tr className="bg-gray-100/60">
                <td colSpan={4} className="px-6 py-1.5">
                  <div className="h-px bg-gray-200" />
                </td>
              </tr>

              {/* ── Sub Total ── */}
              <tr className="bg-gray-50/60 font-semibold">
                <td className="px-6 py-3.5 border-r border-gray-200 text-gray-600 font-semibold">
                  Sub Total
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => (
                  <td
                    key={vIdx}
                    className={`px-6 py-3.5 border-r border-gray-200 last:border-r-0 ${
                      subtotalLowestIdx === vIdx ? 'text-green-700 font-bold' : ''
                    }`}
                  >
                    ₹{vendor.subtotal.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* ── GST ── */}
              <tr className="text-gray-500">
                <td className="px-6 py-3.5 border-r border-gray-200 bg-gray-50/20">
                  GST (18%)
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium">
                    ₹{vendor.gst.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* ── Grand Total ── */}
              <tr className="bg-gray-50 border-t-2 border-b-2 border-gray-200 font-bold text-gray-900">
                <td className="px-6 py-4 border-r border-gray-200 text-gray-700 font-bold">
                  Grand Total
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => {
                  const isLowest = grandTotalLowestIdx === vIdx
                  return (
                    <td
                      key={vIdx}
                      className={`px-6 py-4 border-r border-gray-200 last:border-r-0 text-base ${
                        isLowest ? 'text-green-600 font-extrabold bg-green-50/40' : ''
                      }`}
                    >
                      ₹{vendor.total.toLocaleString('en-IN')}
                    </td>
                  )
                })}
              </tr>

              {/* ── Separator ── */}
              <tr className="bg-gray-100/60">
                <td colSpan={4} className="px-6 py-1.5">
                  <div className="h-px bg-gray-200" />
                </td>
              </tr>

              {/* ── Delivery Timeline ── */}
              <tr className="hover:bg-gray-50/40">
                <td className="px-6 py-3.5 font-medium border-r border-gray-200 bg-gray-50/20">
                  Delivery Timeline
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => {
                  const isLowest = deliveryLowestIdx === vIdx
                  return (
                    <td
                      key={vIdx}
                      className={`px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium ${
                        isLowest ? 'bg-green-50 text-green-700 font-bold' : ''
                      }`}
                    >
                      {vendor.delivery} days
                      {isLowest && (
                        <span className="ml-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                          FASTEST
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* ── Payment Terms ── */}
              <tr className="hover:bg-gray-50/40">
                <td className="px-6 py-3.5 font-medium border-r border-gray-200 bg-gray-50/20">
                  Payment Terms
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium">
                    {vendor.terms}
                  </td>
                ))}
              </tr>

              {/* ── Validity ── */}
              <tr className="hover:bg-gray-50/40 text-gray-500">
                <td className="px-6 py-3.5 border-r border-gray-200 bg-gray-50/20">
                  Validity Period
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium">
                    {vendor.validity} days
                  </td>
                ))}
              </tr>

              {/* ── Vendor Rating ── */}
              <tr className="hover:bg-gray-50/40">
                <td className="px-6 py-3.5 font-medium border-r border-gray-200 bg-gray-50/20">
                  Vendor Rating
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0">
                    <StarRating rating={vendor.rating} />
                  </td>
                ))}
              </tr>

              {/* ── Action Buttons ── */}
              <tr className="bg-gray-50/30">
                <td className="px-6 py-6 border-r border-gray-200 text-xs text-gray-400 font-medium align-top pt-8">
                  Actions
                </td>
                {MOCK_VENDORS.map((vendor, vIdx) => {
                  const isApproved = approved === vendor.id
                  const realQuotation = quotations.find(q => q.vendors?.name === vendor.name)
                  return (
                    <td key={vIdx} className="px-6 py-6 border-r border-gray-200 last:border-r-0">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(vendor.id, vendor.total, vendor.name, realQuotation?.id || null)}
                          disabled={submitting || !!approved}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm w-full ${
                            isApproved
                              ? 'bg-green-600 text-white cursor-not-allowed'
                              : vendor.isLowestPrice
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{isApproved ? 'Approved ✓' : 'Select & Approve'}</span>
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Bottom actions & note ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Select preferred vendor to initiate approval workflow</span>
          </div>

          <button
            disabled={submitting || !!approved}
            className="flex items-center gap-1.5 px-5 py-2.5 border-2 border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition bg-white disabled:opacity-40"
          >
            <X className="w-4 h-4" />
            <span>Reject All</span>
          </button>
        </div>

      </div>
    </Layout>
  )
}
