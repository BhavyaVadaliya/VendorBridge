import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { FileText, Send, Calendar, CheckSquare, Save } from 'lucide-react'

export default function Quotations() {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      vendor_id: '',
      delivery_days: 15,
      payment_terms: 'Net 30',
      validity: 30,
      notes: '',
      items: [
        { name: 'Executive Chair', qty: 20, unit_price: 0 },
        { name: 'Office Desk (L-shape)', qty: 10, unit_price: 0 },
        { name: 'Bookshelf', qty: 5, unit_price: 0 }
      ]
    }
  })

  const { fields } = useFieldArray({
    control,
    name: 'items'
  })

  // Watch item prices to compute totals
  const watchedItems = watch('items')

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      // 1. Fetch Open RFQs
      const { data: rfqData } = await supabase.from('rfqs').select('*').eq('status', 'Open')
      if (rfqData && rfqData.length > 0) {
        setRfqs(rfqData)
        setSelectedRfq(rfqData[0])
      }

      // 2. Fetch Active Vendors to select from
      const { data: vendorData } = await supabase.from('vendors').select('*').eq('status', 'Active')
      if (vendorData) {
        setVendors(vendorData)
        if (vendorData.length > 0) {
          setValue('vendor_id', vendorData[0].id)
        }
      }
      setLoading(false)
    }
    loadInitialData()
  }, [setValue])

  const selectRfq = (rfqId) => {
    const rfq = rfqs.find(r => r.id === rfqId)
    setSelectedRfq(rfq)
  }

  // Calculate Subtotal, GST, Grand Total
  const subtotal = watchedItems?.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unit_price) || 0), 0) || 0
  const gst = subtotal * 0.18
  const grandTotal = subtotal + gst

  const onSubmit = async (values) => {
    if (!selectedRfq) return
    setSubmitting(true)

    const { error } = await supabase.from('quotations').insert({
      rfq_id: selectedRfq.id,
      vendor_id: values.vendor_id,
      total_price: grandTotal,
      delivery_days: Number(values.delivery_days),
      payment_terms: values.payment_terms,
      notes: values.notes,
      status: 'Submitted'
    })

    if (error) {
      alert(error.message)
    } else {
      // Log activity
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('activity_logs').insert({
        action: `Quotation submitted for RFQ: ${selectedRfq.title}`,
        entity_type: 'quotation',
        user_id: user?.id
      })
      navigate('/dashboard')
    }
    setSubmitting(false)
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quotations &gt; Submit</div>
            <h1 className="text-2xl font-bold text-gray-900">Submit Quotations</h1>
            <p className="text-sm text-gray-500 mt-1">Vendor quotation response panel</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !selectedRfq ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
            No open RFQs currently available for bidding.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: RFQ details & Selector */}
            <div className="space-y-6 lg:col-span-1">
              {/* RFQ Selector */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Select RFQ Invitation</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition"
                  value={selectedRfq.id}
                  onChange={(e) => selectRfq(e.target.value)}
                >
                  {rfqs.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              {/* Selected RFQ Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedRfq.status}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deadline: {selectedRfq.deadline}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">{selectedRfq.title}</h3>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">Category: {selectedRfq.category}</p>
                </div>

                <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <p className="font-semibold text-gray-800 mb-1">Description:</p>
                  <p className="line-clamp-6 leading-relaxed">{selectedRfq.description}</p>
                </div>
              </div>
            </div>

            {/* Right Panel: Quotation Submission Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
              {/* Items Table Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <span>Quotation Form</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Responding Vendor</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition"
                      {...register('vendor_id')}
                    >
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Item Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-24">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-36">
                          Unit Price (₹)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-36">
                          Total (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fields.map((field, index) => (
                        <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{field.name}</td>
                          <td className="px-4 py-3 text-gray-600">{field.qty}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                              placeholder="0"
                              {...register(`items.${index}.unit_price`, { required: true, min: 0 })}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            ₹{((Number(watchedItems?.[index]?.qty) || 0) * (Number(watchedItems?.[index]?.unit_price) || 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extra specifications */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Timeline</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      {...register('delivery_days', { required: true })}
                    />
                    <span className="text-sm font-medium text-gray-500">Days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition"
                    {...register('payment_terms')}
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Advance">Advance</option>
                    <option value="COD">COD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Validity Period</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                      {...register('validity', { required: true })}
                    />
                    <span className="text-sm font-medium text-gray-500">Days</span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    rows={3}
                    placeholder="Enter special shipping instructions, warrantee clauses, or item variants detail..."
                    {...register('notes')}
                  />
                </div>
              </div>

              {/* Quotation Summary box & Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="space-y-1.5 w-full sm:w-auto">
                  <div className="text-sm text-gray-500">Sub Total: <span className="font-semibold text-gray-700">₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="text-sm text-gray-500">GST (18%): <span className="font-semibold text-gray-700">₹{gst.toLocaleString('en-IN')}</span></div>
                  <div className="text-lg font-bold text-gray-900">Grand Total: <span className="text-green-600">₹{grandTotal.toLocaleString('en-IN')}</span></div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition shadow-sm w-full sm:w-auto disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Quote</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
