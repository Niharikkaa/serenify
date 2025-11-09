"use client"

import { useMemo } from "react"
import { createClient } from "./client"

export function useSupabaseClient() {
  const supabase = useMemo(() => createClient(), [])
  return supabase
}
