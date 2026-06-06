import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { Settings as SettingsIcon, Shield, User, Plus, X, Check } from 'lucide-react'

const ALL_MODULES = [
  'Dashboard', 'Vendors', 'RFQs', 'Quotations', 'Approvals', 'Invoices', 'Reports', 'Activity'
]

export default function Settings() {
  const { profile: currentAdminProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states for new user
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('officer')
  const [permissions, setPermissions] = useState([])
  
  // Edge Case: Track current user
  const [currentUserId, setCurrentUserId] = useState(null)

  async function fetchUsers() {
    setLoading(true)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    
    // SaaS: Only fetch users belonging to the admin's company workspace
    if (currentAdminProfile?.company_id) {
      query = query.eq('company_id', currentAdminProfile.company_id)
    }

    const { data, error } = await query
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => {
    if (currentAdminProfile) {
      fetchUsers()
    }
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id))
  }, [currentAdminProfile])

  const togglePermission = (mod, currentPerms, setter) => {
    if (currentPerms.includes(mod)) {
      setter(currentPerms.filter(p => p !== mod))
    } else {
      setter([...currentPerms, mod])
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    // 1. Sign up the user (this might log the admin out if they aren't careful, but we handle it as best we can here)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password
    })

    if (authError) {
      alert(authError.message)
      setSubmitting(false)
      return
    }

    if (authData?.user) {
      // 2. Insert into profiles with custom permissions AND the admin's company_id
      const profilePayload = {
        id: authData.user.id,
        full_name: fullName,
        role: role,
        permissions: permissions
      }
      if (currentAdminProfile?.company_id) {
        profilePayload.company_id = currentAdminProfile.company_id
      }

      const { error: profileError } = await supabase.from('profiles').insert(profilePayload)

      if (profileError) {
        // If "column permissions does not exist", handle gracefully
        if (profileError.message.includes('permissions')) {
          alert("Error: The 'permissions' column does not exist in the database. Please run the SQL command provided.")
        } else {
          alert(profileError.message)
        }
      } else {
        alert("User successfully added! (If your admin session was overwritten, please re-login).")
        setIsAddingUser(false)
        setEmail('')
        setPassword('')
        setFullName('')
        setPermissions([])
        fetchUsers()
      }
    }
    setSubmitting(false)
  }

  const handleUpdatePermissions = async (userId, currentPerms) => {
    const { error } = await supabase.from('profiles').update({ permissions: currentPerms }).eq('id', userId)
    if (error) {
      alert("Failed to update: " + error.message)
    } else {
      setEditingUserId(null)
      fetchUsers()
    }
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-0">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-800">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings & Access Control</h1>
              <p className="text-sm text-gray-500 mt-1">Manage personnel, roles, and module permissions.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Personnel
          </button>
        </div>

        {/* Add User Modal / Inline Form */}
        {isAddingUser && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" /> Add New Personnel
              </h2>
              <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-green-500" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-green-500" placeholder="jane@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-green-500" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-green-500">
                    <option value="officer">Procurement Officer</option>
                    <option value="manager">Manager / Approver</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" /> Custom Module Access
                </h3>
                <p className="text-xs text-gray-500 mb-4">Select exactly which modules this user should see in their sidebar.</p>
                <div className="flex flex-wrap gap-3">
                  {ALL_MODULES.map(mod => {
                    const hasAccess = permissions.includes(mod)
                    return (
                      <label key={mod} className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer transition ${hasAccess ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-gray-300 bg-white text-gray-600'}`}>
                        <input type="checkbox" className="hidden" checked={hasAccess} onChange={() => togglePermission(mod, permissions, setPermissions)} />
                        {hasAccess ? <Check className="w-4 h-4 text-green-600" /> : <div className="w-4 h-4 border border-gray-300 rounded-sm" />}
                        <span className="text-sm">{mod}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-bold text-gray-900">Personnel Roster</h2>
          </div>
          
          {loading ? (
            <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-white">
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Permissions (Access)</th>
                    <th className="p-4 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => {
                    const isEditing = editingUserId === u.id
                    const uPerms = Array.isArray(u.permissions) ? u.permissions : []
                    
                    const handleDeleteUser = async () => {
                      if (u.id === currentUserId) {
                        alert("Edge Case Prevented: You cannot deactivate your own Admin account.")
                        return
                      }
                      if (window.confirm(`Are you sure you want to deactivate ${u.full_name}? This will revoke their ERP access permanently.`)) {
                        const { error } = await supabase.from('profiles').delete().eq('id', u.id)
                        if (error) {
                          alert("Failed to deactivate: " + error.message)
                        } else {
                          fetchUsers()
                        }
                      }
                    }

                    return (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-900 font-medium">
                          {u.full_name}
                          {u.role === 'admin' && <span className="ml-2 inline-flex bg-red-100 text-red-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Admin</span>}
                          {u.id === currentUserId && <span className="ml-2 inline-flex bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">You</span>}
                        </td>
                        <td className="p-4 text-gray-600 capitalize">{u.role}</td>
                        <td className="p-4">
                          {isEditing ? (
                             <div className="flex flex-wrap gap-2">
                               {ALL_MODULES.map(mod => {
                                 const hasAccess = uPerms.includes(mod)
                                 return (
                                   <label key={mod} className={`flex items-center gap-1.5 px-2 py-1 border rounded text-xs cursor-pointer ${hasAccess ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500'}`}>
                                     <input type="checkbox" className="hidden" checked={hasAccess} 
                                       onChange={() => {
                                         const newPerms = hasAccess ? uPerms.filter(p => p !== mod) : [...uPerms, mod]
                                         setUsers(users.map(usr => usr.id === u.id ? { ...usr, permissions: newPerms } : usr))
                                       }} 
                                     />
                                     {mod}
                                   </label>
                                 )
                               })}
                             </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {u.role === 'admin' ? (
                                <span className="text-xs text-gray-500 italic">Full Access</span>
                              ) : uPerms.length > 0 ? (
                                uPerms.map(p => <span key={p} className="bg-gray-100 border border-gray-200 text-gray-700 text-[11px] px-1.5 py-0.5 rounded">{p}</span>)
                              ) : (
                                <span className="text-xs text-gray-400">No specific access set (Default)</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                              {u.role !== 'admin' && (
                                <>
                                  {isEditing ? (
                                    <button onClick={() => handleUpdatePermissions(u.id, uPerms)} className="text-green-600 text-xs font-semibold hover:text-green-800 bg-green-50 px-3 py-1.5 rounded">Save</button>
                                  ) : (
                                    <button onClick={() => setEditingUserId(u.id)} className="text-gray-500 text-xs font-semibold hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded bg-white">Edit Access</button>
                                  )}
                                </>
                              )}
                              {/* Deactivate User Button */}
                              <button 
                                onClick={handleDeleteUser}
                                disabled={u.id === currentUserId}
                                className={`text-xs font-semibold px-3 py-1.5 rounded border ${u.id === currentUserId ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-red-600 hover:text-white hover:bg-red-600 border-red-200 bg-white'} transition`}
                                title={u.id === currentUserId ? "Cannot delete yourself" : "Revoke Access"}
                              >
                                Revoke
                              </button>
                            </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
