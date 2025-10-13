import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Send,
  X,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  DollarSign,
  Users,
  BarChart3,
  MessageSquare,
  Minimize2,
  Maximize2,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionable?: boolean;
  category?: 'insight' | 'warning' | 'opportunity' | 'tip';
}

interface BusinessContext {
  currentPage: string;
  businessId?: string;
  businessName?: string;
  metrics?: {
    revenue?: number;
    customers?: number;
    rating?: number;
    recentOrders?: number;
  };
  competitorAlert?: string;
  opportunityAlert?: string;
}

export default function AIBusinessCoachWidget() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get business context
  const { data: businessData } = useQuery({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
    staleTime: 300000, // 5 minutes
  });

  // Get business metrics
  const { data: metrics } = useQuery({
    queryKey: ['/api/ai/business-metrics', businessData?.[0]?.id],
    enabled: !!businessData?.[0]?.id,
    refetchInterval: 60000, // Update every minute
  });

  // Initialize with proactive suggestion based on current page
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getContextualWelcome();
      setMessages([welcomeMessage]);
    }
  }, [isOpen, location]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      setIsTyping(true);

      // Build context for AI
      const context: BusinessContext = {
        currentPage: location,
        businessId: businessData?.[0]?.id,
        businessName: businessData?.[0]?.name,
        metrics: metrics,
      };

      try {
        const response = await apiRequest('POST', '/api/ai/coach/chat', {
          message,
          context,
          history: messages.slice(-5), // Last 5 messages for context
        });
        return response;
      } catch (error) {
        // Fallback to OpenAI direct if coach endpoint doesn't exist
        const response = await apiRequest('POST', '/api/ai/generate', {
          prompt: `You are an AI business coach helping a Florida local business owner.
                   Context: They are on ${location} page. Business: ${context.businessName || 'Unknown'}.
                   User message: ${message}

                   Provide actionable, specific advice. Be conversational but professional.`,
          maxTokens: 150,
        });
        return { content: response.content || generateFallbackResponse(message, context) };
      }
    },
    onSuccess: (response) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        category: response.category || 'tip',
        actionable: response.actionable,
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);

      // Speak response if voice is enabled
      if (isSpeaking && response.content) {
        speakText(response.content);
      }
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Coach unavailable",
        description: "I'm having trouble connecting. Please try again.",
        variant: "destructive",
      });
    },
  });

  function getContextualWelcome(): ChatMessage {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    let content = `${greeting}! I'm your AI Business Coach. `;
    let category: ChatMessage['category'] = 'tip';
    let suggestions: string[] = [];

    // Context-aware suggestions based on current page
    if (location === '/business-dashboard') {
      content += "I see you're checking your dashboard. ";
      if (metrics?.revenue && metrics.revenue < 1000) {
        content += "I notice your revenue could use a boost. Want some tips to increase sales?";
        category = 'opportunity';
        suggestions = [
          "Show me revenue growth strategies",
          "Help me optimize pricing",
          "Suggest marketing campaigns"
        ];
      } else {
        content += "Your business is doing well! Let me help you scale further.";
        suggestions = [
          "Analyze my performance",
          "Find growth opportunities",
          "Compare with competitors"
        ];
      }
    } else if (location === '/marketing') {
      content += "Ready to supercharge your marketing? I can help you create campaigns that convert!";
      suggestions = [
        "Create an email campaign",
        "Optimize for holidays",
        "Analyze campaign performance"
      ];
    } else if (location.includes('/business/')) {
      content += "Looking at business profiles? I can help you understand what makes them successful.";
      suggestions = [
        "Analyze this business",
        "Compare with my business",
        "Learn their strategies"
      ];
    } else {
      content += "I'm here to help grow your business. What would you like to work on today?";
      suggestions = [
        "Review my business performance",
        "Get marketing tips",
        "Find new opportunities",
        "Optimize operations"
      ];
    }

    return {
      id: '0',
      role: 'assistant',
      content,
      timestamp: new Date(),
      suggestions,
      category,
      actionable: true,
    };
  }

  function generateFallbackResponse(message: string, context: BusinessContext): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
      return "To increase revenue, focus on: 1) Optimizing your product listings with better photos and descriptions, 2) Running targeted promotions during peak hours, 3) Encouraging reviews from satisfied customers. Would you like specific strategies for any of these?";
    } else if (lowerMessage.includes('marketing')) {
      return "For effective marketing: 1) Post consistently on social media (3-4 times/week), 2) Use local SEO keywords in your content, 3) Partner with other local businesses for cross-promotion. What aspect of marketing would you like to focus on?";
    } else if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
      return "To improve customer relationships: 1) Respond to all reviews within 24 hours, 2) Create a loyalty program to reward repeat customers, 3) Send personalized thank you messages. Which area would help your business most?";
    } else if (lowerMessage.includes('competitor')) {
      return "For competitive advantage: 1) Identify your unique value proposition, 2) Monitor competitor pricing weekly, 3) Offer services they don't. Let's analyze your main competitors together.";
    } else {
      return "I understand you're looking for guidance. Based on your business profile, I recommend focusing on customer engagement and local marketing. Would you like specific action items for either area?";
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
      // Stop recognition
    } else {
      setIsListening(true);
      // Start recognition
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.start();
    }
  };

  const getCategoryIcon = (category?: ChatMessage['category']) => {
    switch (category) {
      case 'insight': return <BarChart3 className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category?: ChatMessage['category']) => {
    switch (category) {
      case 'insight': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'opportunity': return 'text-green-600 bg-green-100';
      default: return 'text-purple-600 bg-purple-100';
    }
  };

  // Don't show widget if not authenticated or on certain pages
  if (!isAuthenticated || location === '/login' || location === '/register') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full h-16 w-16 shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Brain className="h-8 w-8" />
            </Button>

            {/* Pulse animation for attention */}
            <span className="absolute top-0 right-0 h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500"></span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className={cn(
              "fixed z-50 shadow-2xl",
              isMinimized ? "bottom-6 right-6 w-80" : "bottom-6 right-6 w-96 h-[600px]"
            )}
          >
            <Card className="h-full flex flex-col border-2 border-purple-200 dark:border-purple-800">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI Business Coach</CardTitle>
                      <p className="text-xs text-white/80">Powered by GPT-4 & Claude</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.role === 'user' && "flex-row-reverse"
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            {message.role === 'assistant' ? (
                              <>
                                <AvatarImage src="/ai-coach-avatar.png" />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                                  <Brain className="h-4 w-4 text-white" />
                                </AvatarFallback>
                              </>
                            ) : (
                              <>
                                <AvatarImage src={user?.profileImageUrl} />
                                <AvatarFallback>
                                  {user?.firstName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>

                          <div className={cn(
                            "flex-1 space-y-2",
                            message.role === 'user' && "items-end flex flex-col"
                          )}>
                            <div className={cn(
                              "rounded-lg p-3 max-w-[85%]",
                              message.role === 'assistant'
                                ? "bg-gray-100 dark:bg-gray-800"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            )}>
                              {message.category && message.role === 'assistant' && (
                                <Badge className={cn("mb-2", getCategoryColor(message.category))}>
                                  {getCategoryIcon(message.category)}
                                  <span className="ml-1 capitalize">{message.category}</span>
                                </Badge>
                              )}
                              <p className="text-sm">{message.content}</p>
                            </div>

                            {/* Suggestions */}
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {message.suggestions.map((suggestion, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="text-xs"
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                              <Brain className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <CardContent className="p-4 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleListening}
                        className={cn(
                          "h-10 w-10 p-0",
                          isListening && "bg-red-100 text-red-600 border-red-300"
                        )}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSpeaking(!isSpeaking)}
                        className={cn(
                          "h-10 w-10 p-0",
                          isSpeaking && "bg-purple-100 text-purple-600 border-purple-300"
                        )}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>

                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask me anything about your business..."
                        className="flex-1"
                        disabled={isTyping || isListening}
                      />

                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-2">
                      AI suggestions • Voice enabled • Always learning
                    </p>
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}