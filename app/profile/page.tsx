"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Save, X, Award, TrendingUp, Zap, LogOut } from "lucide-react"
import { useSupabaseClient } from "@/lib/supabase/use-supabase"

interface UserProfile {
  name: string
  email: string
  bio: string
  joinDate: string
  avatar: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile>({
    name: "Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    bio: "Wellness enthusiast on a journey to better mental health",
    joinDate: "January 2024",
    avatar: "SM",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)
        // Update profile with user data
        setProfile((prev) => ({
          ...prev,
          email: currentUser.email || prev.email,
          name: currentUser.user_metadata?.full_name || prev.name,
        }))
        setEditedProfile((prev) => ({
          ...prev,
          email: currentUser.email || prev.email,
          name: currentUser.user_metadata?.full_name || prev.name,
        }))
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleSave = () => {
    setProfile(editedProfile)
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground/70">Loading...</p>
        </div>
      </AppLayout>
    )
  }

  const achievements = [
    { icon: "🔥", title: "Streak Master", description: "12 day streak", unlocked: true },
    { icon: "🎯", title: "Habit Builder", description: "5 habits created", unlocked: true },
    { icon: "📚", title: "Reflection Pro", description: "10 reflections", unlocked: true },
    { icon: "⭐", title: "Consistency Star", description: "90% completion rate", unlocked: false },
    { icon: "🏆", title: "Wellness Champion", description: "30 day consistency", unlocked: false },
    { icon: "🚀", title: "Peak Performance", description: "9+ average mood", unlocked: false },
  ]

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Profile</h1>
            <p className="text-foreground/70">Manage your account and view achievements</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-8">
            {isEditing ? (
              <div className="space-y-6">
                {/* Avatar Editor */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                    {editedProfile.avatar}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="block text-sm font-medium text-foreground">Avatar Initials</label>
                    <Input
                      value={editedProfile.avatar}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, avatar: e.target.value.toUpperCase().slice(0, 2) })
                      }
                      maxLength={2}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>

                {/* Edit Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                    <Input
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      className="bg-input border-border text-foreground"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                    <textarea
                      value={editedProfile.bio}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      className="w-full p-3 bg-input border border-border rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-border/50 hover:bg-muted bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Display */}
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-3xl font-bold">
                    {profile.avatar}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-1">{profile.name}</h2>
                    <p className="text-foreground/70 text-sm mb-3">{profile.email}</p>
                    <p className="text-foreground">{profile.bio}</p>
                    <p className="text-xs text-foreground/60 mt-3">Joined {profile.joinDate}</p>
                  </div>
                </div>

                {saved && (
                  <div className="p-3 bg-green-600/20 text-green-400 rounded-lg text-sm">
                    Profile updated successfully!
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-foreground/70 text-sm font-medium">Achievements</p>
                <p className="text-3xl font-bold text-accent mt-2">3/6</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-foreground/70 text-sm font-medium">Total Days</p>
                <p className="text-3xl font-bold text-accent mt-2">87</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-foreground/70 text-sm font-medium">Wellness Score</p>
                <p className="text-3xl font-bold text-accent mt-2">8.2/10</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg text-center transition-all ${
                    achievement.unlocked
                      ? "bg-accent/20 border border-accent/50"
                      : "bg-muted/50 border border-border/50 opacity-50"
                  }`}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <h3 className="font-bold text-foreground text-sm">{achievement.title}</h3>
                  <p className="text-xs text-foreground/70 mt-1">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="mt-2 inline-block px-2 py-1 bg-accent text-accent-foreground rounded text-xs font-medium">
                      Unlocked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-foreground font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-foreground/60">Enhance your account security</p>
              </div>
              <Button variant="outline" size="sm" className="border-border/50 bg-transparent">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-foreground font-medium">Email Notifications</p>
                <p className="text-xs text-foreground/60">Receive wellness reminders and tips</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-foreground font-medium">Data Privacy</p>
                <p className="text-xs text-foreground/60">Manage your data preferences</p>
              </div>
              <Button variant="outline" size="sm" className="border-border/50 bg-transparent">
                Configure
              </Button>
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 w-full bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 w-full bg-transparent"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
