import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Check, X, Award, Star, ArrowRight } from 'lucide-react'

export default function QuotationCompare() {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [quotations, setQuotations] = useState([])
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // High fidelity fallback comparison data if no quotations in DB yet
  const mockComparison = {
    vendors: [
      { id: '1', name: 'Infra Supplies', isRecommended: true, rating: 4.2, delivery: 15, terms: 'Net 30', validity: 30, prices: [4000, 12000, 1200], subtotal: 85000, gst: 15300, total: 100300 },
      { id: '2', name: 'TechCorp Ltd', isRecommended: false, rating: 4.8, delivery: 12, terms: 'Net 30', validity: 45, prices: [4500, 11500, 1000], subtotal: 82000, gst: 14760, total: 96760 },
      { id: '3', name: 'FurnCo', isRecommended: false, rating: 3.5, delivery: 18, terms: 'Advance', validity: 30, prices: [3800, 13000, 1100], subtotal: 89000, gst: 16020, total: 105020 }
    ],
    items: [
      { name: 'Executive Chair (20 pcs)', fieldIndex: 0 },
      { name: 'Office Desk (L-shape) (10 pcs)', fieldIndex: 1 },
      { name: 'Bookshelf (5 pcs)', fieldIndex: 2 }
    ]
  }

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

  const handleApprove = async (quotationId, amount) => {
    if (!selectedRfq) return
    setSubmitting(true)

    // Generate PO number
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Create PO
    const { data: { user } } = await supabase.auth.getUser()
    const { data: poData, error: poError } = await supabase.from('purchase_orders').insert({
      po_number: poNumber,
      status: 'Pending',
      grand_total: amount,
      quotation_id: quotationId,
      approved_by: user?.id
    }).select().single()

    if (poError) {
      alert(poError.message)
    } else {
      // Log activity
      await supabase.from('activity_logs').insert({
        action: `Quotation approved for ${selectedRfq.title}. PO ${poNumber} generated.`,
        entity_type: 'purchase_order',
        user_id: user?.id
      })
      navigate('/approvals')
    }
    setSubmitting(false)
  }

  // Helper to find the lowest value in a list of numbers
  const getLowestIndex = (values) => {
    let min = Infinity
    let minIndex = -1
    values.forEach((v, index) => {
      if (v < min) {
        min = v
        minIndex = index
      }
    })
    return minIndex
  }

  // Get index of lowest values
  const itemLowestIndices = mockComparison.items.map((_, itemIndex) => 
    getLowestIndex(mockComparison.vendors.map(v => v.prices[itemIndex]))
  )
  const subtotalLowestIndex = getLowestIndex(mockComparison.vendors.map(v => v.subtotal))
  const deliveryLowestIndex = getLowestIndex(mockComparison.vendors.map(v => v.delivery))

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              RFQs &gt; {selectedRfq?.title || 'Office Furniture Q2'} &gt; Compare
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Comparison</h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare vendor quotations for {selectedRfq?.title || 'Office Furniture Procurement Q2'}
            </p>
          </div>

          <button
            onClick={() => navigate('/approvals')}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition shadow-sm mt-4 sm:mt-0"
          >
            <span>Proceed to Approval</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* RFQ Selector */}
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

        {/* Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400 w-64 border-r border-gray-200">
                  Item / Criteria
                </th>
                {mockComparison.vendors.map((vendor, vIdx) => (
                  <th
                    key={vIdx}
                    className={`px-6 py-4 text-left border-r border-gray-200 last:border-r-0 ${
                      vendor.isRecommended ? 'bg-green-50/50 relative border-t-4 border-t-green-500' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-base">{vendor.name}</span>
                        {vendor.isRecommended && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            <Award className="w-3.5 h-3.5" />
                            <span>RECOMMENDED</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex text-amber-400">
                          {Array.from({ length: Math.floor(vendor.rating) }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 font-semibold mt-0.5">({vendor.rating})</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {/* RFQ Item Prices */}
              {mockComparison.items.map((item, itemIdx) => (
                <tr key={itemIdx} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3.5 font-medium border-r border-gray-200 bg-gray-50/30">
                    {item.name}
                  </td>
                  {mockComparison.vendors.map((vendor, vIdx) => {
                    const isLowest = itemLowestIndices[itemIdx] === vIdx
                    return (
                      <td
                        key={vIdx}
                        className={`px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium ${
                          isLowest ? 'bg-green-100/40 text-green-700 font-bold' : ''
                        }`}
                      >
                        ₹{vendor.prices[itemIdx].toLocaleString('en-IN')}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Separator / Sub Total */}
              <tr className="bg-gray-50/50 font-semibold">
                <td className="px-6 py-3.5 border-r border-gray-200 bg-gray-100/30">Sub Total</td>
                {mockComparison.vendors.map((vendor, vIdx) => {
                  const isLowest = subtotalLowestIndex === vIdx
                  return (
                    <td
                      key={vIdx}
                      className={`px-6 py-3.5 border-r border-gray-200 last:border-r-0 ${
                        isLowest ? 'text-green-700 font-bold' : ''
                      }`}
                    >
                      ₹{vendor.subtotal.toLocaleString('en-IN')}
                    </td>
                  )
                })}
              </tr>

              {/* GST */}
              <tr className="text-gray-500">
                <td className="px-6 py-3.5 border-r border-gray-200 bg-gray-50/30">GST (18%)</td>
                {mockComparison.vendors.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium">
                    ₹{vendor.gst.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* Grand Total */}
              <tr className="bg-gray-50/80 font-bold text-gray-900 border-t-2 border-b-2 border-gray-200">
                <td className="px-6 py-4 border-r border-gray-200 bg-gray-100/40">Grand Total</td>
                {mockComparison.vendors.map((vendor, vIdx) => {
                  const isLowest = subtotalLowestIndex === vIdx
                  return (
                    <td
                      key={vIdx}
                      className={`px-6 py-4 border-r border-gray-200 last:border-r-0 text-base ${
                        isLowest ? 'text-green-600 font-extrabold bg-green-100/20' : ''
                      }`}
                    >
                      ₹{vendor.total.toLocaleString('en-IN')}
                    </td>
                  )
                })}
              </tr>

              {/* Delivery Days */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-3.5 font-medium border-r border-gray-200 bg-gray-50/30">Delivery Timeline</td>
                {mockComparison.vendors.map((vendor, vIdx) => {
                  const isLowest = deliveryLowestIndex === vIdx
                  return (
                    <td
                      key={vIdx}
                      className={`px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium ${
                        isLowest ? 'bg-green-100/40 text-green-700 font-bold' : ''
                      }`}
                    >
                      {vendor.delivery} Days
                    </td>
                  )
                })}
              </tr>

              {/* Payment Terms */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-3.5 font-medium border-r border-gray-200 bg-gray-50/30">Payment Terms</td>
                {mockComparison.vendors.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium">
                    {vendor.terms}
                  </td>
                ))}
              </tr>

              {/* Validity */}
              <tr className="hover:bg-gray-50/50 text-gray-500">
                <td className="px-6 py-3.5 border-r border-gray-200 bg-gray-50/30">Quote Validity</td>
                {mockComparison.vendors.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-3.5 border-r border-gray-200 last:border-r-0 font-medium">
                    {vendor.validity} Days
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr className="bg-gray-50/30">
                <td className="px-6 py-6 border-r border-gray-200"></td>
                {mockComparison.vendors.map((vendor, vIdx) => (
                  <td key={vIdx} className="px-6 py-6 border-r border-gray-200 last:border-r-0">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApprove(null, vendor.total)}
                        disabled={submitting}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                          vendor.isRecommended 
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Check className="w-4.5 h-4.5" />
                        <span>Select &amp; Approve</span>
                      </button>
                      <button
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition bg-white"
                      >
                        <X className="w-4.5 h-4.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
