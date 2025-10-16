import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import VoiceOrbInput from "@/components/voice-orb-input";
import {
  Mic,
  MicOff,
  Search,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Store,
  Package,
  MapPin,
  Star,
  Clock,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceSearchResult {
  query: string;
  transcript: string;
  confidence: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
    businessName: string;
    rating: number;
  }>;
  businesses: Array<{
    id: string;
    name: string;
    category: string;
    rating: number;
    distance?: string;
  }>;
  suggestedActions: Array<{
    type: 'search' | 'navigate' | 'filter';
    label: string;
    action: string;
  }>;
}

interface VoiceCommand {
  command: string;
  confidence: number;
  intent: 'search' | 'navigate' | 'filter' | 'action';
  parameters?: Record<string, any>;
}

export default function VoiceSearch() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [searchResults, setSearchResults] = useState<VoiceSearchResult | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([]);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Whisper API transcription
  const whisperMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const res = await fetch('/api/ai/voice/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
    onSuccess: (data: { text: string; confidence: number }) => {
      const { text, confidence } = data;
      setTranscript(text);

      // Process the command
      processVoiceCommand(text, confidence);
    },
    onError: (error) => {
      console.error('Whisper API error:', error);
      // Fallback to browser speech recognition
      startBrowserSpeechRecognition();
    }
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest('POST', '/api/search/voice', { query });
      return await res.json();
    },
    onSuccess: (data: VoiceSearchResult) => {
      setSearchResults(data);

      // Speak the results if voice is enabled
      if (voiceEnabled && data.products.length > 0) {
        speakResults(data);
      }
    },
    onError: (error) => {
      // Use mock data for demo
      const mockResults: VoiceSearchResult = {
        query: transcript,
        transcript: transcript,
        confidence: 0.95,
        products: [
          {
            id: "1",
            name: "Florida Orange Juice - Fresh Squeezed",
            price: 12.99,
            businessName: "Sunshine Citrus Co.",
            rating: 4.8
          },
          {
            id: "2",
            name: "Key West Sunset Tour",
            price: 89.99,
            businessName: "Island Adventures",
            rating: 4.9
          },
          {
            id: "3",
            name: "Miami Beach Umbrella",
            price: 34.99,
            businessName: "Beach Essentials Store",
            rating: 4.5
          }
        ],
        businesses: [
          {
            id: "b1",
            name: "Sunshine Citrus Co.",
            category: "Food & Beverage",
            rating: 4.8,
            distance: "2.3 mi"
          },
          {
            id: "b2",
            name: "Island Adventures",
            category: "Tours & Activities",
            rating: 4.9,
            distance: "5.1 mi"
          }
        ],
        suggestedActions: [
          { type: 'search', label: 'Search similar products', action: 'search:similar' },
          { type: 'filter', label: 'Filter by price', action: 'filter:price' },
          { type: 'navigate', label: 'View all results', action: 'navigate:results' }
        ]
      };

      setSearchResults(mockResults);
      if (voiceEnabled) {
        speakResults(mockResults);
      }
    }
  });

  // Initialize audio context for visualization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Browser speech recognition fallback
  const startBrowserSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice search is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your search query",
      });
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setTranscript(final);
        setInterimTranscript('');
        processVoiceCommand(final, event.results[0][0].confidence);
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        toast({
          title: "No Speech Detected",
          description: "Please try again and speak clearly",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Process voice command
  const processVoiceCommand = (text: string, confidence: number) => {
    const command: VoiceCommand = {
      command: text,
      confidence,
      intent: detectIntent(text),
      parameters: extractParameters(text)
    };

    setRecentCommands(prev => [command, ...prev.slice(0, 4)]);

    // Execute based on intent
    switch (command.intent) {
      case 'search':
        searchMutation.mutate(text);
        break;
      case 'navigate':
        handleNavigation(command.parameters?.destination);
        break;
      case 'filter':
        handleFilter(command.parameters);
        break;
      case 'action':
        handleAction(command.parameters?.action);
        break;
    }
  };

  // Detect intent from speech
  const detectIntent = (text: string): VoiceCommand['intent'] => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('go to') || lowerText.includes('open') || lowerText.includes('show me')) {
      return 'navigate';
    } else if (lowerText.includes('filter') || lowerText.includes('sort') || lowerText.includes('under $')) {
      return 'filter';
    } else if (lowerText.includes('add to cart') || lowerText.includes('buy') || lowerText.includes('checkout')) {
      return 'action';
    }

    return 'search';
  };

  // Extract parameters from speech
  const extractParameters = (text: string): Record<string, any> => {
    const params: Record<string, any> = {};
    const lowerText = text.toLowerCase();

    // Extract price
    const priceMatch = lowerText.match(/under \$?(\d+)|less than \$?(\d+)|below \$?(\d+)/);
    if (priceMatch) {
      params.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    }

    // Extract location
    const locationMatch = lowerText.match(/in (\w+)|near (\w+)|around (\w+)/);
    if (locationMatch) {
      params.location = locationMatch[1] || locationMatch[2] || locationMatch[3];
    }

    // Extract category
    const categories = ['restaurant', 'shop', 'store', 'service', 'tour', 'activity'];
    categories.forEach(cat => {
      if (lowerText.includes(cat)) {
        params.category = cat;
      }
    });

    return params;
  };

  // Handle navigation commands
  const handleNavigation = (destination?: string) => {
    if (!destination) return;

    const routes: Record<string, string> = {
      'home': '/',
      'marketplace': '/marketplace',
      'cart': '/cart',
      'profile': '/profile',
      'dashboard': '/business-dashboard',
      'ai agents': '/ai/agents'
    };

    const route = routes[destination.toLowerCase()];
    if (route) {
      window.location.href = route;
    }
  };

  // Handle filter commands
  const handleFilter = (params?: Record<string, any>) => {
    if (!params) return;

    toast({
      title: "Applying Filters",
      description: `Filtering by: ${Object.entries(params).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
    });
  };

  // Handle action commands
  const handleAction = (action?: string) => {
    if (!action) return;

    toast({
      title: "Executing Action",
      description: `Performing: ${action}`,
    });
  };

  // Speak results using TTS
  const speakResults = (results: VoiceSearchResult) => {
    if (!('speechSynthesis' in window)) return;

    const message = `Found ${results.products.length} products and ${results.businesses.length} businesses.
      Top result is ${results.products[0]?.name} from ${results.products[0]?.businessName} for $${results.products[0]?.price}.`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Start listening
  const startListening = () => {
    // Try to use media recorder for Whisper API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            whisperMutation.mutate(blob);
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsListening(true);

          // Stop after 10 seconds max
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              setIsListening(false);
            }
          }, 10000);

          // Setup audio visualization
          setupAudioVisualization(stream);
        })
        .catch(err => {
          console.error('Microphone access denied:', err);
          // Fallback to browser speech recognition
          startBrowserSpeechRecognition();
        });
    } else {
      // Fallback to browser speech recognition
      startBrowserSpeechRecognition();
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Setup audio visualization
  const setupAudioVisualization = (stream: MediaStream) => {
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255 * 100);

      if (isListening) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  };

  // Reset search
  const resetSearch = () => {
    setTranscript('');
    setInterimTranscript('');
    setSearchResults(null);
    setRecentCommands([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Voice Search
          </h2>
          <p className="text-muted-foreground">Search hands-free with voice commands</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
      </div>

      {/* Voice Input Card */}
      <Card className={`bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 transition-all duration-500 cyber-3d-lift relative overflow-hidden group ${isListening ? "border-cyan-400/70 shadow-[0_0_50px_rgba(0,255,255,0.3)]" : "border-slate-700/50 hover:border-cyan-400/80 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)]"}`}>
        {/* Metallic shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
        
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
        
        {/* Scan line */}
        <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-white">Voice Command</CardTitle>
          <CardDescription>
            Click the microphone and speak your search query or command
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          {/* Voice Orb Input */}
          <VoiceOrbInput
            isListening={isListening}
            transcript={transcript}
            interimTranscript={interimTranscript}
            onToggleListening={toggleListening}
            statusText="Press to start voice search"
            size="lg"
            hue={160}
            showControls={true}
          />

          {/* Recent Commands */}
          {recentCommands.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recent Commands:</p>
              <div className="space-y-2">
                {recentCommands.map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <Badge variant={cmd.intent === 'search' ? 'default' : 'secondary'}>
                        {cmd.intent}
                      </Badge>
                      <span className="text-sm">{cmd.command}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(cmd.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Commands Help */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-cyan-400/80 transition-all duration-300">
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Try saying:</p>
                <p className="text-sm">"Find restaurants near me"</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-purple-400/80 transition-all duration-300">
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Or:</p>
                <p className="text-sm">"Show beach products under $50"</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Products */}
            {searchResults.products.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
                {/* Metallic shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Products Found</CardTitle>
                    <Badge>{searchResults.products.length} results</Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    {searchResults.products.map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`}>
                        <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-cyan-400/80 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    by {product.businessName}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">${product.price}</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs">{product.rating}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Businesses */}
            {searchResults.businesses.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
                {/* Metallic shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Businesses</CardTitle>
                    <Badge variant="secondary">{searchResults.businesses.length} results</Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    {searchResults.businesses.map((business) => (
                      <Link key={business.id} href={`/business/${business.id}`}>
                        <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-cyan-400/80 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Store className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{business.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {business.category}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                {business.distance && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {business.distance}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  {business.rating}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested Actions */}
            {searchResults.suggestedActions.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
                {/* Metallic shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-white">Suggested Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.suggestedActions.map((action, i) => (
                      <Button key={i} variant="outline" size="sm">
                        {action.type === 'search' && <Search className="w-3 h-3 mr-1" />}
                        {action.type === 'filter' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {action.type === 'navigate' && <ChevronRight className="w-3 h-3 mr-1" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetSearch}>
                <RotateCcw className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}