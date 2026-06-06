import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { CheckCircle, XCircle, Clock, Check, X, AlertTriangle, Info } from 'lucide-react'

// ── Step indicator component ──────────────────────────────────────────────────
function StepItem({ number, label, state }) {
  // state: 'done' | 'active' | 'pending'
  return (
    <div className="flex items-center gap-2">
      {state === 'done' && (
        <CheckCircle className="w-6 h-6 text-green-500 fill-green-500 shrink-0" />
      )}
      {state === 'active' && (
        <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center shrink-0 animate-pulse bg-green-50">
          <span className="text-[11px] font-extrabold text-green-600">{number}</span>
        </div>
      )}
      {state === 'pending' && (
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-gray-400">{number}</span>
        </div>
      )}
      <span className={`text-sm font-semibold ${
        state === 'done' ? 'text-green-600' :
        state === 'active' ? 'text-green-700' :
        'text-gray-400'
      }`}>
        {label}
      </span>
    </div>
  )
}

// ── Timeline entry component ──────────────────────────────────────────────────
function TimelineEntry({ icon, iconBg, iconColor, title, actor, date, pulsing }) {
  return (
    <div className="relative">
      <span className={`absolute -left-9 top-0 w-6 h-6 rounded-full ${iconBg} flex items-center justify-center ${iconColor} ${pulsing ? 'animate-pulse' : ''}`}>
        {icon}
      </span>
      <div>
        <span className={`font-bold ${iconColor === 'text-blue-600' ? 'text-blue-600' : iconColor === 'text-gray-400' ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </span>
        {actor && <span className="text-gray-500"> &mdash; {actor}</span>}
        {date && <span className="text-xs text-gray-400 ml-1">&mdash; {date}</span>}
      </div>
    </div>
  )
}

export default function Approvals() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pendingPO, setPendingPO] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [decision, setDecision] = useState(null) // 'Approved' | 'Rejected' | null

  // High-fidelity fallback if no pending approvals in DB
  const mockPendingApproval = {
    id: 'mock-po-id',
    po_number: 'PO-2025-8134',
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
        po_number: data.po_number,
        rfq_title: data.quotations?.rfqs?.title || 'Office Furniture Procurement Q2',
        vendor: data.quotations?.vendors?.name || 'Infra Supplies',
        amount: Number(data.grand_total) || Number(data.quotations?.total_price) || 95400,
        delivery: `${data.quotations?.delivery_days || 15} Days`,
        payment_terms: data.quotations?.payment_terms || 'Net 30',
        submitted_by: 'John Doe (Procurement Officer)',
        date: new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      })
    } else {
      setPendingPO(mockPendingApproval)
    }
    setLoading(false)
  }

  useEffect(() => { fetchApprovals() }, [])

  const handleDecision = async (status) => {
    if (!remarks.trim()) {
      setRemarksError('Approval remarks are required before making a decision.')
      return
    }
    setRemarksError('')
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (pendingPO.id === 'mock-po-id') {
      await supabase.from('activity_logs').insert({
        action: `PO ${status === 'Approved' ? 'approved' : 'rejected'} by manager. Remarks: ${remarks}`,
        entity_type: 'purchase_order',
        user_id: user?.id
      })
      setDecision(status)
      setTimeout(() => navigate('/purchase-orders'), 1800)
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
        setDecision(status)
        setTimeout(() => navigate('/purchase-orders'), 1800)
      }
    }
    setSubmitting(false)
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="pb-4 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Approvals &gt; Review
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
          {pendingPO && !loading && (
            <p className="text-sm text-gray-500 mt-1">
              RFQ: <span className="font-semibold text-gray-700">{pendingPO.rfq_title}</span>
              {' '}—{' '}Vendor: <span className="font-semibold text-gray-700">{pendingPO.vendor}</span>
              {' '}—{' '}<span className="font-semibold text-green-600">₹{Number(pendingPO.amount).toLocaleString('en-IN')}</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !pendingPO ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500 shadow-sm space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="font-semibold text-gray-700">All caught up!</p>
            <p className="text-sm">No procurement requests are currently awaiting approval.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Decision Success Banner ─────────────────────────────────── */}
            {decision && (
              <div className={`rounded-xl border p-4 flex items-center gap-3 shadow-sm ${
                decision === 'Approved'
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {decision === 'Approved'
                  ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                }
                <span className="font-semibold text-sm">
                  {decision === 'Approved'
                    ? `Purchase Order approved successfully. Redirecting to PO page...`
                    : `Purchase Order rejected. Redirecting...`
                  }
                </span>
              </div>
            )}

            {/* ── Progress Stepper ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 max-w-2xl mx-auto">
                <StepItem number={1} label="Quotation Selected" state="done" />

                {/* Connector */}
                <div className="hidden sm:block flex-1 max-w-[80px] h-[2px] bg-green-400 mx-3" />

                <StepItem number={2} label="Manager Review" state={decision ? 'done' : 'active'} />

                {/* Connector */}
                <div className={`hidden sm:block flex-1 max-w-[80px] h-[2px] mx-3 ${decision === 'Approved' ? 'bg-green-400' : 'bg-gray-200'}`} />

                <StepItem number={3} label="Final Approval" state={decision === 'Approved' ? 'done' : 'pending'} />
              </div>
            </div>

            {/* ── Split Panels ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left: Procurement Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3">
                  Procurement Summary
                </h2>

                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">RFQ Title</span>
                    <span className="font-semibold text-gray-900">{pendingPO.rfq_title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Selected Vendor</span>
                    <span className="font-semibold text-gray-900">{pendingPO.vendor}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Quotation Amount</span>
                    <span className="font-bold text-green-600 text-base">
                      ₹{Number(pendingPO.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Delivery Timeline</span>
                    <span className="font-semibold text-gray-900">{pendingPO.delivery}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Payment Terms</span>
                    <span className="font-semibold text-gray-900">{pendingPO.payment_terms}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Submitted By</span>
                    <span className="font-semibold text-gray-900">{pendingPO.submitted_by}</span>
                  </div>
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Submission Date</span>
                    <span className="font-semibold text-gray-900">{pendingPO.date}</span>
                  </div>
                </div>
              </div>

              {/* Right: Review & Decision */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3 mb-4">
                    Review &amp; Decision
                  </h2>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Approval Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                      rows={5}
                      placeholder="Add your comments or remarks..."
                      value={remarks}
                      onChange={(e) => { setRemarks(e.target.value); if (remarksError) setRemarksError('') }}
                      disabled={!!decision}
                    />
                    {remarksError && (
                      <p className="text-red-500 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {remarksError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Approve / Reject buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDecision('Approved')}
                      disabled={submitting || !!decision}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition shadow-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4.5 h-4.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDecision('Rejected')}
                      disabled={submitting || !!decision}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition shadow-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4.5 h-4.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  {/* Request more info link */}
                  <div className="text-center">
                    <button className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition underline underline-offset-2">
                      Request More Information
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Vertical Timeline ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3">
                Approval Process Timeline
              </h2>

              <div className="relative border-l-2 border-gray-200 pl-6 ml-4 space-y-6 text-sm text-gray-600 py-2">

                <TimelineEntry
                  icon={<Check className="w-3.5 h-3.5" />}
                  iconBg="bg-green-100"
                  iconColor="text-green-600"
                  title="RFQ Created"
                  actor="John Doe"
                  date="10 May 2025"
                />

                <TimelineEntry
                  icon={<Check className="w-3.5 h-3.5" />}
                  iconBg="bg-green-100"
                  iconColor="text-green-600"
                  title="Quotations Received (3)"
                  actor="System"
                  date="18 May 2025"
                />

                <TimelineEntry
                  icon={<Check className="w-3.5 h-3.5" />}
                  iconBg="bg-green-100"
                  iconColor="text-green-600"
                  title="Best Quote Selected"
                  actor="John Doe"
                  date="22 May 2025"
                />

                {decision === 'Approved' ? (
                  <TimelineEntry
                    icon={<Check className="w-3.5 h-3.5" />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    title="Manager Approved"
                    actor="Manager"
                    date={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                ) : decision === 'Rejected' ? (
                  <TimelineEntry
                    icon={<X className="w-3.5 h-3.5" />}
                    iconBg="bg-red-100"
                    iconColor="text-red-600"
                    title="Manager Rejected"
                    actor="Manager"
                    date={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                ) : (
                  <TimelineEntry
                    icon={<Clock className="w-3.5 h-3.5" />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    title="Pending Manager Approval"
                    actor="Awaiting review..."
                    pulsing
                  />
                )}

                <TimelineEntry
                  icon={<span className="text-[10px] font-bold text-gray-400">5</span>}
                  iconBg={`${decision === 'Approved' ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-300'}`}
                  iconColor="text-gray-400"
                  title="Purchase Order Generation"
                  actor={decision === 'Approved' ? 'Auto-generating PO...' : 'Pending approval'}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  )
}
