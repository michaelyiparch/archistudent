"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/layout/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Send, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Message } from "@/types/database"

interface Conversation {
  profile: { id: string; full_name: string; avatar_url: string | null; role: string; university_or_firm: string | null }
  lastMessage: string
  lastTime: string
  unread: number
}

export default function MessagesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  if (authLoading) return null
  if (!profile) { router.replace("/auth/login"); return null }

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Get all messages involving this user
      const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", profile!.user_id).single()
      if (!myProfile) { setLoading(false); return }

      const myId = myProfile.id

      const { data: msgs } = await supabase
        .from("messages")
        .select(`*, sender:sender_id (id, full_name, avatar_url, role, university_or_firm), receiver:receiver_id (id, full_name, avatar_url, role, university_or_firm)`)
        .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
        .order("created_at", { ascending: false })
        .limit(200)

      if (msgs) {
        // Group by conversation partner
        const convMap = new Map<string, Conversation>()
        msgs.forEach((m: Record<string, unknown>) => {
          const isSender = (m.sender as { id: string }).id === myId
          const partner = (isSender ? m.receiver : m.sender) as Conversation["profile"]
          if (!convMap.has(partner.id)) {
            convMap.set(partner.id, {
              profile: partner,
              lastMessage: m.content as string,
              lastTime: m.created_at as string,
              unread: 0,
            })
          }
          if (!isSender && !(m.read as boolean)) {
            convMap.get(partner.id)!.unread++
          }
        })
        setConversations(Array.from(convMap.values()))
      }
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  useEffect(() => {
    if (!selectedId || !profile) return
    async function loadMessages() {
      const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", profile!.user_id).single()
      if (!myProfile) return

      const { data: msgs } = await supabase
        .from("messages")
        .select(`*, sender:sender_id (id, full_name, avatar_url, role), receiver:receiver_id (id, full_name, avatar_url, role)`)
        .or(`and(sender_id.eq.${myProfile.id},receiver_id.eq.${selectedId}),and(sender_id.eq.${selectedId},receiver_id.eq.${myProfile.id})`)
        .order("created_at", { ascending: true })

      if (msgs) setMessages(msgs as Message[])

      // Mark unread as read
      await supabase.from("messages").update({ read: true }).eq("receiver_id", myProfile.id).eq("sender_id", selectedId).eq("read", false)
    }
    loadMessages()
  }, [selectedId, profile, supabase])

  const handleSend = async () => {
    if (!reply.trim() || !selectedId || !profile) return
    setSending(true)

    const { data: myProfile } = await supabase.from("profiles").select("id").eq("user_id", profile.user_id).single()
    if (!myProfile) { setSending(false); return }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: myProfile.id,
        receiver_id: selectedId,
        content: reply.trim(),
      })
      .select(`*, sender:sender_id (id, full_name, avatar_url, role), receiver:receiver_id (id, full_name, avatar_url, role)`)
      .single()

    if (error) {
      toast.error("Failed to send")
    } else {
      setMessages((prev) => [...prev, data as Message])
      setReply("")
      // Update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.profile.id === selectedId
            ? { ...c, lastMessage: reply.trim(), lastTime: new Date().toISOString() }
            : c
        )
      )
    }
    setSending(false)
  }

  const selectedConv = conversations.find((c) => c.profile.id === selectedId)

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>

        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-xl">
            <Mail className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">No messages yet</p>
            <p className="text-sm text-zinc-400 mt-1">When someone contacts you, it&apos;ll appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversation list */}
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.profile.id}
                  onClick={() => setSelectedId(conv.profile.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                    selectedId === conv.profile.id ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-zinc-200 text-zinc-600 text-xs">
                        {conv.profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unread > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-zinc-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.profile.full_name}</p>
                    <p className="text-xs text-zinc-500 truncate">{conv.lastMessage?.slice(0, 40) || ""}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Chat view */}
            <div className="md:col-span-2">
              {!selectedId ? (
                <div className="text-center py-16 bg-zinc-50 rounded-xl">
                  <Mail className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500">Select a conversation</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border h-[500px] flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConv?.profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-zinc-200 text-zinc-600 text-xs">
                        {selectedConv?.profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedConv?.profile.full_name}</p>
                      <p className="text-xs text-zinc-500">{selectedConv?.profile.university_or_firm || selectedConv?.profile.role}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const fromThem = msg.sender_id === selectedId

                      return (
                        <div key={msg.id} className={`flex gap-2 ${fromThem ? "" : "justify-end"}`}>
                          {fromThem && (
                            <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                              <AvatarImage src={selectedConv?.profile.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px]">
                                {selectedConv?.profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                            fromThem ? "bg-zinc-100 text-zinc-800 rounded-tl-sm" : "bg-zinc-900 text-white rounded-tr-sm"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t flex gap-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-10 resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleSend} disabled={!reply.trim() || sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
