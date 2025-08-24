export interface UserData {
  id: string
  name: string
  email: string
  picture: string
  createdAt: string
  lastLogin: string
  healthData: {
    restingHeartRate: number
    heartRateVariability: number
    caloriesBurned: number
    medications: Array<{
      id: string
      name: string
      dosage: string
      frequency: string
      timesTaken: string[]
      color: string
    }>
    moodEntries: Array<{
      id: string
      mood: -2 | -1 | 0 | 1 | 2
      journalEntries?: string[]
      date: string
      emoji: string
    }>
    sleepEntries: Array<{
      id: string
      hoursSlept: number
      score: number
      date: string
    }>
    heartRateEntries: Array<{
      id: string
      date: string
      restingHR: number
      hrv: number
      caloriesBurned: number
    }>
    chatHistory: Array<{
      id: string
      date: string
      summary: string
      keyFindings: string[]
      recommendations: string[]
    }>
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    privacyLevel: 'public' | 'private' | 'friends'
  }
}

export interface UserStorage {
  [userId: string]: UserData
}

class UserStorageService {
  private storageKey = 'health-ai-users'
  private currentUserId: string | null = null

  // Generate a unique user ID based on email
  private generateUserId(email: string): string {
    return `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
  }

  // Get all users from storage
  private getAllUsers(): UserStorage {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to parse user storage:', error)
      return {}
    }
  }

  // Save all users to storage
  private saveAllUsers(users: UserStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(users, null, 2))
    } catch (error) {
      console.error('Failed to save user storage:', error)
    }
  }

  // Create a new user
  createUser(googleUser: any): UserData {
    const userId = this.generateUserId(googleUser.email)
    this.currentUserId = userId

    const newUser: UserData = {
      id: userId,
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      healthData: {
        restingHeartRate: 72,
        heartRateVariability: 45,
        caloriesBurned: 1850,
        medications: [],
        moodEntries: [],
        sleepEntries: [],
        heartRateEntries: [],
        chatHistory: []
      },
      preferences: {
        theme: 'system',
        notifications: true,
        privacyLevel: 'private'
      }
    }

    const allUsers = this.getAllUsers()
    allUsers[userId] = newUser
    this.saveAllUsers(allUsers)

    return newUser
  }

  // Get user by ID
  getUser(userId: string): UserData | null {
    const allUsers = this.getAllUsers()
    return allUsers[userId] || null
  }

  // Get user by email
  getUserByEmail(email: string): UserData | null {
    const allUsers = this.getAllUsers()
    return Object.values(allUsers).find(user => user.email === email) || null
  }

  // Update user data
  updateUser(userId: string, updates: Partial<UserData>): UserData | null {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return null

    allUsers[userId] = {
      ...allUsers[userId],
      ...updates,
      lastLogin: new Date().toISOString()
    }

    this.saveAllUsers(allUsers)
    return allUsers[userId]
  }

  // Update user's health data
  updateUserHealthData(userId: string, healthDataUpdates: Partial<UserData['healthData']>): UserData | null {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return null

    allUsers[userId].healthData = {
      ...allUsers[userId].healthData,
      ...healthDataUpdates
    }

    this.saveAllUsers(allUsers)
    return allUsers[userId]
  }

  // Add medication to user
  addMedication(userId: string, medication: UserData['healthData']['medications'][0]): UserData | null {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return null

    allUsers[userId].healthData.medications.push(medication)
    this.saveAllUsers(allUsers)
    return allUsers[userId]
  }

  // Add mood entry to user
  addMoodEntry(userId: string, moodEntry: UserData['healthData']['moodEntries'][0]): UserData | null {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return null

    allUsers[userId].healthData.moodEntries.unshift(moodEntry) // Add to beginning
    this.saveAllUsers(allUsers)
    return allUsers[userId]
  }

  // Add sleep entry to user
  addSleepEntry(userId: string, sleepEntry: UserData['healthData']['sleepEntries'][0]): UserData | null {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return null

    allUsers[userId].healthData.sleepEntries.unshift(sleepEntry) // Add to beginning
    this.saveAllUsers(allUsers)
    return allUsers[userId]
  }

  // Add chat history to user
  addChatHistory(userId: string, chatEntry: UserData['healthData']['chatHistory'][0]): UserData | null {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return null

    allUsers[userId].healthData.chatHistory.unshift(chatEntry) // Add to beginning
    this.saveAllUsers(allUsers)
    return allUsers[userId]
  }

  // Delete user
  deleteUser(userId: string): boolean {
    const allUsers = this.getAllUsers()
    if (!allUsers[userId]) return false

    delete allUsers[userId]
    this.saveAllUsers(allUsers)
    
    if (this.currentUserId === userId) {
      this.currentUserId = null
    }

    return true
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  // Set current user ID
  setCurrentUserId(userId: string): void {
    this.currentUserId = userId
  }

  // Get current user data
  getCurrentUser(): UserData | null {
    if (!this.currentUserId) return null
    return this.getUser(this.currentUserId)
  }

  // Export all user data (for backup/debugging)
  exportAllData(): string {
    const allUsers = this.getAllUsers()
    return JSON.stringify(allUsers, null, 2)
  }

  // Import user data (for backup/restore)
  importData(data: string): boolean {
    try {
      const parsedData = JSON.parse(data)
      if (typeof parsedData === 'object' && parsedData !== null) {
        this.saveAllUsers(parsedData)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import user data:', error)
      return false
    }
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    localStorage.removeItem(this.storageKey)
    this.currentUserId = null
  }
}

export const userStorageService = new UserStorageService()
