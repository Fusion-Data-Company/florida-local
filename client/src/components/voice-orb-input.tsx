import React, { useState } from "react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOrbInputProps {
  isListening: boolean;
  isSpeaking?: boolean;
  transcript?: string;
  interimTranscript?: string;
  onToggleListening: () => void;
  statusText?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showControls?: boolean;
  hue?: number;
}

export default function VoiceOrbInput({
  isListening,
  isSpeaking = false,
  transcript,
  interimTranscript,
  onToggleListening,
  statusText,
  className,
  size = "md",
  showControls = true,
  hue = 180,
}: VoiceOrbInputProps) {
  const [voiceDetected, setVoiceDetected] = useState(false);

  // Size configurations
  const sizes = {
    sm: { orb: "w-32 h-32", button: "h-8 w-8", text: "text-sm" },
    md: { orb: "w-48 h-48", button: "h-10 w-10", text: "text-base" },
    lg: { orb: "w-64 h-64", button: "h-12 w-12", text: "text-lg" },
  };

  const sizeConfig = sizes[size];

  // Determine status
  const getStatus = () => {
    if (isListening && voiceDetected) return "active";
    if (isListening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  };

  const status = getStatus();

  // Status-based styling
  const getStatusStyle = () => {
    switch (status) {
      case "active":
        return "border-cyan-400/80 shadow-[0_0_60px_rgba(0,255,255,0.5)] bg-cyan-500/5";
      case "listening":
        return "border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.3)] bg-blue-500/5";
      case "speaking":
        return "border-purple-400/60 shadow-[0_0_40px_rgba(168,85,247,0.3)] bg-purple-500/5";
      default:
        return "border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]";
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-6", className)}>
      {/* Main Orb Container */}
      <Card
        className={cn(
          "relative bg-gradient-to-br from-slate-900/95 to-slate-800/90 border-2 backdrop-blur-xl transition-all duration-500 cyber-3d-lift overflow-hidden group",
          getStatusStyle()
        )}
      >
        {/* Glass morphism effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
        <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />

        {/* Hairline highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,.12)]" />

        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col items-center space-y-6">
            {/* Voice Orb */}
            <div className="relative">
              {/* Glow rings when active */}
              <AnimatePresence>
                {status === "active" && (
                  <>
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={cn(
                        "absolute inset-0 rounded-full border-4 border-cyan-400",
                        sizeConfig.orb
                      )}
                    />
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className={cn(
                        "absolute inset-0 rounded-full border-4 border-purple-400",
                        sizeConfig.orb
                      )}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Orb with glass container */}
              <div
                className={cn(
                  "relative rounded-2xl overflow-hidden border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm",
                  sizeConfig.orb
                )}
              >
                <VoicePoweredOrb
                  enableVoiceControl={isListening}
                  hue={hue}
                  voiceSensitivity={1.8}
                  maxRotationSpeed={1.5}
                  maxHoverIntensity={1.0}
                  onVoiceDetected={setVoiceDetected}
                  className="w-full h-full"
                />
              </div>

              {/* Center control button overlay */}
              {showControls && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onToggleListening}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full backdrop-blur-md bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 shadow-lg transition-all duration-300",
                      sizeConfig.button,
                      isListening && "bg-cyan-500/20 border-cyan-400/50 hover:bg-cyan-500/30"
                    )}
                  >
                    {isListening ? (
                      <MicOff className={cn("text-white", size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6")} />
                    ) : (
                      <Mic className={cn("text-white", size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6")} />
                    )}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Status Display */}
            <div className="text-center space-y-2">
              {isListening ? (
                <div className="flex items-center gap-2 justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {voiceDetected ? (
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Mic className="w-5 h-5 text-blue-400 animate-pulse" />
                    )}
                  </motion.div>
                  <p className={cn("font-medium", sizeConfig.text, voiceDetected ? "text-cyan-400" : "text-blue-400")}>
                    {voiceDetected ? "Voice Detected" : "Listening..."}
                  </p>
                </div>
              ) : isSpeaking ? (
                <div className="flex items-center gap-2 justify-center">
                  <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
                  <p className={cn("font-medium text-purple-400", sizeConfig.text)}>
                    Speaking...
                  </p>
                </div>
              ) : (
                <p className={cn("text-muted-foreground", sizeConfig.text)}>
                  {statusText || "Press to start voice input"}
                </p>
              )}

              {/* Live Transcript Preview */}
              {interimTranscript && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-400 italic max-w-md"
                >
                  "{interimTranscript}"
                </motion.p>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge
                variant="secondary"
                className={cn(
                  "backdrop-blur-sm transition-all duration-300",
                  status === "active" && "bg-cyan-500/20 text-cyan-300 border-cyan-400/50",
                  status === "listening" && "bg-blue-500/20 text-blue-300 border-blue-400/50",
                  status === "speaking" && "bg-purple-500/20 text-purple-300 border-purple-400/50",
                  status === "idle" && "bg-white/5 text-gray-400 border-white/10"
                )}
              >
                {status === "active" && "🎤 Active"}
                {status === "listening" && "👂 Listening"}
                {status === "speaking" && "🔊 Speaking"}
                {status === "idle" && "⏸️ Ready"}
              </Badge>

              {isListening && (
                <Badge variant="outline" className="backdrop-blur-sm bg-white/5 border-white/20 text-white animate-pulse">
                  Recording
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 border border-white/10 backdrop-blur-xl">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Transcript:</p>
                  <p className="text-sm text-white break-words">{transcript}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
