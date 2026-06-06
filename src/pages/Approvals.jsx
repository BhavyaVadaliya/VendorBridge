import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Check, Clock } from 'lucide-react'

export default function Approvals() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pendingPO, setPendingPO] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // High-fidelity fallback if no pending approvals in DB
  const mockPendingApproval = {
    id: 'mock-po-id',
    vendor: 'Infra Supplies PVT LTD',
    amount: '1,85,400',
    delivery: '10 days',
    rating: '4.5/5'
  }

  async function fetchApprovals() {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, quotations(*, rfqs(*), vendors(*))')
      .eq('status', 'Pending')
      .limit(1)
      .single()

    if (!error && data) {
      setPendingPO({
        id: data.id,
        vendor: data.quotations?.vendors?.name || 'Infra Supplies PVT LTD',
        amount: Number(data.grand_total || data.quotations?.total_price || 185400).toLocaleString('en-IN'),
        delivery: `${data.quotations?.delivery_days || 10} days`,
        rating: data.quotations?.vendors?.rating ? `${data.quotations.vendors.rating}/5` : '4.5/5'
      })
    } else {
      setPendingPO(mockPendingApproval)
    }
    setLoading(false)
  }

  useEffect(() => { fetchApprovals() }, [])

  const handleDecision = async (status) => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (pendingPO.id === 'mock-po-id') {
      await supabase.from('activity_logs').insert({
        action: `PO ${status === 'Approved' ? 'approved' : 'rejected'} by manager. Remarks: ${remarks}`,
        entity_type: 'purchase_order',
        user_id: user?.id
      })
      setTimeout(() => navigate('/purchase-orders'), 1200)
    } else {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status, approved_by: user?.id })
        .eq('id', pendingPO.id)

      if (error) {
        alert(error.message)
      } else {
        await supabase.from('activity_logs').insert({
          action: `Purchase Order ${status === 'Approved' ? 'approved' : 'rejected'} by manager. Remarks: ${remarks}`,
          entity_type: 'purchase_order',
          user_id: user?.id
        })
        setTimeout(() => navigate('/purchase-orders'), 1200)
      }
    }
    setSubmitting(false)
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-0">
        
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-medium text-gray-900 mb-1">Approval Workflow</h1>
          <p className="text-gray-900 text-[15px]">
            RFQ: office furniture Q2 - Vendor: Infra Supplies - 185400
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !pendingPO ? (
          <div className="bg-white rounded-xl border border-gray-300 p-10 text-center text-gray-500 shadow-sm">
            <p className="font-medium text-gray-700">No procurement requests are currently awaiting approval.</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Stepper matching Excalidraw */}
            <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-sm text-gray-800">1</div>
                <span className="text-xs text-gray-800">Submitted</span>
              </div>
              
              <div className="flex-1 h-px bg-gray-400 mx-4" />
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-sm text-gray-800">2</div>
                <span className="text-xs text-gray-800">L1 Review</span>
              </div>

              <div className="flex-1 h-px bg-gray-400 mx-4" />

              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-50 flex items-center justify-center text-sm font-medium text-gray-800">3</div>
                <span className="text-xs text-blue-500 font-medium">L2 approval</span>
              </div>

              <div className="flex-1 h-px bg-gray-400 mx-4" />

              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-sm text-gray-800">4</div>
                <span className="text-xs text-gray-800">Generate PO</span>
              </div>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Left Column */}
              <div className="space-y-8">
                {/* Approval Chain */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-6">
                    Approval Chain
                  </h2>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    
                    {/* Item 1 */}
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center shrink-0 bg-white z-10 mt-1">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-[13px] text-gray-900 font-medium">Rahul Mehta (Procurement head)</p>
                        <p className="text-[12px] text-gray-600">Approved on may 20, 10:32 Am</p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center shrink-0 bg-white z-10 mt-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[13px] text-gray-900 font-medium">Priya Shah (Finance manager)</p>
                        <p className="text-[12px] text-gray-600">Awaiting<br/>Assigned may 21</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-300" />

                {/* Approval Remarks */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">
                    Approval Remarks
                  </h2>
                  <textarea
                    className="w-full p-3 border border-gray-400 rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-600 resize-none"
                    rows={4}
                    placeholder="Add your comments or conditions..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Quotations Summary Box */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">
                    Quotations Summary
                  </h2>
                  <div className="border border-gray-400 rounded-lg p-5 bg-white space-y-4">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-gray-800">Vendor:</span>
                      <span className="text-gray-900 font-medium text-right">{pendingPO.vendor}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-gray-900 font-medium text-right">{pendingPO.amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-gray-800">Delivery:</span>
                      <span className="text-gray-900 font-medium text-right">{pendingPO.delivery}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-gray-800">Rating:</span>
                      <span className="text-gray-900 font-medium text-right">{pendingPO.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleDecision('Approved')}
                    disabled={submitting}
                    className="flex-1 py-2.5 border border-gray-400 rounded-md text-[13px] text-gray-800 font-medium hover:bg-gray-50 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision('Rejected')}
                    disabled={submitting}
                    className="flex-1 py-2.5 border border-gray-400 rounded-md text-[13px] text-gray-800 font-medium hover:bg-gray-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
