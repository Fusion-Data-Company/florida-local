import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import VoiceOrbInput from "@/components/voice-orb-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShoppingCart,
  Package,
  Search,
  Info,
  Settings,
  Play,
  Pause,
  SkipForward,
  ShoppingBag,
  HelpCircle,
  Star,
  DollarSign,
  Zap,
  Brain,
  Headphones,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Globe,
  Phone
} from "lucide-react";

interface VoiceAssistantState {
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  conversation: ConversationEntry[];
  context: ShoppingContext;
  voice: ElevenLabsVoice;
}

interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: VoiceAction;
}

interface VoiceAction {
  type: 'search' | 'add_to_cart' | 'checkout' | 'product_info' | 'help';
  data?: any;
}

interface ShoppingContext {
  cart: CartItem[];
  currentProduct?: Product;
  searchResults?: Product[];
  totalPrice: number;
  stage: 'browsing' | 'searching' | 'reviewing' | 'checkout';
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  inStock: boolean;
  businessName: string;
}

interface ElevenLabsVoice {
  id: string;
  name: string;
  accent: string;
  gender: string;
  useCase: string;
}

const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'rachel', name: 'Rachel', accent: 'American', gender: 'Female', useCase: 'Shopping Assistant' },
  { id: 'drew', name: 'Drew', accent: 'American', gender: 'Male', useCase: 'Product Expert' },
  { id: 'clyde', name: 'Clyde', accent: 'British', gender: 'Male', useCase: 'Luxury Concierge' },
  { id: 'bella', name: 'Bella', accent: 'American', gender: 'Female', useCase: 'Friendly Helper' },
  { id: 'antoni', name: 'Antoni', accent: 'American', gender: 'Male', useCase: 'Tech Specialist' }
];

const VOICE_COMMANDS = [
  { command: "Search for [product]", description: "Find products by name or category" },
  { command: "Add to cart", description: "Add the current product to your cart" },
  { command: "What's in my cart?", description: "Review cart contents" },
  { command: "Checkout", description: "Proceed to checkout" },
  { command: "Tell me more", description: "Get product details" },
  { command: "Compare prices", description: "Compare similar products" },
  { command: "Find deals", description: "Show current promotions" },
  { command: "Help", description: "Get assistance" }
];

interface VoiceCommerceProps {
  autoStart?: boolean;
}

