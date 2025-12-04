"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistPreviewCard } from "@/components/playlist-preview-card";
import { getPusherClient } from "@/lib/pusher-client";

type Friend = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type ChatMessage = {
  _id: string;
  userId: string;
  username: string;
  userImage: string | null;
  message: string;
  createdAt: string;
  playlistPreview?: {
    playlistId: string;
    playlistName: string;
    playlistImage?: string;
    trackCount: number;
  };
};

type ChatPageClientProps = {
  events: never[];
  friends: Friend[];
  currentUserId: string;
};

export function ChatPageClient({ friends, currentUserId }: ChatPageClientProps) {
  // On mobile, start with no friend selected (show friends list first)
  // On desktop, auto-select first friend
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // Mobile: track if user has selected a friend (hide friends list after selection)
  const [showChatView, setShowChatView] = useState(false);

  // Auto-select first friend on desktop (lg breakpoint)
  useEffect(() => {
    if (friends.length > 0 && !selectedChatId && typeof window !== "undefined") {
      // Only auto-select on desktop (window width >= 1024px)
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        setSelectedChatId(friends[0].id);
      }
    }
  }, [friends, selectedChatId]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedFriend = friends.find((f) => f.id === selectedChatId) || null;

  // Handle friend selection on mobile
  const handleSelectFriend = (friendId: string) => {
    setSelectedChatId(friendId);
    setShowChatView(true); // Hide friends list on mobile after selection
  };

  // Handle back button on mobile
  const handleBackToFriends = () => {
    setShowChatView(false);
  };

  useEffect(() => {
    if (selectedChatId) {
      loadMessages();
      
      const pusher = getPusherClient();
      
      if (pusher) {
          // Private chat channel name logic: private-{sortedIds}
          // The backend triggers on `chat-{chatId}`. We need to construct chatId.
          const sortedIds = [currentUserId, selectedChatId].sort();
          const chatId = `private-${sortedIds[0]}-${sortedIds[1]}`;
        const channelName = `chat-${chatId}`;

        const channel = pusher.subscribe(channelName);
        
        channel.bind("new-message", (newMessage: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some((msg) => msg._id === newMessage._id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        });

        return () => {
          channel.unbind_all();
          channel.unsubscribe();
          pusher.disconnect();
        };
      }

      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChatId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!selectedChatId) return;
    
    try {
      const res = await fetch(`/api/chat/private/${selectedChatId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending || !selectedChatId) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/private/${selectedChatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim() }),
      });

      if (res.ok) {
        setMessageInput("");
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

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  if (friends.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6 bg-gradient-to-b from-background via-background to-secondary/10 p-6 lg:px-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Chat</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-dashed border-primary/30 p-10 text-center max-w-md">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No active chats</h2>
            <p className="text-sm text-muted-foreground">
              Add friends to start chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-background via-background to-secondary/10">
      {/* Chat List Sidebar - Hidden on mobile after friend selection */}
      <div className={`w-full sm:w-64 lg:w-80 border-r border-border bg-card/50 flex flex-col ${
        showChatView ? "hidden lg:flex" : "flex"
      }`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {friends.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-muted-foreground px-3 uppercase tracking-wider">
                  Friends
                </h3>
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      handleSelectFriend(friend.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                      selectedChatId === friend.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={friend.avatarUrl || undefined} />
                      <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {friend.displayName || friend.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        !showChatView && selectedChatId ? "hidden lg:flex" : "flex"
      }`}>
        {selectedChatId ? (
          <>
            <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToFriends}
                  className="lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="font-semibold text-lg">
                  {selectedFriend?.displayName || selectedFriend?.username}
                </h2>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex gap-3 ${
                        msg.userId === currentUserId ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={msg.userImage} />
                        <AvatarFallback>
                          {msg.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${
                          msg.userId === currentUserId ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground/80">
                            {msg.username}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageTime(new Date(msg.createdAt))}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {msg.message && (
                        <div
                          className={`px-4 py-2 rounded-2xl text-sm ${
                            msg.userId === currentUserId
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none"
                          }`}
                        >
                          {msg.message}
                            </div>
                          )}
                          {msg.playlistPreview && (
                            <div className={msg.userId === currentUserId ? "flex justify-end" : ""}>
                              <PlaylistPreviewCard
                                playlistId={msg.playlistPreview.playlistId}
                                playlistName={msg.playlistPreview.playlistName}
                                playlistImage={msg.playlistPreview.playlistImage}
                                trackCount={msg.playlistPreview.trackCount}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 sm:p-4 border-t border-border bg-card/50 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={500}
                  disabled={isSending}
                  className="flex-1 min-w-0"
                />
                <Button type="submit" disabled={!messageInput.trim() || isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

