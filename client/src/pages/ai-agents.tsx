import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Brain, Sparkles } from "lucide-react";
import AIAgentsHub from "@/components/ai-agents-hub";

export default function AIAgentsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/business-dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">AI Agents Command Center</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AIAgentsHub />
      </div>
    </div>
  );
}