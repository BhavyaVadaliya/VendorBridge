import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)
  const [hasProfile, setHasProfile] = useState(undefined)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user) {
        // Edge Case Handling: Verify the user still has an active profile
        // If an Admin deleted their profile in Settings, they lose access.
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()
        
        if (error || !data) {
          await supabase.auth.signOut()
          setHasProfile(false)
        } else {
          setHasProfile(true)
        }
      } else {
        setHasProfile(false)
      }
    }
    
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setHasProfile(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined || hasProfile === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 font-medium">Verifying Credentials...</span>
        </div>
      </div>
    )
  }

  if (!session || !hasProfile) {
    return <Navigate to="/" replace />
  }

  return children
}
