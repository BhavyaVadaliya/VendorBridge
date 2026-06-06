import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { CheckCircle, XCircle, Clock, Check, AlertTriangle } from 'lucide-react'

export default function Approvals() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pendingPO, setPendingPO] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // High fidelity fallback if no pending approvals are in the DB
  const mockPendingApproval = {
    id: 'mock-po-id',
    rfq_title: 'Office Furniture Procurement Q2',
    vendor: 'Infra Supplies',
    amount: 95400,
    delivery: '15 Days',
    payment_terms: 'Net 30',
    submitted_by: 'John Doe (Procurement Officer)',
    date: '22 May 2025'
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
        rfq_title: data.quotations?.rfqs?.title || 'N/A',
        vendor: data.quotations?.vendors?.name || 'N/A',
        amount: data.grand_total || data.quotations?.total_price || 0,
        delivery: `${data.quotations?.delivery_days || 15} Days`,
        payment_terms: data.quotations?.payment_terms || 'Net 30',
        submitted_by: 'John Doe (Procurement Officer)',
        date: new Date(data.created_at).toLocaleDateString('en-IN')
      })
    } else {
      setPendingPO(mockPendingApproval)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  const handleDecision = async (status) => {
    if (!remarks.trim()) {
      setRemarksError('Approval remarks are required before making a decision.')
      return
    }
    setRemarksError('')
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (pendingPO.id === 'mock-po-id') {
      // Mock flow success redirect
      await supabase.from('activity_logs').insert({
        action: `PO approved via mock preview (Status: ${status})`,
        entity_type: 'purchase_order',
        user_id: user?.id
      })
      navigate('/purchase-orders')
    } else {
      // Real Database flow
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: status,
          approved_by: user?.id
        })
        .eq('id', pendingPO.id)

      if (error) {
        alert(error.message)
      } else {
        await supabase.from('activity_logs').insert({
          action: `Purchase Order ${status === 'Approved' ? 'approved' : 'rejected'} by manager. Remarks: ${remarks}`,
          entity_type: 'purchase_order',
          user_id: user?.id
        })
        navigate('/purchase-orders')
      }
    }
    setSubmitting(false)
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Approvals &gt; Review</div>
            <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
            <p className="text-sm text-gray-500 mt-1">Review quotation selections and authorize purchase orders</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !pendingPO ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
            No procurement requests are currently awaiting approval.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Stepper */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 fill-current" />
                  <span>1. Quotation Selected</span>
                </div>
                <div className="hidden sm:block w-16 h-[2px] bg-green-500"></div>
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-pulse">
                  <Clock className="w-5 h-5 fill-current" />
                  <span>2. Manager Review</span>
                </div>
                <div className="hidden sm:block w-16 h-[2px] bg-gray-200"></div>
                <div className="flex items-center gap-2 text-gray-450 font-bold text-sm">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center text-[10px] text-gray-400">3</div>
                  <span>3. Final Approval</span>
                </div>
              </div>
            </div>

            {/* Split Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Panel: Procurement Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3">
                  Procurement Summary
                </h2>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium">RFQ Title</span>
                    <span className="font-semibold text-gray-900">{pendingPO.rfq_title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium">Selected Vendor</span>
                    <span className="font-semibold text-gray-900">{pendingPO.vendor}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium">Quotation Amount</span>
                    <span className="font-semibold text-green-600 text-base">
                      ₹{pendingPO.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium">Delivery Timeline</span>
                    <span className="font-semibold text-gray-900">{pendingPO.delivery}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium">Payment Terms</span>
                    <span className="font-semibold text-gray-900">{pendingPO.payment_terms}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium">Submitted By</span>
                    <span className="font-semibold text-gray-900">{pendingPO.submitted_by}</span>
                  </div>
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <span className="text-gray-400 block text-xs uppercase font-medium">Submission Date</span>
                    <span className="font-semibold text-gray-900">{pendingPO.date}</span>
                  </div>
                </div>
              </div>

              {/* Right Panel: Review Action */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3 mb-4">
                    Review &amp; Decision
                  </h2>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Approval Remarks</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      rows={4}
                      placeholder="Add your justification comments, terms updates, or remarks..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    {remarksError && (
                      <p className="text-red-500 text-xs flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{remarksError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleDecision('Approved')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition shadow-sm w-full"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDecision('Rejected')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition shadow-sm w-full"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <a href="#" className="text-xs font-semibold text-gray-400 hover:text-gray-600 underline">
                      Request More Information
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Panel: Vertical Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3">
                Approval Process Timeline
              </h2>

              <div className="relative border-l-2 border-gray-150 pl-6 ml-4 space-y-6 text-sm text-gray-600 py-2">
                {/* RFQ Created */}
                <div className="relative">
                  <span className="absolute -left-9 top-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-gray-900">RFQ Created</span> &mdash; John Doe &mdash; <span className="text-xs text-gray-400">10 May 2025</span>
                  </div>
                </div>

                {/* Quotations Received */}
                <div className="relative">
                  <span className="absolute -left-9 top-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-gray-900">Quotations Received (3)</span> &mdash; System &mdash; <span className="text-xs text-gray-400">18 May 2025</span>
                  </div>
                </div>

                {/* Quote Selected */}
                <div className="relative">
                  <span className="absolute -left-9 top-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-gray-900">Best Quote Selected</span> &mdash; John Doe &mdash; <span className="text-xs text-gray-400">22 May 2025</span>
                  </div>
                </div>

                {/* Pending Manager Approval */}
                <div className="relative">
                  <span className="absolute -left-9 top-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-blue-600">Pending Manager Approval</span> &mdash; Awaiting review...
                  </div>
                </div>

                {/* PO Generation */}
                <div className="relative">
                  <span className="absolute -left-9 top-0 w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400">
                    5
                  </span>
                  <div>
                    <span className="font-semibold text-gray-400">Purchase Order Generation</span> &mdash; Pending approval
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
