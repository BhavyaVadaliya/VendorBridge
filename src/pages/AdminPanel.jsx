import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  Shield,
  Trash2,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  ShieldAlert,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user: currentUser, profile: currentProfile, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [manualDeleteId, setManualDeleteId] = useState('')
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null)
  
  // Feedback messages
  const [feedback, setFeedback] = useState({ type: '', text: '' })

  function showFeedback(type, text) {
    setFeedback({ type, text })
    setTimeout(() => {
      setFeedback({ type: '', text: '' })
    }, 5000)
  }

  async function fetchUsers() {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_get_users')
      if (error) {
        // If the RPC fails, check if we need to explain to the user to run SQL
        if (error.message.includes('does not exist')) {
          showFeedback('error', 'Database RPC function "admin_get_users" not found. Please run the migration SQL script in your Supabase SQL Editor.')
        } else {
          showFeedback('error', error.message)
        }
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      console.error(err)
      showFeedback('error', 'Failed to retrieve users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || currentProfile?.role !== 'admin') {
        navigate('/dashboard')
      } else {
        fetchUsers()
      }
    }
  }, [currentUser, currentProfile, authLoading])

  async function handleDeleteUser(targetUser) {
    if (!targetUser) return
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: targetUser.id
      })

      if (error) {
        showFeedback('error', error.message)
      } else {
        // Log activity
        await supabase.from('activity_logs').insert({
          action: `Permanently deleted user: ${targetUser.email} (Name: ${targetUser.full_name || 'N/A'}, ID: ${targetUser.id})`,
          entity_type: 'user',
          user_id: currentUser.id
        })

        showFeedback('success', `User ${targetUser.email} has been permanently deleted.`)
        fetchUsers()
      }
    } catch (err) {
      console.error(err)
      showFeedback('error', 'Failed to delete user.')
    } finally {
      setActionLoading(false)
      setDeleteConfirmUser(null)
    }
  }

  async function handleManualDelete(e) {
    e.preventDefault()
    const targetId = manualDeleteId.trim()
    if (!targetId) {
      showFeedback('error', 'Please enter a valid User UUID.')
      return
    }

    // UUID verification regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetId)) {
      showFeedback('error', 'Invalid UUID format. Please provide a standard 36-character user ID.')
      return
    }

    if (targetId === currentUser.id) {
      showFeedback('error', 'You cannot delete your own admin account.')
      return
    }

    // Try to find the user in our local list first to give detailed confirm dialog
    const targetUser = users.find(u => u.id === targetId) || { id: targetId, email: 'User with ID: ' + targetId, full_name: 'Manual Deletion' }
    setDeleteConfirmUser(targetUser)
  }

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase()
    return (
      u.email?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query) ||
      u.id?.toLowerCase().includes(query)
    )
  })

  // Auth roles color badges
  const roleBadges = {
    admin: 'bg-rose-100 text-rose-800 border-rose-200',
    manager: 'bg-purple-100 text-purple-800 border-purple-200',
    officer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    vendor: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  if (authLoading || (!currentUser || currentProfile?.role !== 'admin')) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f5f7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Validating Admin Credentials...</span>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
              <p className="text-xs text-gray-500 mt-1">
                Manage user credentials, database states, and permanently delete registered profiles.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800 font-medium shadow-sm">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Authorized: Admin Root Role</span>
          </div>
        </div>

        {/* Alerts / Toasts */}
        {feedback.text && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all duration-300 animate-slide-down ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <span className="font-semibold block capitalize">{feedback.type}</span>
              <span>{feedback.text}</span>
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: User Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              {/* Header and Search */}
              <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Active User Logins</h2>
                  <p className="text-xs text-gray-500">List of credentialed users from auth.users joined with profiles.</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name, email, role or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition bg-white"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">User Profile</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Joined Date</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Danger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                          <span>Fetching authentication records...</span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-gray-500 font-medium">
                          No users found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const isSelf = user.id === currentUser.id
                        return (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            {/* User details */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSelf ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-gray-900 text-xs truncate">
                                      {user.full_name || 'N/A'}
                                    </span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-500 text-[11px] mt-0.5">
                                    <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-1 font-mono select-all">
                                    ID: {user.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role badge */}
                            <td className="px-5 py-4 vertical-middle">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize tracking-wide ${
                                roleBadges[user.role?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                                {user.role || 'Officer'}
                              </span>
                            </td>

                            {/* Registered timestamp */}
                            <td className="px-5 py-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                              </div>
                            </td>

                            {/* Action columns */}
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => setDeleteConfirmUser(user)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg border transition-colors inline-flex items-center justify-center ${
                                  isSelf 
                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                }`}
                                title={isSelf ? 'Cannot delete yourself' : 'Delete user permanently'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Delete Action and Statistics */}
          <div className="space-y-6">
            
            {/* Direct Delete Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Force Delete by UUID</h3>
                  <p className="text-[11px] text-gray-500">Instant deletion via explicit User ID</p>
                </div>
              </div>

              <form onSubmit={handleManualDelete} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">USER UUID</label>
                  <input
                    type="text"
                    required
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={manualDeleteId}
                    onChange={(e) => setManualDeleteId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 hover:shadow-md transition duration-200 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User Permanently</span>
                </button>
              </form>
            </div>

            {/* Admin Stats Panel */}
            <div className="bg-gradient-to-br from-[#0f1117] to-[#1a1d24] text-white rounded-2xl p-5 space-y-4 shadow-sm border border-gray-800">
              <h3 className="font-bold text-sm border-b border-gray-800 pb-2">System Audit Stats</h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total System Logins:</span>
                  <span className="font-bold font-mono bg-gray-800 px-2 py-0.5 rounded">{users.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Administrators:</span>
                  <span className="font-bold font-mono text-rose-400 bg-rose-950/20 border border-rose-900/30 px-2 py-0.5 rounded">
                    {users.filter(u => u.role === 'admin').length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Managers/Approvers:</span>
                  <span className="font-bold font-mono text-purple-400 bg-purple-950/20 border border-purple-900/30 px-2 py-0.5 rounded">
                    {users.filter(u => u.role === 'manager').length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Procurement Officers:</span>
                  <span className="font-bold font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                    {users.filter(u => u.role === 'officer').length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Registered Vendors:</span>
                  <span className="font-bold font-mono text-blue-400 bg-blue-950/20 border border-blue-900/30 px-2 py-0.5 rounded">
                    {users.filter(u => u.role === 'vendor').length}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="p-6 pb-4 bg-rose-50 border-b border-rose-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Permanent Deletion</h3>
                <p className="text-xs text-rose-700 font-semibold mt-1">This operation is destructive and cannot be undone.</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                You are about to permanently delete the user login record, profile details, and trigger cascading deletions on associated tables.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-bold text-gray-900">{deleteConfirmUser.full_name || 'Manual Delete / Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email Login:</span>
                  <span className="font-semibold text-gray-900 font-mono">{deleteConfirmUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="font-semibold capitalize text-gray-900">{deleteConfirmUser.role || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-gray-200">
                  <span className="text-gray-400">Database User UUID:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-[10px] break-all select-all font-semibold">
                    {deleteConfirmUser.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={actionLoading}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
