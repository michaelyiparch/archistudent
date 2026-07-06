"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

export interface NotificationCounts {
  unreadMessages: number
  pendingRequests: number
  total: number
}

export function useNotifications(): NotificationCounts {
  const { profile, loading: authLoading } = useAuth()
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingRequests: 0,
    total: 0,
  })

  const fetchCounts = useCallback(async () => {
    if (!profile?.id) return

    const supabase = createClient()

    // Fetch unread messages count
    const { count: msgCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", profile.id)
      .eq("read", false)

    // Fetch pending incoming review requests (for professionals: someone requested them)
    const { count: reqCount } = await supabase
      .from("review_requests")
      .select("*", { count: "exact", head: true })
      .eq("architect_id", profile.id)
      .eq("status", "pending")

    setCounts({
      unreadMessages: msgCount || 0,
      pendingRequests: reqCount || 0,
      total: (msgCount || 0) + (reqCount || 0),
    })
  }, [profile?.id])

  useEffect(() => {
    if (authLoading || !profile?.id) return

    // Initial fetch
    fetchCounts()

    // Subscribe to real-time changes on messages
    const supabase = createClient()
    const msgChannel = supabase
      .channel("notif-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${profile.id}`,
        },
        () => fetchCounts()
      )
      .subscribe()

    // Subscribe to review request changes
    const reqChannel = supabase
      .channel("notif-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review_requests",
          filter: `architect_id=eq.${profile.id}`,
        },
        () => fetchCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(reqChannel)
    }
  }, [authLoading, profile?.id, fetchCounts])

  return counts
}
