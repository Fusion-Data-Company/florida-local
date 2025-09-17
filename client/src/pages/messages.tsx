import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversations'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedConversation],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string }) => {
      return await apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      setMessageInput("");
      // Invalidate both conversations and messages queries
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedConversation] });
      toast({
        title: "Message sent",
        description: "Your message has been delivered successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: messageInput.trim(),
    });
  };

  if (conversationsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Connect with other businesses in your community</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {conversations.length > 0 ? (
                  conversations.map((conversation: Message) => {
                    const otherUser = conversation.senderId === user?.id 
                      ? { id: conversation.receiverId || 'unknown' } 
                      : { id: conversation.senderId || 'unknown' };
                    
                    return (
                      <div
                        key={otherUser.id}
                        className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-muted transition-colors ${
                          selectedConversation === otherUser.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(otherUser.id)}
                        data-testid={`conversation-${otherUser.id}`}
                      >
                        <Avatar>
                          <AvatarImage src="" alt="User" />
                          <AvatarFallback>
                            <i className="fas fa-user"></i>
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Business User</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.content}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversation.createdAt ? new Date(conversation.createdAt).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start connecting with businesses in the community
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback>
                        <i className="fas fa-user"></i>
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">Business User</CardTitle>
                      <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Messages */}
                  <ScrollArea className="h-80 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <Skeleton className="h-12 w-3/4 max-w-xs" />
                          </div>
                        ))}
                      </div>
                    ) : messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message: any) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user?.id
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground">
                          Start the conversation!
                        </p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                        data-testid="input-message"
                      />
                      <Button 
                        onClick={sendMessage} 
                        data-testid="button-send-message"
                        disabled={sendMessageMutation.isPending || !messageInput.trim()}
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-comment-dots text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the left to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
