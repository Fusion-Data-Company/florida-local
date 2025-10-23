import { useState, useEffect, useRef, forwardRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, Business } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Search, 
  Paperclip, 
  Share2, 
  Building2, 
  Package, 
  Phone, 
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  Download,
  Image as ImageIcon,
  FileText,
  MoreVertical,
  Smile,
  Users,
  Globe,
  MessageSquare,
  Mail,
  Video
} from "lucide-react";

interface ConversationUser {
  id: string;
  name: string;
  avatar?: string;
  businessName?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface EnhancedMessage extends Message {
  user?: ConversationUser;
  business?: Business;
  product?: any;
}

const MessageNode = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 p-4 shadow-lg dark:border-gray-700 transition-all hover:scale-110",
        className,
      )}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      {children}
    </div>
  );
});

MessageNode.displayName = "MessageNode";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const previousConversationRef = useRef<string | null>(null);
  
  // Animated beam refs (must be declared before any conditional returns)
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const node1Ref = useRef<HTMLDivElement>(null);
  const node2Ref = useRef<HTMLDivElement>(null);
  const node3Ref = useRef<HTMLDivElement>(null);
  const node4Ref = useRef<HTMLDivElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const node6Ref = useRef<HTMLDivElement>(null);
  const node7Ref = useRef<HTMLDivElement>(null);
  
  const { socket, connected } = useWebSocket();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      if (selectedConversation === message.conversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
      }
      scrollToBottom();
    };

    const handleTypingStart = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, selectedConversation, selectedUserId]);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: ['/api/messages/conversations'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<EnhancedMessage[]>({
    queryKey: ['/api/messages', selectedUserId],
    enabled: !!selectedUserId,
  });

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
  });

  const { data: unreadCount = 0 } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string; messageType?: string }) => {
      return await apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      setMessageInput("");
      // Stop typing indicator
      if (socket && selectedConversation) {
        socket.emit('typing:stop', { conversationId: selectedConversation });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const shareBusinessMutation = useMutation({
    mutationFn: async (data: { receiverId: string; businessId: string }) => {
      return await apiRequest('POST', '/api/messages/share-business', data);
    },
    onSuccess: () => {
      setShowBusinessDialog(false);
      toast({
        title: "Business shared",
        description: "Business profile shared successfully.",
      });
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (data: { receiverId: string; fileUrl: string; fileName: string; fileType: string; fileSize: number }) => {
      return await apiRequest('POST', '/api/messages/upload', data);
    },
    onSuccess: () => {
      toast({
        title: "File shared",
        description: "File uploaded and shared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
      scrollToBottom();
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('PUT', `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
    },
  });

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedUserId || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageInput.trim(),
    });
  };

  const shareBusinessProfile = (businessId: string) => {
    if (!selectedUserId) return;
    
    shareBusinessMutation.mutate({
      receiverId: selectedUserId,
      businessId,
    });
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    // Send typing start
    socket.emit('typing:start', { conversationId: selectedConversation });

    // Clear existing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: selectedConversation });
    }, 1000);
  };

  const handleFileUpload = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a conversation first.",
        variant: "destructive",
      });
      return Promise.reject("No conversation selected");
    }

    const response = await fetch('/api/object-storage/generate-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadUrl,
    };
  };

  const handleFileUploadComplete = (result: any) => {
    if (!selectedUserId || !result.successful || result.successful.length === 0) return;
    
    const file = result.successful[0];
    const fileUrl = file.uploadURL.split('?')[0]; // Remove query params from URL
    
    fileUploadMutation.mutate({
      receiverId: selectedUserId,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  };

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (messages.length > 0 && selectedUserId) {
      const unreadMessages = messages.filter(
        msg => msg.receiverId === user?.id && !msg.isRead
      );
      
      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [messages, selectedUserId, user?.id]);

  const selectConversation = (conversation: any) => {
    const otherUserId = conversation.senderId === user?.id 
      ? conversation.receiverId 
      : conversation.senderId;
    
    const newConversationId = [user?.id, otherUserId].sort().join('-');
    
    // Leave previous conversation room if switching
    if (socket && previousConversationRef.current && previousConversationRef.current !== newConversationId) {
      socket.emit('leave:conversation', previousConversationRef.current);
    }
    
    setSelectedUserId(otherUserId);
    setSelectedConversation(newConversationId);
    
    // Join new conversation room via WebSocket
    if (socket) {
      socket.emit('join:conversation', newConversationId);
      previousConversationRef.current = newConversationId;
    }
  };

  const renderMessage = (message: EnhancedMessage) => {
    const isOwnMessage = message.senderId === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.user?.avatar} />
            <AvatarFallback className="text-xs bg-gradient-to-r from-orange-700 to-blue-700 text-white">
              {message.user?.name?.charAt(0) || 'B'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwnMessage
                ? 'bg-gradient-to-r from-orange-700 to-blue-700 text-white messages-bubble-sent'
                : 'bg-muted border border-border messages-bubble-received'
            }`}
          >
            {/* Message type specific rendering */}
            {message.messageType === 'business_share' && message.sharedBusinessId && (
              <div className="mb-2 p-3 bg-white/10 rounded-lg relative z-10">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium text-sm">Business Shared</span>
                </div>
                <p className="text-sm mt-1">{message.networkingContext?.businessName}</p>
                <p className="text-xs opacity-75">{message.networkingContext?.businessCategory}</p>
              </div>
            )}
            
            {message.messageType === 'file' && (
              <div className="mb-2 p-3 bg-white/10 rounded-lg relative z-10">
                <div className="flex items-center gap-2 relative z-10">
                  {message.fileType?.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">{message.fileName}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                    data-testid={`button-download-${message.id}`}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
                {message.fileType?.startsWith('image/') && message.fileUrl && (
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName || 'File attachment'}
                    className="max-w-full h-auto rounded mt-2"
                  />
                )}
              </div>
            )}
            
            <p className="text-sm relative z-10">{message.content}</p>
          </div>
          
          <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwnMessage ? 'justify-end' : ''}`}>
            <Clock className="h-3 w-3" />
            <span>
              {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : 'Now'}
            </span>
            {isOwnMessage && (
              <div className="ml-1">
                {message.isRead ? (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                ) : message.isDelivered ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getFloridaBusinessPrompts = () => [
    "Interested in collaborating on Florida tourism initiatives?",
    "Would you like to explore cross-promotional opportunities?",
    "Any insights on local Florida business regulations?",
    "Looking to network with fellow Florida entrepreneurs!",
    "Interested in joining our local business meetup group?",
  ];

  if (conversationsLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            <div className="lg:col-span-1 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-8 messages-container">
        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text-primary">Florida Business Network</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                Connect and collaborate with local businesses
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex">
                <Circle className={`h-2 w-2 mr-2 fill-current ${connected ? 'text-green-500' : 'text-red-500'}`} />
                {connected ? 'Connected' : 'Connecting...'}
              </Badge>
              {typeof unreadCount === 'object' && unreadCount.unreadCount > 0 && (
                <Badge variant="default" className="bg-orange-500">
                  {unreadCount.unreadCount} unread
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Animated Network Visualization */}
        <Card className="mb-8 miami-glass border-orange-200/50 dark:border-gray-700/50 overflow-hidden">
          <div
            className="relative flex h-[300px] w-full items-center justify-center p-8 bg-gradient-to-br from-orange-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-gray-900/50"
            ref={beamContainerRef}
          >
            {/* Scattered Network Nodes */}
            <div className="relative w-full h-full max-w-4xl">
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <MessageNode 
                  ref={centerNodeRef} 
                  className="size-20 sm:size-24 border-4 border-gradient-primary shadow-xl bg-gradient-to-br from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-orange-700 to-blue-700 flex items-center justify-center">
                    <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                </MessageNode>
              </div>

              {/* LEFT GROUP - 3 Nodes */}
              
              {/* Top Left - Users (orange) */}
              <div className="absolute top-[8%] left-[6%] sm:left-[8%]">
                <MessageNode ref={node1Ref} className="border-orange-500 dark:border-orange-600">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400" />
                </MessageNode>
              </div>

              {/* Middle Left - Building (teal) */}
              <div className="absolute top-[48%] left-[3%] sm:left-[5%]">
                <MessageNode ref={node7Ref} className="border-teal-500 dark:border-teal-600">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-teal-600 dark:text-teal-400" />
                </MessageNode>
              </div>

              {/* Bottom Left - Mail (purple) */}
              <div className="absolute bottom-[8%] left-[10%] sm:left-[13%]">
                <MessageNode ref={node4Ref} className="border-purple-500 dark:border-purple-600">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                </MessageNode>
              </div>

              {/* RIGHT GROUP - 3 Nodes */}
              
              {/* Top Right - MessageSquare (blue) */}
              <div className="absolute top-[10%] right-[8%] sm:right-[10%]">
                <MessageNode ref={node2Ref} className="border-blue-500 dark:border-blue-600">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                </MessageNode>
              </div>

              {/* Middle Right - Phone (green) */}
              <div className="absolute top-[46%] right-[3%] sm:right-[5%]">
                <MessageNode ref={node3Ref} className="border-green-500 dark:border-green-600">
                  <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                </MessageNode>
              </div>

              {/* Bottom Right - Video (pink) */}
              <div className="absolute bottom-[10%] right-[13%] sm:right-[16%]">
                <MessageNode ref={node6Ref} className="border-pink-500 dark:border-pink-600">
                  <Video className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600 dark:text-pink-400" />
                </MessageNode>
              </div>
            </div>

            {/* Animated Beams */}
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={node1Ref}
              toRef={centerNodeRef}
              curvature={-50}
              gradientStartColor="#f97316"
              gradientStopColor="#ea580c"
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={node2Ref}
              toRef={centerNodeRef}
              curvature={0}
              gradientStartColor="#3b82f6"
              gradientStopColor="#2563eb"
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={node3Ref}
              toRef={centerNodeRef}
              curvature={50}
              gradientStartColor="#10b981"
              gradientStopColor="#059669"
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={node4Ref}
              toRef={centerNodeRef}
              curvature={50}
              reverse
              gradientStartColor="#a855f7"
              gradientStopColor="#9333ea"
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={node6Ref}
              toRef={centerNodeRef}
              curvature={0}
              reverse
              gradientStartColor="#ec4899"
              gradientStopColor="#db2777"
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={node7Ref}
              toRef={centerNodeRef}
              curvature={-50}
              reverse
              gradientStartColor="#14b8a6"
              gradientStopColor="#0d9488"
            />
          </div>
          <CardContent className="py-4 text-center border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Real-time messaging network connecting Florida businesses
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)] relative z-10">
          {/* Conversations Sidebar */}
          <Card className="lg:col-span-1 miami-glass border-orange-200/50 messages-conversation-list">
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Conversations
                </CardTitle>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-conversations"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <ScrollArea className="h-96">
                {conversations.length > 0 ? (
                  conversations
                    .filter((conversation: any) => 
                      !searchQuery || 
                      conversation.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conversation.content?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conversation: any) => {
                      const otherUserId = conversation.senderId === user?.id 
                        ? conversation.receiverId 
                        : conversation.senderId;
                      const isSelected = selectedUserId === otherUserId;
                      
                      return (
                        <div
                          key={otherUserId}
                          className={`messages-conversation-item flex items-center space-x-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 ${
                            isSelected ? 'bg-muted border-l-4 border-l-orange-500' : ''
                          }`}
                          onClick={() => selectConversation(conversation)}
                          data-testid={`conversation-${otherUserId}`}
                        >
                          <div className="relative z-10">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={conversation.avatar} alt="User" />
                              <AvatarFallback className="bg-gradient-to-r from-orange-700 to-blue-700 text-white">
                                {conversation.businessName?.charAt(0) || 'B'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                              conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{conversation.businessName || 'Business User'}</p>
                              {!conversation.isRead && conversation.receiverId === user?.id && (
                                <div className="h-2 w-2 bg-orange-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {conversation.createdAt ? new Date(conversation.createdAt).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-12 messages-empty-state">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-700 to-blue-700 rounded-full flex items-center justify-center mb-4 relative z-10">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-muted-foreground font-medium relative z-10">No conversations yet</p>
                    <p className="text-sm text-muted-foreground relative z-10">
                      Start networking with Florida businesses
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 miami-glass border-blue-200/50 messages-chat-view">
            {selectedConversation && selectedUserId ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-border/50 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback className="bg-gradient-to-r from-orange-700 to-blue-700 text-white">
                          B
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">Business User</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Circle className={`h-2 w-2 fill-current ${true ? 'text-green-500' : 'text-gray-400'}`} />
                          <span>{true ? 'Online now' : 'Last seen recently'}</span>
                          {typingUsers.size > 0 && (
                            <span className="text-orange-500 italic">typing...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col relative z-10">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 h-96 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <Skeleton className="h-16 w-3/4 max-w-xs rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : messages.length > 0 ? (
                      <div className="space-y-2">
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-12 messages-empty-state">
                        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-700 to-blue-700 rounded-full flex items-center justify-center mb-4 relative z-10">
                          <Send className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-muted-foreground font-medium relative z-10">Start the conversation!</p>
                        <p className="text-sm text-muted-foreground mb-4 relative z-10">
                          Send your first message to begin networking
                        </p>
                        {/* Florida Business Ice Breakers */}
                        <div className="space-y-2 relative z-10">
                          <p className="text-xs text-orange-500 font-medium">Florida Business Ice Breakers:</p>
                          {getFloridaBusinessPrompts().slice(0, 3).map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => setMessageInput(prompt)}
                              className="block text-xs text-muted-foreground hover:text-orange-500 transition-colors cursor-pointer p-2 hover:bg-orange-50 rounded"
                            >
                              "{prompt}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  {/* Message Input Area */}
                  <div className="p-4 messages-compose-area">
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                      <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Share2 className="h-3 w-3 mr-1" />
                            Share Business
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-orange-500" />
                              Share a Florida Business
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {businesses.map((business) => (
                              <div
                                key={business.id}
                                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                                onClick={() => shareBusinessProfile(business.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={business.logoUrl || undefined} />
                                    <AvatarFallback className="bg-gradient-to-r from-orange-700 to-blue-700 text-white">
                                      {business.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{business.name}</p>
                                    <p className="text-sm text-muted-foreground">{business.category}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {business.location}
                                    </p>
                                  </div>
                                </div>
                                <Button size="sm" className="bg-gradient-to-r from-orange-700 to-blue-700">
                                  Share
                                </Button>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760} // 10MB
                        onGetUploadParameters={handleFileUpload}
                        onComplete={handleFileUploadComplete}
                        buttonClassName="text-xs h-8 px-3"
                      >
                        <Paperclip className="h-3 w-3 mr-1" />
                        File
                      </ObjectUploader>
                      
                      <Button size="sm" variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        Product
                      </Button>

                      <Button size="sm" variant="outline" className="text-xs">
                        <Smile className="h-3 w-3 mr-1" />
                        Emoji
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2 relative z-10">
                      <Input
                        placeholder="Type your message about Florida business opportunities..."
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={sendMessageMutation.isPending}
                        className="flex-1"
                        data-testid="input-message"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        className="bg-gradient-to-r from-orange-700 to-blue-700 hover:from-orange-600 hover:to-blue-600"
                        data-testid="button-send"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-2 relative z-10">
                      <Globe className="h-3 w-3 text-orange-500" />
                      Connect with fellow Florida entrepreneurs • Share resources • Grow together
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full messages-empty-state">
                <div className="text-center relative z-10">
                  <div className="mx-auto h-24 w-24 bg-gradient-to-r from-orange-700 to-blue-700 rounded-full flex items-center justify-center mb-6">
                    <Building2 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Florida Business Network</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a conversation to start networking with local businesses
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>Florida Local</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>Business Network</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>Community</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}