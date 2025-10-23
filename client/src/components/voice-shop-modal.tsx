import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VoiceCommerce from "@/components/voice-commerce";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoStart?: boolean;
}

export default function VoiceShopModal({ open, onOpenChange, autoStart = true }: VoiceShopModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.2)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20 border border-purple-400/30">
                <Mic className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Voice Shopping Assistant
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Shop hands-free with AI-powered voice commands
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <VoiceCommerce autoStart={open && autoStart} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
