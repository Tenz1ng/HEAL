"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Heart,
  Moon,
  Activity,
  Plus,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Clock,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useHealthData } from "@/contexts/health-data-context"
import { NavigationBar } from "@/components/navigation-bar"
import { useRouter } from "next/navigation"

interface Reminder {
  id: string
  type: "medication" | "diet" | "exercise" | "checkup"
  title: string
  description: string
  time: string
  completed: boolean
}

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
  mood: -2 | -1 | 0 | 1 | 2 // Updated to use -2 to +2 scale
  journalEntries?: string[]
  date: string
  emoji: string
}

interface SleepEntry {
  id: string
  hoursSlept: number
  score: number
  date: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { healthData, updateHealthData, addMoodEntry, addSleepEntry, getDailyMoodAverage } = useHealthData()

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      type: "medication",
      title: "Take Lisinopril",
      description: "10mg tablet with breakfast",
      time: "08:00",
      completed: false, // Set to false so nothing is initially struck through
    },
    {
      id: "2",
      type: "diet",
      title: "Drink water",
      description: "Aim for 8 glasses throughout the day",
      time: "10:00",
      completed: false,
    },
    {
      id: "3",
      type: "medication",
      title: "Take Metformin",
      description: "500mg tablet with dinner",
      time: "20:00",
      completed: false,
    },
    {
      id: "4",
      type: "exercise",
      title: "Evening walk",
      description: "30 minutes moderate pace",
      time: "18:00",
      completed: false,
    },
  ])

  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false)
  const [newReminder, setNewReminder] = useState({
    type: "medication" as const,
    title: "",
    description: "",
    time: "",
  })

  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false)
  const [isEditMedicationOpen, setIsEditMedicationOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    timesTaken: [""],
    color: "bg-blue-500",
  })

  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false)
  const [selectedMood, setSelectedMood] = useState<-2 | -1 | 0 | 1 | 2 | null>(null) // Updated mood type to -2 to +2
  const [journalEntry, setJournalEntry] = useState("")

  const [isSleepDialogOpen, setIsSleepDialogOpen] = useState(false)
  const [sleepHours, setSleepHours] = useState("")

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState<string | null>(null)

  const moodEmojis = {
    [-2]: "😢",
    [-1]: "😕",
    [0]: "😐",
    [1]: "😊",
    [2]: "😄",
  }

  const moodLabels = {
    [-2]: "Very Sad",
    [-1]: "Sad",
    [0]: "Neutral",
    [1]: "Happy",
    [2]: "Very Happy",
  }

  const addReminder = () => {
    if (!newReminder.title || !newReminder.time) return

    const reminder: Reminder = {
      id: Date.now().toString(),
      type: newReminder.type,
      title: newReminder.title,
      description: newReminder.description,
      time: newReminder.time,
      completed: false,
    }

    setReminders((prev) => [...prev, reminder])
    setNewReminder({ type: "medication", title: "", description: "", time: "" })
    setIsAddReminderOpen(false)
  }

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) return

    const medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      timesTaken: newMedication.timesTaken.filter((time) => time.trim() !== ""),
      color: newMedication.color,
    }

    updateHealthData({
      medications: [...healthData.medications, medication],
    })

    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      timesTaken: [""],
      color: "bg-blue-500",
    })
    setIsAddMedicationOpen(false)
  }

  const editMedication = () => {
    if (!editingMedication || !newMedication.name || !newMedication.dosage || !newMedication.frequency) return

    const updatedMedications = healthData.medications.map((med) =>
      med.id === editingMedication.id
        ? {
            ...med,
            name: newMedication.name,
            dosage: newMedication.dosage,
            frequency: newMedication.frequency,
            timesTaken: newMedication.timesTaken.filter((time) => time.trim() !== ""),
            color: newMedication.color,
          }
        : med,
    )

    updateHealthData({
      medications: updatedMedications,
    })

    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      timesTaken: [""],
      color: "bg-blue-500",
    })
    setEditingMedication(null)
    setIsEditMedicationOpen(false)
  }

  const deleteMedication = () => {
    if (medicationToDelete) {
      updateHealthData({
        medications: healthData.medications.filter((med) => med.id !== medicationToDelete),
      })
      setDeleteConfirmOpen(false)
      setMedicationToDelete(null)
      setIsEditMedicationOpen(false)
    }
  }

  const openEditMedication = (medication: Medication) => {
    setEditingMedication(medication)
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      timesTaken: medication.timesTaken.length > 0 ? medication.timesTaken : [""],
      color: medication.color,
    })
    setIsEditMedicationOpen(true)
  }

  const addTimeSlot = () => {
    setNewMedication((prev) => ({
      ...prev,
      timesTaken: [...prev.timesTaken, ""],
    }))
  }

  const updateTimeSlot = (index: number, value: string) => {
    setNewMedication((prev) => ({
      ...prev,
      timesTaken: prev.timesTaken.map((time, i) => (i === index ? value : time)),
    }))
  }

  const removeTimeSlot = (index: number) => {
    if (newMedication.timesTaken.length > 1) {
      setNewMedication((prev) => ({
        ...prev,
        timesTaken: prev.timesTaken.filter((_, i) => i !== index),
      }))
    }
  }

  const toggleReminder = (id: string) => {
    setReminders((prev) => {
      const updated = prev.map((reminder) =>
        reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder,
      )

      return updated.sort((a, b) => {
        // First sort by completion status (incomplete first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1
        }
        // Then sort by time for items with same completion status
        return a.time.localeCompare(b.time)
      })
    })
  }

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "medication":
        return <Activity className="h-4 w-4" />
      case "diet":
        return <Heart className="h-4 w-4" />
      case "exercise":
        return <TrendingUp className="h-4 w-4" />
      case "checkup":
        return <Moon className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const saveMoodEntry = () => {
    if (selectedMood !== null) {
      const formattedJournalEntry = journalEntry.trim() || undefined

      addMoodEntry(selectedMood, formattedJournalEntry)
      setSelectedMood(null)
      setJournalEntry("")
      setIsMoodDialogOpen(false)
    }
  }

  const saveSleepEntry = () => {
    const hours = Number.parseFloat(sleepHours)
    if (hours > 0 && hours <= 24) {
      addSleepEntry(hours)
      setSleepHours("")
      setIsSleepDialogOpen(false)
    }
  }

  const getCurrentMood = () => {
    if (healthData.moodEntries.length > 0) {
      return healthData.moodEntries[0].mood
    }
    return 0 // Default to neutral
  }

  const getCurrentSleep = () => {
    if (healthData.sleepEntries.length > 0) {
      return healthData.sleepEntries[0]
    }
    return { hoursSlept: 7.5, score: 85 }
  }

  const getLast7DaysSleepData = () => {
    const last7Days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      const sleepEntry = healthData.sleepEntries.find((entry) => entry.date === dateString)
      const hours = sleepEntry ? sleepEntry.hoursSlept : 0

      // Calculate height: max height for >=9 hours, barely visible for 0 hours
      const height = hours === 0 ? 4 : Math.max(4, Math.min(40, (hours / 9) * 40))

      last7Days.push({
        date: dateString,
        hours,
        height,
      })
    }

    return last7Days
  }

  const sleepData = getLast7DaysSleepData()
  const currentSleepHours = sleepData[6]?.hours || 0 // Today's sleep hours

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavigationBar
          active="none"
          unreadCount={3}
          initials={
            user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "JD"
          }
        />

        <div className="container mx-auto max-w-7xl p-8">

          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                      <Heart className="h-4 w-4 text-red-500" />
                      Heart
                    </CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      Above baseline
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Resting HR</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{healthData.restingHeartRate} bpm</span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500">+5</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">HRV (RMSSD)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{healthData.heartRateVariability} ms</span>
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500">-2</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">kcal</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{healthData.caloriesBurned} 🔥</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          router.push("/?message=" + encodeURIComponent("Hey could you please look at my heart trends"))
                        }}
                        variant="outline"
                        className="w-full text-sm font-medium border-2 border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors bg-transparent py-3 px-4"
                      >
                        Ask HEAL about heart trends
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sleep Tracker */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Sleep</h3>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Stable
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {currentSleepHours.toFixed(1)} <span className="text-lg text-gray-500">hours</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-end justify-between gap-1 h-12 mb-2">
                    {sleepData.map((day, index) => (
                      <div
                        key={index}
                        className="bg-blue-300 rounded-sm flex-1"
                        style={{ height: `${day.height}px` }}
                        title={`${day.date}: ${day.hours} hours`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={() => setIsSleepDialogOpen(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Log Sleep Hours
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push("/?message=" + encodeURIComponent("Hey could you please look at my sleep patterns"))
                    }}
                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    Ask HEAL about sleep
                  </Button>
                </div>
              </Card>

              <div className="lg:col-span-1">
                <Card className="h-fit">
                  <CardHeader className="pb-0 pt-3 px-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-yellow-500" />
                        <span className="text-base font-medium">Mood</span>
                        <div className="text-2xl">{moodEmojis[getCurrentMood()]}</div>
                      </div>
                      <Dialog open={isMoodDialogOpen} onOpenChange={setIsMoodDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>How are you feeling today?</DialogTitle>
                            <DialogDescription>
                              Select your current mood and optionally add a journal entry.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="space-y-4">
                              <Label>Select your mood</Label>
                              <div className="flex justify-center gap-4">
                                {([-2, -1, 0, 1, 2] as const).map(
                                  (
                                    mood, // Updated mood array to -2 to +2
                                  ) => (
                                    <button
                                      key={mood}
                                      type="button"
                                      className={`text-4xl p-3 rounded-full transition-all hover:scale-110 ${
                                        selectedMood === mood ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
                                      }`}
                                      onClick={() => setSelectedMood(mood)}
                                    >
                                      {moodEmojis[mood]}
                                    </button>
                                  ),
                                )}
                              </div>
                              {selectedMood !== null && ( // Updated condition to check for null instead of truthy
                                <div className="text-center text-sm text-muted-foreground">
                                  {moodLabels[selectedMood]}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="journal">Journal Entry (Optional)</Label>
                              <Textarea
                                id="journal"
                                placeholder="How was your day? What made you feel this way?"
                                value={journalEntry}
                                onChange={(e) => setJournalEntry(e.target.value)}
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={saveMoodEntry} disabled={selectedMood === null}>
                              <span className="mr-2">
                                {(() => {
                                  const today = new Date().toISOString().split("T")[0]
                                  const avgMood = getDailyMoodAverage(today)
                                  const emojiMap = { [-2]: "😢", [-1]: "😕", [0]: "😐", [1]: "😊", [2]: "😄" }
                                  return emojiMap[avgMood as keyof typeof emojiMap] || "😐"
                                })()}
                              </span>
                              Save Entry
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-3">
              <Tabs defaultValue="reminders" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="reminders" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Reminders
                  </TabsTrigger>
                  <TabsTrigger value="medications" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Medications
                  </TabsTrigger>
                  <TabsTrigger value="health-history" className="gap-2">
                    <Moon className="h-4 w-4" />
                    Health History
                  </TabsTrigger>
                  <TabsTrigger value="chat-history" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reminders" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Today's Reminders</h2>
                    <Dialog open={isAddReminderOpen} onOpenChange={setIsAddReminderOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Reminder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Reminder</DialogTitle>
                          <DialogDescription>
                            Create a new health reminder to help you stay on track with your wellness goals.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                              value={newReminder.type}
                              onValueChange={(value: "medication" | "diet" | "exercise" | "checkup") =>
                                setNewReminder({ ...newReminder, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="medication">Medication</SelectItem>
                                <SelectItem value="diet">Diet</SelectItem>
                                <SelectItem value="exercise">Exercise</SelectItem>
                                <SelectItem value="checkup">Checkup</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={newReminder.title}
                              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                              placeholder="e.g., Take vitamins"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newReminder.description}
                              onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                              placeholder="Additional details about this reminder"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                              id="time"
                              type="time"
                              value={newReminder.time}
                              onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={addReminder}
                            disabled={!newReminder.title || !newReminder.time}
                          >
                            Add Reminder
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {reminders
                      .sort((a, b) => {
                        // First sort by completion status (incomplete first)
                        if (a.completed !== b.completed) {
                          return a.completed ? 1 : -1
                        }
                        // Then sort by time for items with same completion status
                        return a.time.localeCompare(b.time)
                      })
                      .map((reminder) => (
                        <Card
                          key={reminder.id}
                          className={`border shadow-sm transition-colors ${
                            reminder.completed ? "bg-muted/50" : "bg-card"
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-2 rounded-full cursor-pointer ${
                                  reminder.completed ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                                onClick={() => toggleReminder(reminder.id)}
                              >
                                {getReminderIcon(reminder.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3
                                    className={`font-medium ${
                                      reminder.completed ? "line-through text-muted-foreground" : "text-foreground"
                                    }`}
                                  >
                                    {reminder.title}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {reminder.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {reminder.time}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(
                                      `/?message=${encodeURIComponent(`I have a question about this reminder: ${reminder.title}`)}`,
                                    )
                                  }}
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="medications" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Current Medications</h2>
                    <Dialog open={isAddMedicationOpen} onOpenChange={setIsAddMedicationOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Medication
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add New Medication</DialogTitle>
                          <DialogDescription>Add a new medication to your current medication list.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="med-name">Medication Name</Label>
                            <Input
                              id="med-name"
                              value={newMedication.name}
                              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                              placeholder="e.g., Aspirin"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="dosage">Dosage</Label>
                            <Input
                              id="dosage"
                              value={newMedication.dosage}
                              onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                              placeholder="e.g., 100mg"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select
                              value={newMedication.frequency}
                              onValueChange={(value) => setNewMedication({ ...newMedication, frequency: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Once daily">Once daily</SelectItem>
                                <SelectItem value="Twice daily">Twice daily</SelectItem>
                                <SelectItem value="Three times daily">Three times daily</SelectItem>
                                <SelectItem value="Four times daily">Four times daily</SelectItem>
                                <SelectItem value="As needed">As needed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Times to Take</Label>
                            {newMedication.timesTaken.map((time, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  type="time"
                                  value={time}
                                  onChange={(e) => updateTimeSlot(index, e.target.value)}
                                  className="flex-1"
                                />
                                {newMedication.timesTaken.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTimeSlot(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addTimeSlot}
                              className="gap-2 bg-transparent"
                            >
                              <Plus className="h-3 w-3" />
                              Add Time
                            </Button>
                          </div>
                          <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                              {[
                                "bg-blue-500",
                                "bg-green-500",
                                "bg-yellow-500",
                                "bg-red-500",
                                "bg-purple-500",
                                "bg-pink-500",
                              ].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`w-8 h-8 rounded-full ${color} ${
                                    newMedication.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                                  }`}
                                  onClick={() => setNewMedication({ ...newMedication, color })}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={addMedication}
                            disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                          >
                            Add Medication
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isEditMedicationOpen} onOpenChange={setIsEditMedicationOpen}>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Edit Medication</DialogTitle>
                          <DialogDescription>Update your medication details.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-med-name">Medication Name</Label>
                            <Input
                              id="edit-med-name"
                              value={newMedication.name}
                              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                              placeholder="e.g., Aspirin"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-dosage">Dosage</Label>
                            <Input
                              id="edit-dosage"
                              value={newMedication.dosage}
                              onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                              placeholder="e.g., 100mg"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-frequency">Frequency</Label>
                            <Select
                              value={newMedication.frequency}
                              onValueChange={(value) => setNewMedication({ ...newMedication, frequency: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Once daily">Once daily</SelectItem>
                                <SelectItem value="Twice daily">Twice daily</SelectItem>
                                <SelectItem value="Three times daily">Three times daily</SelectItem>
                                <SelectItem value="Four times daily">Four times daily</SelectItem>
                                <SelectItem value="As needed">As needed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Times to Take</Label>
                            {newMedication.timesTaken.map((time, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  type="time"
                                  value={time}
                                  onChange={(e) => updateTimeSlot(index, e.target.value)}
                                  className="flex-1"
                                />
                                {newMedication.timesTaken.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTimeSlot(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addTimeSlot}
                              className="gap-2 bg-transparent"
                            >
                              <Plus className="h-3 w-3" />
                              Add Time
                            </Button>
                          </div>
                          <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                              {[
                                "bg-blue-500",
                                "bg-green-500",
                                "bg-yellow-500",
                                "bg-red-500",
                                "bg-purple-500",
                                "bg-pink-500",
                              ].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`w-8 h-8 rounded-full ${color} ${
                                    newMedication.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                                  }`}
                                  onClick={() => setNewMedication({ ...newMedication, color })}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          {/* Added delete button with confirmation dialog */}
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              setMedicationToDelete(editingMedication?.id || null)
                              setDeleteConfirmOpen(true)
                            }}
                            className="gap-2 mr-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                          <Button
                            type="submit"
                            onClick={editMedication}
                            disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                          >
                            Update Medication
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Added delete confirmation dialog */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Medication</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this medication? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={deleteMedication}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="grid gap-6">
                    {healthData.medications.map((medication) => (
                      <Card key={medication.id} className="border shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-4 h-4 rounded-full ${medication.color}`}></div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-foreground">{medication.name}</h3>
                              <p className="text-muted-foreground">
                                {medication.dosage} • {medication.frequency}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {/* Replaced TrendingDown with Clock icon */}
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {medication.timesTaken.join(", ")}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {/* Added question mark icon for medication questions */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(
                                    `/?message=${encodeURIComponent(`I have a question about this medication: ${medication.name}`)}`,
                                  )
                                }}
                              >
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => openEditMedication(medication)}
                              >
                                <Plus className="h-4 w-4" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="health-history" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Health History</h2>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Activity className="h-3 w-3" />
                        {healthData.moodEntries.length} Mood Entries
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Moon className="h-3 w-3" />
                        {healthData.sleepEntries.length} Sleep Entries
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Heart className="h-3 w-3" />
                        {healthData.heartRateEntries?.length || 0} Heart Entries
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Health History */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Health History</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {[...healthData.moodEntries, ...healthData.sleepEntries, ...(healthData.heartRateEntries || [])]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .reduce((acc: any[], entry) => {
                            const date = entry.date
                            let dayGroup = acc.find((group) => group.date === date)

                            if (!dayGroup) {
                              dayGroup = { date, entries: [] }
                              acc.push(dayGroup)
                            }

                            dayGroup.entries.push(entry)
                            return acc
                          }, [])
                          .map((dayGroup) => (
                            <div key={dayGroup.date} className="border rounded-lg p-4 relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-muted"
                                onClick={() => {
                                  const dateStr = new Date(dayGroup.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                  const sleepData = dayGroup.entries.filter((entry: any) => "hoursSlept" in entry)
                                  const moodData = dayGroup.entries.filter((entry: any) => "mood" in entry)
                                  const heartData = dayGroup.entries.filter((entry: any) => "currentHR" in entry)

                                  let summary = `Please provide a health summary for ${dateStr}. `
                                  if (sleepData.length > 0) {
                                    summary += `Sleep: ${sleepData[0].hoursSlept} hours. `
                                  }
                                  if (moodData.length > 0) {
                                    summary += `Mood entries: ${moodData.length} (${moodData.map((m: any) => m.emoji).join(", ")}). `
                                    const allJournalEntries = moodData
                                      .flatMap((m: any) => m.journalEntries || [])
                                      .filter(Boolean)
                                    if (allJournalEntries.length > 0) {
                                      summary += `Journal entries: ${allJournalEntries.join("; ")}. `
                                    }
                                  }
                                  if (heartData.length > 0) {
                                    const heart = heartData[0]
                                    summary += `Heart rate: Resting ${heart.restingHR} bpm, HRV ${heart.hrv} ms, Calories burned ${heart.caloriesBurned}. `
                                  }

                                  router.push(`/?message=${encodeURIComponent(summary)}`)
                                }}
                              >
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                              <div className="font-medium text-sm text-gray-600 mb-3">
                                {new Date(dayGroup.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>

                              <div className="space-y-3">
                                {/* Sleep entries */}
                                {dayGroup.entries
                                  .filter((entry: any) => "hoursSlept" in entry)
                                  .map((sleepEntry: any) => (
                                    <div key={sleepEntry.id} className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Moon className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-blue-800">Sleep</div>
                                        <div className="text-sm text-gray-600">{sleepEntry.hoursSlept} hours slept</div>
                                      </div>
                                    </div>
                                  ))}

                                {dayGroup.entries
                                  .filter((entry: any) => "restingHR" in entry)
                                  .map((heartEntry: any) => (
                                    <div key={heartEntry.id} className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <Heart className="h-4 w-4 text-red-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-red-800">Heart Rate</div>
                                        <div className="text-sm text-gray-600">Resting: {heartEntry.restingHR} bpm</div>
                                        <div className="text-sm text-gray-600">
                                          HRV: {heartEntry.hrv} ms, Calories: {heartEntry.caloriesBurned} 🔥
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                {/* Mood entries grouped by emoji */}
                                {Object.entries(
                                  dayGroup.entries
                                    .filter((entry: any) => "mood" in entry)
                                    .reduce((acc: any, entry: any) => {
                                      if (!acc[entry.emoji]) {
                                        acc[entry.emoji] = []
                                      }
                                      acc[entry.emoji].push(entry)
                                      return acc
                                    }, {}),
                                ).map(([emoji, entries]: [string, any]) => (
                                  <div key={emoji} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-lg">{emoji}</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-yellow-800">
                                        Mood ({entries.length} {entries.length === 1 ? "entry" : "entries"})
                                      </div>
                                      <div className="text-sm text-muted-foreground space-y-1">
                                        {entries
                                          .flatMap((entry: any) => entry.journalEntries)
                                          .map((journal: string, index: number) => (
                                            <div key={index}>: {journal}</div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="chat-history" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Chat History</h2>
                    <Badge variant="secondary" className="gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {healthData.chatHistory.length} Sessions
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    {healthData.chatHistory.map((chat) => (
                      <Card key={chat.id} className="border shadow-sm">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MessageSquare className="h-5 w-5 text-primary" />
                              Chat Session
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {new Date(chat.date).toLocaleDateString()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{chat.summary}</p>
                          </div>

                          {chat.keyFindings.length > 0 && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Key Findings
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {chat.keyFindings.map((finding, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {finding}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {chat.recommendations.length > 0 && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Recommendations
                              </h4>
                              <ul className="space-y-1">
                                {chat.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {healthData.chatHistory.length === 0 && (
                      <Card className="border-dashed border-2">
                        <CardContent className="p-8 text-center">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-medium text-foreground mb-2">No Chat History Yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Start a conversation with HEAL to see your chat summaries here.
                          </p>
                          <Link href="/">
                            <Button className="gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Start Chatting
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      {/* Sleep Dialog */}
      <Dialog open={isSleepDialogOpen} onOpenChange={setIsSleepDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Sleep Hours</DialogTitle>
            <DialogDescription>Enter the number of hours you slept last night.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sleep-hours">Hours Slept</Label>
              <Input
                id="sleep-hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="e.g., 7.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={saveSleepEntry} disabled={!sleepHours || Number.parseFloat(sleepHours) <= 0}>
              Log Sleep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
