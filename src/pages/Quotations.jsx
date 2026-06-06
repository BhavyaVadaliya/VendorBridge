import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Quotations() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Data from DB
  const [rfqs, setRfqs] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedRfqId, setSelectedRfqId] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')

  // Form State
  const [items, setItems] = useState([])
  const [gst, setGst] = useState('18')
  const [notes, setNotes] = useState('Payment terms: 30 days net...')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      if (!profile?.company_id) return

      const [rfqRes, vendorRes] = await Promise.all([
        supabase.from('rfqs').select('*').eq('status', 'Open').eq('company_id', profile.company_id),
        supabase.from('vendors').select('*').eq('status', 'Active').eq('company_id', profile.company_id)
      ])

      if (rfqRes.data && rfqRes.data.length > 0) {
        setRfqs(rfqRes.data)
        setSelectedRfqId(rfqRes.data[0].id)
      }

      if (vendorRes.data && vendorRes.data.length > 0) {
        setVendors(vendorRes.data)
        setSelectedVendorId(vendorRes.data[0].id)
      }

      setLoading(false)
    }
    if (profile?.company_id) {
      loadData()
    }
  }, [profile?.company_id])

  useEffect(() => {
    if (!selectedRfqId || rfqs.length === 0) {
      setItems([])
      return
    }
    const selectedRfq = rfqs.find(r => r.id === selectedRfqId)
    if (selectedRfq && selectedRfq.description) {
      const parts = selectedRfq.description.split('\n\n--ITEMS_JSON--\n')
      if (parts[1]) {
        try {
          const rfqItems = JSON.parse(parts[1])
          const parsedItems = rfqItems.map(item => ({
            name: item.name,
            qty: Number(item.qty || 1),
            price: Number(item.target_price || 0),
            total: Number(item.qty || 1) * Number(item.target_price || 0),
            delivery: 7
          }))
          setItems(parsedItems)
        } catch (e) {
          console.error(e)
          setItems([])
        }
      } else {
        setItems([])
      }
    } else {
      setItems([])
    }
  }, [selectedRfqId, rfqs])

  const getCleanDescription = () => {
    const rfq = rfqs.find(r => r.id === selectedRfqId)
    if (!rfq) return ''
    const parts = rfq.description?.split('\n\n--ITEMS_JSON--\n') || []
    return parts[0] || ''
  }

  const handlePriceChange = (index, val) => {
    const newItems = [...items]
    newItems[index].price = val
    newItems[index].total = val * newItems[index].qty
    setItems(newItems)
  }

  const handleDeliveryChange = (index, val) => {
    const newItems = [...items]
    newItems[index].delivery = val
    setItems(newItems)
  }

  const subtotal = items.reduce((acc, item) => acc + item.total, 0)
  const gstAmount = subtotal * (Number(gst) / 100)
  const grandTotal = subtotal + gstAmount

  const handleSubmit = async () => {
    if (!selectedRfqId || !selectedVendorId) {
      alert("Please ensure an RFQ and a Vendor exist in the system.")
      return
    }

    setSubmitting(true)

    // Calculate max delivery days
    const maxDelivery = Math.max(...items.map(i => i.delivery))

    const quotationPayload = {
      rfq_id: selectedRfqId,
      vendor_id: selectedVendorId,
      total_price: grandTotal,
      delivery_days: maxDelivery,
      payment_terms: notes,
      notes: notes,
      status: 'Submitted'
    }
    if (profile?.company_id) {
      quotationPayload.company_id = profile.company_id
    }

    const { error } = await supabase.from('quotations').insert(quotationPayload)

    if (error) {
      alert(error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const selectedRfq = rfqs.find(r => r.id === selectedRfqId)
      
      const activityPayload = {
        action: `New quotation submitted for RFQ: ${selectedRfq?.title || 'Unknown'}`,
        entity_type: 'quotation',
        user_id: user?.id
      }
      if (profile?.company_id) {
        activityPayload.company_id = profile.company_id
      }

      await supabase.from('activity_logs').insert(activityPayload)
      
      // Full flow: Redirect to Compare screen to see the submitted quote!
      navigate('/quotations/compare')
    }
    setSubmitting(false)
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
        
        {/* Navigation Tabs for Quotations */}
        <div className="flex items-center gap-6 border-b border-gray-300 pb-2 mb-6">
          <button 
            className="text-[15px] font-medium text-green-600 border-b-2 border-green-600 pb-2 -mb-[9px]"
          >
            Submit Quotation
          </button>
          <button 
            className="text-[15px] font-medium text-gray-500 hover:text-gray-900 pb-2 -mb-[9px]"
            onClick={() => navigate('/quotations/compare')}
          >
            Compare Quotations
          </button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-[28px] font-medium text-gray-900 mb-1">Submit Quotations</h1>
          {rfqs.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4 mt-3">
              <select 
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
                className="text-gray-900 text-[15px] border border-gray-300 rounded p-1 bg-transparent max-w-[400px]"
              >
                {rfqs.map(r => (
                  <option key={r.id} value={r.id}>RFQ: {r.title} - deadline {r.deadline}</option>
                ))}
              </select>
              
              <select 
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="text-gray-900 text-[15px] border border-gray-300 rounded p-1 bg-transparent max-w-[250px]"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>As Vendor: {v.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-gray-900 text-[15px] mt-2">
              No Open RFQs available.
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* RFQ Summary Box */}
            <div className="border border-gray-400 rounded-lg p-4 bg-white">
              <p className="text-xs text-gray-600 mb-1 font-medium">RFQ Summary</p>
              <p className="text-sm text-gray-900">
                {getCleanDescription() || 'No description provided.'}
              </p>
            </div>

            {/* Your Quotation Table */}
            <div className="mt-8">
              <p className="text-xs text-gray-600 mb-2 font-medium">Your Quotation</p>
              <div className="border border-gray-400 rounded-lg bg-white overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-400">
                      <th className="p-3 border-r border-gray-400 font-medium text-gray-800">Item</th>
                      <th className="p-3 border-r border-gray-400 font-medium text-gray-800 w-24">Qty</th>
                      <th className="p-3 border-r border-gray-400 font-medium text-gray-800 w-32">Unit price</th>
                      <th className="p-3 border-r border-gray-400 font-medium text-gray-800 w-32">Total</th>
                      <th className="p-3 font-medium text-gray-800 w-32">Delivery (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-400 last:border-b-0">
                        <td className="p-3 border-r border-gray-400 text-gray-900">{item.name}</td>
                        <td className="p-3 border-r border-gray-400 text-gray-900">{item.qty}</td>
                        <td className="p-3 border-r border-gray-400">
                          <input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                            className="w-full focus:outline-none bg-transparent"
                          />
                        </td>
                        <td className="p-3 border-r border-gray-400 text-gray-900">
                          {item.total.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            value={item.delivery}
                            onChange={(e) => handleDeliveryChange(idx, Number(e.target.value))}
                            className="w-full focus:outline-none bg-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 mt-8">
              
              {/* Left: Tax & Notes */}
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-medium">Tax / GST %</p>
                  <input 
                    type="text" 
                    value={gst + ' %'}
                    onChange={(e) => setGst(e.target.value.replace(' %', ''))}
                    className="border border-gray-400 rounded-md w-full max-w-[200px] p-2 text-sm text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-medium">Note / Terms</p>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="border border-gray-400 rounded-md w-full max-w-[300px] p-2 text-sm text-gray-900 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Right: Summary Box */}
              <div className="w-full md:w-[400px] border border-gray-400 rounded-lg p-5 bg-white">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-800">Subtotal</span>
                    <span className="text-gray-900">{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-800">GST ({gst}%)</span>
                    <span className="text-gray-900">{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-gray-300 my-2 pt-4 flex justify-between items-center text-sm">
                    <span className="text-gray-800">Grand total</span>
                    <span className="text-gray-900">{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-8">
              <button 
                onClick={handleSubmit}
                disabled={submitting || !selectedRfqId}
                className="px-6 py-2 border border-gray-400 rounded-md text-sm text-gray-800 font-medium hover:bg-green-50 hover:border-green-600 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Quotation'}
              </button>
              <button 
                disabled={submitting}
                className="px-6 py-2 border border-gray-400 rounded-md text-sm text-gray-800 font-medium hover:bg-gray-50 transition"
              >
                Save Draft
              </button>
            </div>
          </>
        )}

      </div>
    </Layout>
  )
}