export default function VoiceCommerce({ autoStart = false }: VoiceCommerceProps) {
  const { toast } = useToast();
  const [state, setState] = useState<VoiceAssistantState>({
    isListening: false,
    isSpeaking: false,
    currentTranscript: '',
    conversation: [],
    context: {
      cart: [],
      totalPrice: 0,
      stage: 'browsing'
    },
    voice: ELEVENLABS_VOICES[0]
  });

  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    autoListen: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          handleVoiceCommand(finalTranscript);
        } else {
          setState(prev => ({ ...prev, currentTranscript: interimTranscript }));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-start listening when autoStart prop is true
  useEffect(() => {
    if (autoStart && recognitionRef.current && !state.isListening) {
      // Small delay to ensure recognition is initialized
      const timer = setTimeout(() => {
        toggleListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // ElevenLabs TTS mutation
  const speakMutation = useMutation({
    mutationFn: async (text: string) => {
      // Call ElevenLabs API
      return await apiRequest('POST', '/api/elevenlabs/speak', {
        text,
        voice: state.voice.id,
        modelId: 'eleven_multilingual_v2'
      });
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: () => {
      // Fallback to browser TTS
      speakWithBrowserTTS(state.conversation[state.conversation.length - 1]?.content || '');
    }
  });

  // Process voice command
  const processCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      return await apiRequest('POST', '/api/ai/voice-commerce/process', {
        command,
        context: state.context
      });
    },
    onSuccess: (data) => {
      const response = data.response || generateLocalResponse(data.action);

      setState(prev => ({
        ...prev,
        conversation: [
          ...prev.conversation,
          {
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            action: data.action
          }
        ],
        context: data.context || prev.context
      }));

      // Speak the response
      speakResponse(response);

      // Execute action if any
      if (data.action) {
        executeAction(data.action);
      }
    }
  });

  // Handle voice command
  const handleVoiceCommand = (transcript: string) => {
    setState(prev => ({
      ...prev,
      currentTranscript: '',
      conversation: [
        ...prev.conversation,
        {
          role: 'user',
          content: transcript,
          timestamp: new Date()
        }
      ]
    }));

    processCommandMutation.mutate(transcript);
  };

  // Generate local response (fallback)
  const generateLocalResponse = (action?: VoiceAction): string => {
    if (!action) {
      return "I'm here to help you shop. You can ask me to search for products, add items to your cart, or help you checkout.";
    }

    switch (action.type) {
      case 'search':
        return `I found ${action.data?.results || 'several'} products matching your search. Would you like to hear about them?`;
      case 'add_to_cart':
        return `I've added ${action.data?.productName || 'the item'} to your cart. Your cart now has ${state.context.cart.length + 1} items.`;
      case 'checkout':
        return `Your cart has ${state.context.cart.length} items totaling $${state.context.totalPrice.toFixed(2)}. Would you like to proceed to checkout?`;
      case 'product_info':
        return `${action.data?.productName || 'This product'} costs $${action.data?.price || '0'} and has a ${action.data?.rating || '0'} star rating.`;
      default:
        return "How can I help you with your shopping today?";
    }
  };

  // Execute action
  const executeAction = (action: VoiceAction) => {
    switch (action.type) {
      case 'add_to_cart':
        if (action.data?.product) {
          const newItem: CartItem = {
            productId: action.data.product.id,
            productName: action.data.product.name,
            price: action.data.product.price,
            quantity: 1
          };

          setState(prev => ({
            ...prev,
            context: {
              ...prev.context,
              cart: [...prev.context.cart, newItem],
              totalPrice: prev.context.totalPrice + newItem.price
            }
          }));

          toast({
            title: "Added to Cart",
            description: `${newItem.productName} has been added to your cart`,
          });
        }
        break;

      case 'checkout':
        toast({
          title: "Proceeding to Checkout",
          description: "Redirecting to checkout page...",
        });
        // Navigate to checkout
        setTimeout(() => {
          window.location.href = '/checkout';
        }, 2000);
        break;
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (state.isListening) {
      recognitionRef.current?.stop();
      setState(prev => ({ ...prev, isListening: false }));
    } else {
      recognitionRef.current?.start();
      setState(prev => ({ ...prev, isListening: true }));

      // Welcome message
      if (state.conversation.length === 0) {
        const welcome = "Hello! I'm your voice shopping assistant. How can I help you today?";
        setState(prev => ({
          ...prev,
          conversation: [{
            role: 'assistant',
            content: welcome,
            timestamp: new Date()
          }]
        }));
        speakResponse(welcome);
      }
    }
  };

  // Speak response
  const speakResponse = (text: string) => {
    if (process.env.ELEVENLABS_API_KEY) {
      speakMutation.mutate(text);
    } else {
      speakWithBrowserTTS(text);
    }
  };

  // Browser TTS fallback
  const speakWithBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.speed;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));

        if (voiceSettings.autoListen) {
          setTimeout(() => {
            if (!state.isListening) {
              toggleListening();
            }
          }, 500);
        }
      };

      speechSynthesis.speak(utterance);
      synthRef.current = utterance;
    }
  };

  // Play audio from URL
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Voice Commerce Assistant
          </h2>
          <p className="text-muted-foreground">Shop hands-free with AI voice assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Badge variant="secondary">
            {state.voice.name} Voice
          </Badge>
          <Headphones className="w-5 h-5 text-blue-600" />
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
      </div>

      {/* Main Voice Interface */}
      <Card className={`bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 ${state.isListening ? "border-cyan-400/80 shadow-[0_0_50px_rgba(0,255,255,0.4)]" : "border-slate-700/50 hover:border-cyan-400/80"} transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group`}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
        <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
        <CardHeader className="relative z-10">
          <CardTitle>Voice Shopping</CardTitle>
          <CardDescription>
            Press the microphone to start shopping with voice commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          {/* Voice Orb Input */}
          <VoiceOrbInput
            isListening={state.isListening}
            isSpeaking={state.isSpeaking}
            transcript={state.conversation.length > 0 ? state.conversation[state.conversation.length - 1]?.content : undefined}
            interimTranscript={state.currentTranscript}
            onToggleListening={toggleListening}
            statusText="Click to start voice shopping"
            size="lg"
            hue={200}
            showControls={true}
          />

          {/* Conversation History */}
          {state.conversation.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-base">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {state.conversation.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: entry.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          entry.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 border'
                        }`}>
                          <div className="flex items-start gap-2">
                            {entry.role === 'assistant' && (
                              <Brain className="w-4 h-4 mt-0.5 text-purple-600" />
                            )}
                            <div>
                              <p className="text-sm">{entry.content}</p>
                              {entry.action && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {entry.action.type.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Shopping Cart Summary */}
          {state.context.cart.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-green-400/30 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Shopping Cart
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-2">
                  {state.context.cart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{item.productName}</span>
                      <span className="font-medium">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span className="text-green-600">
                        ${state.context.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Commands Help */}
          <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
            <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Voice Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {VOICE_COMMANDS.map((cmd, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{cmd.command}</p>
                      <p className="text-xs text-muted-foreground">{cmd.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Voice Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
            <DialogDescription>
              Customize your voice shopping experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Voice Selection */}
            <div>
              <Label>Assistant Voice</Label>
              <Select
                value={state.voice.id}
                onValueChange={(id) => {
                  const voice = ELEVENLABS_VOICES.find(v => v.id === id);
                  if (voice) {
                    setState(prev => ({ ...prev, voice }));
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ELEVENLABS_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{voice.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {voice.accent}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {voice.gender}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speed Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Speaking Speed</Label>
                <span className="text-sm text-muted-foreground">{voiceSettings.speed}x</span>
              </div>
              <Slider
                value={[voiceSettings.speed]}
                onValueChange={([v]) => setVoiceSettings(prev => ({ ...prev, speed: v }))}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>

            {/* Volume Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(voiceSettings.volume * 100)}%
                </span>
              </div>
              <Slider
                value={[voiceSettings.volume]}
                onValueChange={([v]) => setVoiceSettings(prev => ({ ...prev, volume: v }))}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            {/* Auto-Listen */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-listen">Auto-listen after response</Label>
              <Switch
                id="auto-listen"
                checked={voiceSettings.autoListen}
                onCheckedChange={(checked) =>
                  setVoiceSettings(prev => ({ ...prev, autoListen: checked }))
                }
              />
            </div>

            {/* Test Voice Button */}
            <Button
              onClick={() => speakResponse("Hello! This is how I sound with your current settings.")}
              className="w-full"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Test Voice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden audio element for ElevenLabs playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}