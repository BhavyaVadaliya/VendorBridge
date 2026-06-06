import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Check, Clock, ArrowLeft } from 'lucide-react'

export default function Approvals() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pendingList, setPendingList] = useState([])
  const [selectedPO, setSelectedPO] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'detail'
  const [currentUser, setCurrentUser] = useState(null)

  async function fetchApprovals() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, quotations(*, rfqs(*), vendors(*))')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPendingList(data)
    }
    setLoading(false)
  }

  useEffect(() => { fetchApprovals() }, [])

  const handleSelectPO = (po) => {
    setSelectedPO({
      id: po.id,
      rfq_title: po.quotations?.rfqs?.title || 'Unknown RFQ',
      vendor: po.quotations?.vendors?.name || 'Unknown Vendor',
      amount: Number(po.grand_total || po.quotations?.total_price || 0).toLocaleString('en-IN'),
      delivery: `${po.quotations?.delivery_days || 0} days`,
      rating: po.quotations?.vendors?.rating ? `${po.quotations.vendors.rating}/5` : 'N/A',
      created_at: new Date(po.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    })
    setRemarks('')
    setView('detail')
  }

  const handleDecision = async (status) => {
    setSubmitting(true)

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status, approved_by: currentUser?.id })
      .eq('id', selectedPO.id)

    if (error) {
      alert(error.message)
    } else {
      await supabase.from('activity_logs').insert({
        action: `Purchase Order ${status === 'Approved' ? 'approved' : 'rejected'} by manager. Remarks: ${remarks || 'None'}`,
        entity_type: 'purchase_order',
        user_id: currentUser?.id
      })
      
      // Refresh list and go back to list view
      await fetchApprovals()
      setView('list')
      
      // If approved, maybe user wants to go to POs directly, but standard flow goes back to approvals list
      if (status === 'Approved') {
        navigate('/purchase-orders')
      }
    }
    setSubmitting(false)
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-0">
        
        {view === 'list' && (
          <>
            <div>
              <h1 className="text-[28px] font-medium text-gray-900 mb-1">Pending Approvals</h1>
              <p className="text-gray-600 text-[15px]">
                Review and approve procurement requests.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingList.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-300 p-10 text-center text-gray-500 shadow-sm">
                <p className="font-medium text-gray-700">No procurement requests are currently awaiting approval.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="p-4 font-semibold text-gray-800">RFQ Title</th>
                      <th className="p-4 font-semibold text-gray-800">Vendor</th>
                      <th className="p-4 font-semibold text-gray-800">Amount (₹)</th>
                      <th className="p-4 font-semibold text-gray-800">Submitted On</th>
                      <th className="p-4 font-semibold text-gray-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map(po => (
                      <tr key={po.id} className="border-b border-gray-200 hover:bg-gray-50 last:border-0">
                        <td className="p-4 text-gray-900 font-medium">
                          {po.quotations?.rfqs?.title || 'Unknown RFQ'}
                        </td>
                        <td className="p-4 text-gray-700">
                          {po.quotations?.vendors?.name || 'Unknown Vendor'}
                        </td>
                        <td className="p-4 text-gray-900 font-medium">
                          {Number(po.grand_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(po.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleSelectPO(po)}
                            className="px-4 py-2 border border-green-600 text-green-700 rounded hover:bg-green-50 font-medium transition"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === 'detail' && selectedPO && (
          <>
            <div>
              <button 
                onClick={() => setView('list')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Pending List
              </button>
              <h1 className="text-[28px] font-medium text-gray-900 mb-1">Approval Workflow</h1>
              <p className="text-gray-900 text-[15px]">
                RFQ: {selectedPO.rfq_title} - Vendor: {selectedPO.vendor} - {selectedPO.amount}
              </p>
            </div>

            <div className="space-y-10">
              
              {/* Stepper matching Excalidraw */}
              <div className="flex flex-row items-start justify-between max-w-3xl mx-auto px-4">
                
                <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                  <div className="w-8 h-8 rounded-full border border-gray-800 bg-white flex items-center justify-center text-sm text-gray-800">1</div>
                  <span className="text-[11px] text-gray-800 text-center">Submitted</span>
                </div>
                
                <div className="flex-1 h-px bg-gray-800 mt-4 -mx-8 z-0" />
                
                <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                  <div className="w-8 h-8 rounded-full border border-gray-800 bg-white flex items-center justify-center text-sm text-gray-800">2</div>
                  <span className="text-[11px] text-gray-800 text-center">L1 Review</span>
                </div>

                <div className="flex-1 h-px bg-gray-800 mt-4 -mx-8 z-0" />

                <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                  <div className="w-8 h-8 rounded-full border border-[#fce45c] bg-[#fce45c] flex items-center justify-center text-sm font-medium text-gray-900">3</div>
                  <span className="text-[11px] text-blue-500 font-medium text-center">L2 approval</span>
                </div>

                <div className="flex-1 h-px bg-gray-800 mt-4 -mx-8 z-0" />

                <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                  <div className="w-8 h-8 rounded-full border border-gray-800 bg-white flex items-center justify-center text-sm text-gray-800">4</div>
                  <span className="text-[11px] text-gray-800 text-center">Generate PO</span>
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
                    <div className="space-y-6">
                      
                      {/* Item 1 */}
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center shrink-0 mt-1">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-[13px] text-gray-900 font-medium">Procurement Officer</p>
                          <p className="text-[12px] text-gray-600">Submitted on {selectedPO.created_at}</p>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center shrink-0 mt-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[13px] text-gray-900 font-medium">Manager / Approver</p>
                          <p className="text-[12px] text-gray-600">Awaiting<br/>Assigned {selectedPO.created_at}</p>
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
                        <span className="text-gray-900 font-medium text-right">{selectedPO.vendor}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-gray-800">Total:</span>
                        <span className="text-gray-900 font-medium text-right">{selectedPO.amount}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-gray-800">Delivery:</span>
                        <span className="text-gray-900 font-medium text-right">{selectedPO.delivery}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-gray-800">Rating:</span>
                        <span className="text-gray-900 font-medium text-right">{selectedPO.rating}</span>
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
          </>
        )}
      </div>
    </Layout>
  )
}
