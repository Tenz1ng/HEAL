"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { userStorageService } from "@/lib/user-storage"
import { useAuth } from "./auth-context"

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  timesTaken: string[]
  color: string
}

interface MoodEntry {
  id: string
  date: string
  mood: -2 | -1 | 0 | 1 | 2 // -2=😢, -1=😕, 0=😐, 1=😊, 2=😄
  emoji: string
  journalEntries: string[]
}

interface SleepEntry {
  id: string
  date: string
  hoursSlept: number
}

interface HeartRateEntry {
  id: string
  date: string
  restingHR: number
  hrv: number
  caloriesBurned: number
}

interface ChatSummary {
  id: string
  date: string
  summary: string
  keyFindings: string[]
  recommendations: string[]
}

interface HealthData {
  heartRate: number // current HR
  restingHeartRate: number // resting HR
  heartRateVariability: number // HRV in milliseconds
  caloriesBurned: number // daily calories burned
  moodScore: number // keeping for backward compatibility
  moodEntries: MoodEntry[]
  sleepEntries: SleepEntry[] // Added sleep entries for tracking sleep history
  heartRateEntries: HeartRateEntry[]
  medications: Medication[]
  chatHistory: ChatSummary[]
}

interface HealthDataContextType {
  healthData: HealthData
  updateHealthData: (data: Partial<HealthData>) => void
  saveChatSummary: (summary: string, keyFindings: string[], recommendations: string[]) => void
  addMoodEntry: (mood: -2 | -1 | 0 | 1 | 2, journalEntry?: string) => void
  addSleepEntry: (hoursSlept: number) => void // Modified to only accept hours, no score calculation
  getDailyMoodAverage: (date: string) => number
  updateHeartRateMetrics: (currentHR: number, restingHR: number, hrv: number) => void
  addHeartRateEntry: (restingHR: number, hrv: number, caloriesBurned: number) => void
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined)

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [healthData, setHealthData] = useState<HealthData>({
    heartRate: 72, // current HR
    restingHeartRate: 58, // typical resting HR
    heartRateVariability: 42, // HRV in milliseconds
    caloriesBurned: 2150, // daily calories burned
    moodScore: 8,
    moodEntries: [],
    sleepEntries: [],
    heartRateEntries: [],
    medications: [],
    chatHistory: []
  })

  // Load user's health data when user changes
  useEffect(() => {
    if (user) {
      const currentUser = userStorageService.getCurrentUser()
      if (currentUser) {
        setHealthData({
          heartRate: currentUser.healthData.restingHeartRate,
          restingHeartRate: currentUser.healthData.restingHeartRate,
          heartRateVariability: currentUser.healthData.heartRateVariability,
          caloriesBurned: currentUser.healthData.caloriesBurned,
          moodScore: currentUser.healthData.moodEntries.length > 0 ? currentUser.healthData.moodEntries[0].mood + 2 : 0,
          moodEntries: currentUser.healthData.moodEntries,
          sleepEntries: currentUser.healthData.sleepEntries,
          heartRateEntries: currentUser.healthData.heartRateEntries,
          medications: currentUser.healthData.medications,
          chatHistory: currentUser.healthData.chatHistory
        })
      }
    }
  }, [user])

  const updateHealthData = (data: Partial<HealthData>) => {
    if (!user) return

    const updatedData = { ...healthData, ...data }
    setHealthData(updatedData)

    // Update in storage
    userStorageService.updateUserHealthData(user.id, {
      restingHeartRate: updatedData.restingHeartRate,
      heartRateVariability: updatedData.heartRateVariability,
      caloriesBurned: updatedData.caloriesBurned,
      medications: updatedData.medications,
      moodEntries: updatedData.moodEntries,
      sleepEntries: updatedData.sleepEntries,
      heartRateEntries: updatedData.heartRateEntries,
      chatHistory: updatedData.chatHistory
    })
  }

  const saveChatSummary = (summary: string, keyFindings: string[], recommendations: string[]) => {
    if (!user) return

    const chatEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      summary,
      keyFindings,
      recommendations,
    }

    const updatedChatHistory = [chatEntry, ...healthData.chatHistory]
    setHealthData(prev => ({ ...prev, chatHistory: updatedChatHistory }))

    // Update in storage
    userStorageService.addChatHistory(user.id, chatEntry)
  }

  const addMoodEntry = (mood: -2 | -1 | 0 | 1 | 2, journalEntry?: string) => {
    if (!user) return

    const moodEmojis = {
      [-2]: "😢",
      [-1]: "😕",
      [0]: "😐",
      [1]: "😊",
      [2]: "😄",
    }

    const moodEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      mood,
      emoji: moodEmojis[mood],
      journalEntries: journalEntry ? [journalEntry] : [],
    }

    const updatedMoodEntries = [moodEntry, ...healthData.moodEntries]
    setHealthData(prev => ({ ...prev, moodEntries: updatedMoodEntries }))

    // Update in storage
    userStorageService.addMoodEntry(user.id, moodEntry)
  }

  const addSleepEntry = (hoursSlept: number) => {
    if (!user) return

    const sleepEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      hoursSlept,
    }

    const updatedSleepEntries = [sleepEntry, ...healthData.sleepEntries]
    setHealthData(prev => ({ ...prev, sleepEntries: updatedSleepEntries }))

    // Update in storage
    userStorageService.addSleepEntry(user.id, sleepEntry)
  }

  const getDailyMoodAverage = (date: string): number => {
    const dayEntries = healthData.moodEntries.filter(entry => entry.date === date)
    if (dayEntries.length === 0) return 0

    const totalMood = dayEntries.reduce((sum, entry) => sum + entry.mood, 0)
    return Math.round(totalMood / dayEntries.length)
  }

  const updateHeartRateMetrics = (currentHR: number, restingHR: number, hrv: number) => {
    if (!user) return

    const updatedData = {
      heartRate: currentHR,
      restingHeartRate: restingHR,
      heartRateVariability: hrv,
    }

    setHealthData(prev => ({ ...prev, ...updatedData }))

    // Update in storage
    userStorageService.updateUserHealthData(user.id, {
      restingHeartRate: restingHR,
      heartRateVariability: hrv
    })
  }

  const addHeartRateEntry = (restingHR: number, hrv: number, caloriesBurned: number) => {
    if (!user) return

    const heartRateEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      restingHR,
      hrv,
      caloriesBurned,
    }

    const updatedHeartRateEntries = [heartRateEntry, ...healthData.heartRateEntries]
    setHealthData(prev => ({ ...prev, heartRateEntries: updatedHeartRateEntries }))

    // Update in storage
    userStorageService.updateUserHealthData(user.id, {
      heartRateEntries: updatedHeartRateEntries
    })
  }

  return (
    <HealthDataContext.Provider
      value={{
        healthData,
        updateHealthData,
        saveChatSummary,
        addMoodEntry,
        addSleepEntry,
        getDailyMoodAverage,
        updateHeartRateMetrics,
        addHeartRateEntry,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  )
}

export function useHealthData() {
  const context = useContext(HealthDataContext)
  if (context === undefined) {
    throw new Error("useHealthData must be used within a HealthDataProvider")
  }
  return context
}
