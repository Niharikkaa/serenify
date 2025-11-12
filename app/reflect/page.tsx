"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Save, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, startOfWeek, endOfWeek } from "date-fns"

interface ReflectionPrompt {
  id: number
  question: string
  category: string
  icon: string
}

const reflectionPrompts: ReflectionPrompt[] = [
  {
    id: 1,
    question: "What were the highlights of your week?",
    category: "Positivity",
    icon: "✨",
  },
  {
    id: 2,
    question: "What challenges did you face and how did you overcome them?",
    category: "Growth",
    icon: "🏔️",
  },
  {
    id: 3,
    question: "Which habit made the biggest impact on your wellbeing?",
    category: "Habits",
    icon: "🎯",
  },
  {
    id: 4,
    question: "How has your mood evolved this week?",
    category: "Emotions",
    icon: "📈",
  },
  {
    id: 5,
    question: "What self-care moments are you most grateful for?",
    category: "Gratitude",
    icon: "🙏",
  },
  {
    id: 6,
    question: "What's your intention for next week?",
    category: "Planning",
    icon: "🎪",
  },
]

interface PastReflection {
  id: string;
  prompt: string;
  response: string;
  category: string;
  week_start: string;
  created_at: string;
}

export default function ReflectPage() {
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null)
  const [responses, setResponses] = useState<{ [key: number]: string }>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pastReflections, setPastReflections] = useState<{[key: string]: PastReflection[]}>({})
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPastReflections = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group reflections by week
      const groupedReflections = (data || []).reduce((acc: {[key: string]: PastReflection[]}, reflection: PastReflection) => {
        const weekStart = format(startOfWeek(new Date(reflection.week_start)), 'yyyy-MM-dd')
        if (!acc[weekStart]) {
          acc[weekStart] = []
        }
        acc[weekStart].push(reflection)
        return acc
      }, {})

      setPastReflections(groupedReflections)
    } catch (err: any) {
      console.error('Error fetching reflections:', err.message)
    }
  }

  useEffect(() => {
    fetchPastReflections()
  }, [])

  const handleResponseChange = (id: number, value: string) => {
    setResponses((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!selectedPrompt || !responses[selectedPrompt]) {
      setError("Please write your reflection before saving")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error("Please login to save your reflection")

      const currentPrompt = reflectionPrompts.find(p => p.id === selectedPrompt)
      if (!currentPrompt) throw new Error("Invalid prompt")

      const weekStart = startOfWeek(new Date())
      
      const { error } = await supabase.from('reflections').insert({
        user_id: user.id,
        prompt: currentPrompt.question,
        response: responses[selectedPrompt],
        category: currentPrompt.category,
        week_start: weekStart.toISOString()
      })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      
      // Refresh past reflections
      fetchPastReflections()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentPromptId = selectedPrompt
  const currentPrompt = reflectionPrompts.find((p) => p.id === currentPromptId)

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Weekly Reflection</h1>
          <p className="text-foreground/70">Take time to reflect on your wellness journey</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Prompts List */}
          <div className="space-y-3">
            {reflectionPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setSelectedPrompt(prompt.id)}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedPrompt === prompt.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-card/50 border border-border/50 hover:bg-card/70 text-foreground"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl mt-1">{prompt.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{prompt.question}</p>
                      <span className="text-xs opacity-70">{prompt.category}</span>
                    </div>
                  </div>
                  {responses[prompt.id] && <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>}
                </div>
              </button>
            ))}
          </div>

          {/* Response Area */}
          <div className="lg:col-span-2">
            {currentPrompt ? (
              <Card className="bg-card/50 border-border/50 h-full">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{currentPrompt.icon}</span>
                    <div>
                      <span className="text-sm bg-accent/20 text-accent px-3 py-1 rounded-full">
                        {currentPrompt.category}
                      </span>
                      <CardTitle className="text-xl mt-3">{currentPrompt.question}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <textarea
                    value={responses[currentPrompt.id] || ""}
                    onChange={(e) => handleResponseChange(currentPrompt.id, e.target.value)}
                    placeholder="Share your thoughts, feelings, and insights..."
                    className="w-full p-4 bg-input border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    rows={12}
                  />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={loading || saved}
                      className={`flex-1 transition-all ${
                        saved ? "bg-green-600 hover:bg-green-600" : "bg-accent hover:bg-accent/90"
                      } text-accent-foreground`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Response Saved
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Response
                        </>
                      )}
                    </Button>
                    {error && (
                      <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                  </div>

                  {/* Writing Tips */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-2">Writing Tips:</p>
                    <ul className="text-xs text-foreground/70 space-y-1 list-disc list-inside">
                      <li>Be honest and authentic</li>
                      <li>There are no right or wrong answers</li>
                      <li>Take your time to process your thoughts</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border/50 flex items-center justify-center h-96">
                <CardContent className="text-center">
                  <p className="text-foreground/70 mb-4">Select a reflection prompt to get started</p>
                  <ChevronRight className="w-8 h-8 text-foreground/50 mx-auto animate-pulse" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Past Reflections */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Past Reflections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(pastReflections).map(([weekStart, reflections]) => {
              const startDate = new Date(weekStart)
              const endDate = endOfWeek(startDate)
              const now = new Date()
              const isThisWeek = startOfWeek(now).getTime() === startDate.getTime()
              const isLastWeek = startOfWeek(new Date(now.setDate(now.getDate() - 7))).getTime() === startDate.getTime()
              
              let weekLabel
              if (isThisWeek) {
                weekLabel = "This week"
              } else if (isLastWeek) {
                weekLabel = "Last week"
              } else {
                weekLabel = format(startDate, 'MMM d') + " - " + format(endDate, 'MMM d')
              }

              return (
                <button
                  key={weekStart}
                  onClick={() => setSelectedWeek(selectedWeek === weekStart ? null : weekStart)}
                  className="w-full"
                >
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                    <div>
                      <p className="text-foreground font-medium">{weekLabel}</p>
                      <p className="text-xs text-foreground/60">{format(startDate, 'MMMM d, yyyy')}</p>
                    </div>
                    <p className="text-sm bg-accent/20 text-accent px-3 py-1 rounded-full">
                      {reflections.length} responses
                    </p>
                  </div>
                  
                  {/* Expanded view of reflections */}
                  {selectedWeek === weekStart && (
                    <div className="mt-2 space-y-2 pl-4">
                      {reflections.map((reflection) => (
                        <div
                          key={reflection.id}
                          className="p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                              {reflection.category}
                            </span>
                            <span className="text-xs text-foreground/60">
                              {format(new Date(reflection.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-2">{reflection.prompt}</p>
                          <p className="text-sm text-foreground/70">{reflection.response}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
            {Object.keys(pastReflections).length === 0 && (
              <p className="text-center text-foreground/60 py-4">
                No reflections yet. Start your wellness journey by answering the prompts!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
