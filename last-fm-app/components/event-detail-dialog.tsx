"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, MapPin, Users, MessageSquare, Send, Loader2, UserPlus, UserMinus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Event, ChatMessage } from "@/types/event";
import { getPusherClient } from "@/lib/pusher-client";

type EventDetailDialogProps = {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  currentUserId,
}: EventDetailDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const eventDate = new Date(event.eventDate);
  const endDate = new Date(event.endDate);
  const now = new Date();
  const isEnded = endDate <= now;
  const isActive = eventDate <= now && endDate > now;

  useEffect(() => {
    if (open && event.requiresChat && event.chatRoomId && isParticipant) {
      // Initial load
      loadMessages();

      // Use Pusher for real-time updates if available
      const pusher = getPusherClient();
      
      if (pusher) {
        const channel = pusher.subscribe(`event-${event._id}`);
        
        channel.bind("new-message", (newMessage: ChatMessage) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg._id === newMessage._id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        });

        // Fallback polling in case Pusher fails (every 5 seconds)
        const fallbackInterval = setInterval(loadMessages, 5000);

        return () => {
          channel.unbind_all();
          channel.unsubscribe();
          pusher.disconnect();
          clearInterval(fallbackInterval);
        };
      }

      // Fallback to polling if Pusher is not configured
      const interval = setInterval(loadMessages, 1500);
      return () => clearInterval(interval);
    } else if (open && event.requiresChat && event.chatRoomId) {
      // Slower polling for non-participants (just viewing)
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [open, event.requiresChat, event.chatRoomId, event._id, isParticipant]);

  useEffect(() => {
    if (currentUserId) {
      const participant = event.participants.some((p) => p.userId === currentUserId);
      setIsParticipant(participant || event.creatorId === currentUserId);
    }
  }, [currentUserId, event.participants, event.creatorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/events/${event._id}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/events/${event._id}/join`, {
        method: "POST",
      });

      if (res.ok) {
        setIsParticipant(true);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to join event");
      }
    } catch (error) {
      alert("Failed to join event");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this event?")) return;

    setIsLeaving(true);
    try {
      const res = await fetch(`/api/events/${event._id}/leave`, {
        method: "POST",
      });

      if (res.ok) {
        setIsParticipant(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to leave event");
      }
    } catch (error) {
      alert("Failed to leave event");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/events/${event._id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim() }),
      });

      if (res.ok) {
        setMessageInput("");
        // Immediately reload messages after sending for instant feedback
        loadMessages();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const canJoin = !isEnded && !isParticipant && currentUserId && currentUserId !== event.creatorId;
  const canChat = event.requiresChat && isParticipant && !isEnded;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
          <DialogDescription>
            {event.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Event Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(eventDate)} - {formatDate(endDate)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {event.participants.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : ""} participants
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isEnded ? "secondary" : isActive ? "default" : "outline"}>
                {isEnded ? "Ended" : isActive ? "Active" : "Upcoming"}
              </Badge>
              {event.requiresChat && (
                <Badge variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat Room
                </Badge>
              )}
            </div>
          </div>

          {/* Participants */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Participants</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={event.creatorImage} />
                  <AvatarFallback>
                    {event.creatorUsername[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.creatorUsername}</p>
                  <p className="text-xs text-muted-foreground">Creator</p>
                </div>
              </div>
              {event.participants.map((participant) => (
                <div key={participant.userId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.userImage} />
                    <AvatarFallback>
                      {participant.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Join/Leave Button */}
          {currentUserId && (
            <div>
              {canJoin && (
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Event
                    </>
                  )}
                </Button>
              )}

              {isParticipant && currentUserId !== event.creatorId && !isEnded && (
                <Button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  variant="outline"
                  className="w-full"
                >
                  {isLeaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Leaving...
                    </>
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Leave Event
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Chat Room */}
          {event.requiresChat && (
            <>
              <Separator />
              <div className="flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold mb-2">Chat Room</h3>
                {isEnded ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p>This event has ended. Chat messages have been deleted.</p>
                  </div>
                ) : !isParticipant ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p>Join the event to participate in the chat</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 border rounded-lg p-4" ref={scrollAreaRef}>
                      <div className="space-y-3">
                        {messages.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No messages yet. Start the conversation!
                          </p>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg._id}
                              className={`flex gap-2 ${msg.userId === currentUserId ? "flex-row-reverse" : ""}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.userImage} />
                                <AvatarFallback>
                                  {msg.username[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`flex-1 ${msg.userId === currentUserId ? "text-right" : ""}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">{msg.username}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(new Date(msg.createdAt))}
                                  </span>
                                </div>
                                <div
                                  className={`inline-block rounded-lg px-3 py-2 text-sm ${
                                    msg.userId === currentUserId
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  {msg.message}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        maxLength={500}
                        disabled={isSending}
                      />
                      <Button type="submit" disabled={!messageInput.trim() || isSending}>
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

