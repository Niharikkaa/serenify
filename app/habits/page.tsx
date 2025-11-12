"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Flame, Plus, Trash2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Habit {
  id: string
  name: string
  category: string
  streak: number
  user_id: string
  icon: string
  created_at: string
  frequency: string
}

interface HabitWithCompletion extends Habit {
  completed: boolean
  last_completed?: string
}

interface HabitForm {
  name: string;
  category: string;
  icon: string;
  frequency: string;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [hasStreakColumn, setHasStreakColumn] = useState<boolean>(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newHabitForm, setNewHabitForm] = useState<HabitForm>({
    name: "",
    category: "Other",
    icon: "⭐",
    frequency: "Daily",
  })
  
  const supabase = createClient()
  const router = useRouter()
  // const [newHabitCategory, setNewHabitCategory] = useState("Other")
  // const [newHabitIcon, setNewHabitIcon] = useState("⭐")
  
  useEffect(() => {
    // If there's an error, show it for 3 seconds
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const categoryOptions = [
    "Health",
    "Mindfulness",
    "Learning",
    "Fitness",
    "Productivity",
    "Reflection",
    "Other"
  ]

  const iconOptions = ["⭐", "🎯", "💪", "🧘", "📚", "💧", "🏃", "📝", "🎨", "🌱", "🧠", "❤️"]

  const defaultHabits = [
    {
      name: "Morning Meditation",
      category: "Mindfulness",
      icon: "🧘",
      frequency: "Daily",
    },
    { 
      name: "Exercise",
      category: "Health",
      icon: "🏃",
      frequency: "Daily",
    },
    { 
      name: "Journaling",
      category: "Reflection",
      icon: "📝",
      frequency: "Daily",
    },
    { 
      name: "Read",
      category: "Learning",
      icon: "📚",
      frequency: "Daily",
    },
    { 
      name: "Hydrate",
      category: "Health",
      icon: "💧",
      frequency: "Daily",
    },
  ]

  const ensureDefaultHabits = async (userId: string) => {
    try {
      // Check if default habits exist
      const { data: existingHabits, error: checkError } = await supabase
        .from('habits')
        .select('name')
        .eq('user_id', userId)
      
      if (checkError) throw checkError

      // Get names of existing habits
      const existingHabitNames = existingHabits?.map((h: { name: string }) => h.name) || []

      // Filter out default habits that don't exist yet
      const habitsToAdd = defaultHabits.filter(h => !existingHabitNames.includes(h.name))

      if (habitsToAdd.length > 0) {
        // Prepare habits with all required fields
        const habitsWithRequiredFields = habitsToAdd.map(habit => {
          // Only include safe columns that are likely present in the DB.
          // Omit UI-only fields (frequency, icon, is_custom, streak, created_at) to avoid schema errors.
          return {
            name: habit.name,
            category: habit.category,
            user_id: userId
          }
        })

        // Add the missing default habits
        const { error: insertError } = await supabase
          .from('habits')
          .insert(habitsWithRequiredFields)

        if (insertError) {
          console.error('Error inserting default habits:', insertError)
          throw insertError
        }
      }
    } catch (err: any) {
      setError(`Error ensuring default habits: ${err.message || err}`)
      console.error('Error ensuring default habits:', err)
    }
  }

  const fetchHabits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure default habits exist
      await ensureDefaultHabits(user.id)

      // Get all habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (habitsError) throw habitsError

      // Get today's completions
      const today = new Date().toISOString().split('T')[0]
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', user.id)
        .eq('completed_date', today)

      if (completionsError) throw completionsError

      // Combine habits with completion status
      const habitsWithCompletions = habits.map((habit: Habit) => ({
        ...habit,
        completed: completions?.some((c: { habit_id: string }) => c.habit_id === habit.id) || false
      }))

      // Detect whether the returned habit rows include a `streak` column
      const detectedHasStreak = habitsWithCompletions.length > 0 && Object.prototype.hasOwnProperty.call(habitsWithCompletions[0], 'streak')
      setHasStreakColumn(Boolean(detectedHasStreak))

      setHabits(habitsWithCompletions)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  const calculateNewStreak = async (habitId: string, completed: boolean) => {
    try {
      const habit = habits.find(h => h.id === habitId)
      if (!habit) return 0
      // If the habit object doesn't have a numeric streak, treat it as 0
      const baseStreak = typeof habit.streak === 'number' ? habit.streak : 0
      const { data: recentCompletions, error } = await supabase
        .from('habit_completions')
        .select('completed_date')
        .eq('habit_id', habitId)
        .order('completed_date', { ascending: false })
        .limit(30)

      if (error) throw error

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const hasYesterdayCompletion = recentCompletions?.some(
        (c: { completed_date: string }) => c.completed_date === yesterday.toISOString().split('T')[0]
      )

      if (completed) {
        return hasYesterdayCompletion ? baseStreak + 1 : 1
      } else {
        return 0
      }
    } catch (err) {
      console.error('Error calculating streak:', err)
      return 0
    }
  }

  const toggleHabit = async (id: string) => {
    try {
      setSaving(id)
      const habit = habits.find(h => h.id === id)
      if (!habit) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const today = new Date().toISOString().split('T')[0]

      if (!habit.completed) {
        // Add completion
        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: id,
            user_id: user.id,
            completed_date: today
          })

        if (completionError) throw completionError

        // Update streak
        const newStreak = await calculateNewStreak(id, true)
        if (hasStreakColumn) {
          const { error: updateError } = await supabase
            .from('habits')
            .update({ streak: newStreak })
            .eq('id', id)

          if (updateError) throw updateError
        } else {
          // If DB does not have `streak` column, skip updating it.
          console.debug('[habits] toggleHabit: skipping streak update; column missing')
        }
      } else {
        // Remove completion
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', id)
          .eq('completed_date', today)

        if (deleteError) throw deleteError

        // Reset streak
        if (hasStreakColumn) {
          const { error: updateError } = await supabase
            .from('habits')
            .update({ streak: 0 })
            .eq('id', id)

          if (updateError) throw updateError
        } else {
          console.debug('[habits] toggleHabit: skipping streak reset; column missing')
        }
      }

      // Refresh habits
      await fetchHabits()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const deleteHabit = async (id: string) => {
    try {
      setSaving(id)
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchHabits()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const [newHabitCategory, setNewHabitCategory] = useState("Other")
  const [newHabitIcon, setNewHabitIcon] = useState("⭐")

  const addHabit = async () => {
    console.log('[habits] addHabit: started', newHabitForm)
    if (!newHabitForm.name.trim()) {
      console.log('[habits] addHabit: no name provided')
      return
    }

    try {
  setSaving('new')
      const { data: { user } } = await supabase.auth.getUser()
  console.log('[habits] addHabit: got user', user)
      if (!user) throw new Error('Not authenticated')

      // Check if habit already exists using maybeSingle (no error if no row)
      const { data: existingHabit, error: checkError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', newHabitForm.name)
        .maybeSingle()

      if (checkError) {
        console.error('[habits] addHabit: checkError', checkError)
        throw checkError
      }

      if (existingHabit) {
        console.log('[habits] addHabit: already exists', existingHabit)
        setError('A habit with this name already exists')
        return
      }

      // Build insert payload without UI-only fields that DB may not have
      // Build a minimal insert payload that matches the DB schema (avoid sending UI-only fields).
      const insertPayload: any = {
        name: newHabitForm.name,
        category: newHabitForm.category,
        user_id: user.id
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('habits')
        .insert(insertPayload)

      console.log('[habits] addHabit: insert response', { insertedData, insertError })

      if (insertError) {
        // Log more details to help debugging (stringify in case properties are not enumerable)
        console.error('[habits] addHabit: insert error', insertError, JSON.stringify(insertError))
        setError(insertError.message || JSON.stringify(insertError))
        return
      }

      console.log('[habits] addHabit: insert succeeded', insertedData)
      // Reset form and close modal (close before fetching to ensure UI updates)
      setNewHabitForm({
        name: "",
        category: "Other",
        icon: "⭐",
        frequency: "Daily"
      })
      setShowAddModal(false)
      // fetch updated habits but don't block the UI
      fetchHabits().catch(err => console.error('[habits] fetchHabits after insert failed', err))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const completedCount = habits.filter((h: HabitWithCompletion) => h.completed).length;
  const totalStreak = habits.reduce((sum: number, h: HabitWithCompletion) => sum + (h.streak ?? 0), 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Habits</h1>
            <p className="text-foreground/70">Build consistency, one day at a time</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Habit
          </Button>
        </div>

        {/* Add Habit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border/50 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Custom Habit</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Habit Name</label>
                  <input
                    type="text"
                    value={newHabitForm.name}
                    onChange={(e) => setNewHabitForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 bg-input border border-border rounded-lg"
                    placeholder="Enter habit name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={newHabitForm.category}
                    onChange={(e) => setNewHabitForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 bg-input border border-border rounded-lg"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Choose Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewHabitForm(prev => ({ ...prev, icon }))}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all ${
                          newHabitForm.icon === icon ? "bg-accent text-accent-foreground" : "bg-muted"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addHabit}
                  disabled={saving === 'new' || !newHabitForm.name.trim()}
                >
                  {saving === 'new' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Habit'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-foreground/70 text-sm font-medium">Today's Progress</p>
                <p className="text-3xl font-bold text-accent mt-2">
                  {completedCount}/{habits.length}
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${(completedCount / habits.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-foreground/70 text-sm font-medium">Active Habits</p>
                <p className="text-3xl font-bold text-accent mt-2">{habits.length}</p>
                <p className="text-xs text-foreground/60 mt-2">Keep it manageable</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-foreground/70 text-sm font-medium">Total Streak Days</p>
                <p className="text-3xl font-bold text-accent mt-2">{totalStreak}</p>
                <p className="text-xs text-foreground/60 mt-2">Amazing consistency</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map((habit) => (
            <Card key={habit.id} className="bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`transition-colors ${habit.completed ? "text-accent" : "text-foreground/50"}`}
                    >
                      {habit.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{habit.icon ?? "⭐"}</span>
                        <h3
                          className={`font-medium ${habit.completed ? "line-through text-foreground/60" : "text-foreground"}`}
                        >
                          {habit.name}
                        </h3>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-foreground/60">
                        <span className="bg-muted px-2 py-1 rounded">{habit.category}</span>
                        <span className="bg-muted px-2 py-1 rounded">{habit.frequency ?? 'Daily'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="font-medium text-sm">{habit.streak}</span>
                      </div>
                    )}
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-foreground/50 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* (Duplicate modal removed) */}
      </div>
    </AppLayout>
  )
}
