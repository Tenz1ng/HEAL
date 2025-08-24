"use client"

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface GoogleSignInButtonProps {
  onSuccess: (user: any) => void
  onError: (error: any) => void
  loading?: boolean
}

export function GoogleSignInButton({ onSuccess, onError, loading }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Google Identity Services
    const initializeGoogleSignIn = async () => {
      try {
        // Load Google Identity Services script
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        
        script.onload = () => {
          if (window.google && buttonRef.current) {
            window.google.accounts.id.initialize({
              client_id: '333881841466-i6gtcfauegsaria13tu36vvsbutqkeme.apps.googleusercontent.com',
              callback: (response: any) => {
                try {
                  // Decode the JWT response
                  const decoded = decodeJwtResponse(response.credential)
                  onSuccess(decoded)
                } catch (error) {
                  onError(error)
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
            })

            // Render the Google Sign-In button
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: '100%',
            })
          }
        }
        
        script.onerror = () => {
          onError(new Error('Failed to load Google Identity Services'))
        }
        
        document.head.appendChild(script)
      } catch (error) {
        onError(error)
      }
    }

    initializeGoogleSignIn()
  }, [onSuccess, onError])

  const decodeJwtResponse = (token: string): any => {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }

  if (loading) {
    return (
      <Button disabled className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-3"></div>
        Signing in...
      </Button>
    )
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full"></div>
    </div>
  )
}
