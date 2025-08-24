"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Shield, Heart } from "lucide-react"
import { GoogleSignInButton } from "@/components/google-signin-button"
import { userStorageService } from "@/lib/user-storage"

export default function LoginPage() {
  const { user, setUser, loading } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (user) {
      router.push("/profile")
    }
  }, [user, router])

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      setIsSigningIn(true)
      
      // Check if user already exists
      let userData = userStorageService.getUserByEmail(googleUser.email)
      
      if (userData) {
        // User exists, update last login and set as current user
        userStorageService.setCurrentUserId(userData.id)
        userData = userStorageService.updateUser(userData.id, {
          lastLogin: new Date().toISOString()
        })
      } else {
        // Create new user
        userData = userStorageService.createUser(googleUser)
      }
      
      if (userData) {
        // Update auth context
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture
        })
        
        // Redirect to profile
        router.push("/profile")
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGoogleError = (error: any) => {
    console.error('Google Sign-In error:', error)
    setIsSigningIn(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to H.E.A.L.</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Health Evaluation by AI Logic - Your AI-powered health assistant for personalized care and wellness
              tracking
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Health Tracking</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">AI Insights</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Secure Care</p>
            </div>
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            loading={isSigningIn}
          />

          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy. Your health data is encrypted and
            secure.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
