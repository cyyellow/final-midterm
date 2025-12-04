"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedPost } from "@/components/feed-post";
import { Users } from "lucide-react";
import type { Post } from "@/types/post";

interface SocietyClientProps {
  initialPosts: Post[];
  userId: string;
}

export function SocietyClient({ initialPosts, userId }: SocietyClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"friends" | "everyone">("friends");
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts?filter=${activeTab}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab]);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-secondary/10 min-h-0 overflow-hidden">
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "friends" | "everyone")} className="w-full">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4 -mb-4">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2">
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="everyone">Everyone</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="friends" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4 max-w-2xl mx-auto w-full">
                {posts.map((post) => (
                  <FeedPost key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center bg-card/50">
                <div className="flex justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No posts yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  Connect with friends or share your own music moments to see them here!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="everyone" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4 max-w-2xl mx-auto w-full">
                {posts.map((post) => (
                  <FeedPost key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center bg-card/50">
                <div className="flex justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No public posts yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  Be the first to share a public music moment!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

