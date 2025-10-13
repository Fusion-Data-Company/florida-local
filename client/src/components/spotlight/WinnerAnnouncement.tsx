import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Business } from "@shared/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown,
  Trophy,
  Star,
  Sparkles,
  PartyPopper,
  Heart,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Link } from "wouter";
import Confetti from "react-confetti";

interface SpotlightWinner extends Business {
  voteCount: number;
  winnerMonth: string;
  votingPeriod: {
    start: Date;
    end: Date;
  };
  stats: {
    totalVoters: number;
    votePercentage: number;
    runnerUpVotes: number;
  };
}

interface WinnerAnnouncementProps {
  winnerId?: string;
  autoShow?: boolean;
  onClose?: () => void;
}

export default function WinnerAnnouncement({
  winnerId,
  autoShow = false,
  onClose
}: WinnerAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(autoShow);
  const [showConfetti, setShowConfetti] = useState(false);

  const { data: winner, isLoading } = useQuery<SpotlightWinner>({
    queryKey: ['/api/spotlight/winner', winnerId || 'current'],
    enabled: !!isVisible,
  });

  useEffect(() => {
    if (winner && autoShow) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [winner, autoShow]);

  const handleClose = () => {
    setIsVisible(false);
    setShowConfetti(false);
    onClose?.();
  };

  if (!isVisible || isLoading || !winner) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              gravity={0.3}
            />
          )}

          {/* Modal Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-4 border-yellow-400 shadow-2xl overflow-hidden relative">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 animate-gradient" />
                <div className="absolute inset-0 opacity-20">
                  {[...Array(50)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>

                <CardContent className="relative z-10 p-8 text-white">
                  {/* Trophy Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl animate-pulse" />
                      <Crown className="h-24 w-24 text-yellow-300 relative" />
                    </div>
                  </motion.div>

                  {/* Announcement Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center mb-6"
                  >
                    <h2 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                      <PartyPopper className="h-8 w-8" />
                      SPOTLIGHT WINNER
                      <PartyPopper className="h-8 w-8" />
                    </h2>
                    <p className="text-lg opacity-90">
                      {format(new Date(winner.winnerMonth), 'MMMM yyyy')}
                    </p>
                  </motion.div>

                  {/* Winner Business Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center gap-4 mb-6">
                        {/* Business Logo */}
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-xl">
                            <AvatarImage src={winner.logoUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl font-bold">
                              {winner.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg">
                            <Trophy className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        {/* Business Info */}
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {winner.name}
                          </h3>
                          <p className="text-gray-600 mb-2">{winner.category}</p>
                          {winner.tagline && (
                            <p className="text-sm text-gray-500 italic line-clamp-2">
                              "{winner.tagline}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                          <Heart className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                          <div className="text-2xl font-bold text-purple-900">
                            {winner.voteCount.toLocaleString()}
                          </div>
                          <div className="text-xs text-purple-700 font-semibold">Votes</div>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                          <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold text-blue-900">
                            {winner.stats.totalVoters.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700 font-semibold">Voters</div>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold text-green-900">
                            {winner.stats.votePercentage}%
                          </div>
                          <div className="text-xs text-green-700 font-semibold">Share</div>
                        </div>
                      </div>

                      {/* Rating */}
                      {winner.rating && (
                        <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-lg font-bold text-yellow-900">{winner.rating}</span>
                          <span className="text-sm text-yellow-700">
                            ({winner.reviewCount} reviews)
                          </span>
                        </div>
                      )}

                      {/* Winning Margin */}
                      <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-orange-900 font-semibold">Winning Margin:</span>
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                            {winner.voteCount - winner.stats.runnerUpVotes} votes
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Link href={`/business/${winner.id}`} className="flex-1">
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            size="lg"
                          >
                            <Sparkles className="h-5 w-5 mr-2" />
                            Visit Business
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleClose}
                          className="border-2"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Voting Period */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-6 text-sm opacity-90"
                  >
                    <p>
                      Voting Period: {format(new Date(winner.votingPeriod.start), 'MMM d')} -{' '}
                      {format(new Date(winner.votingPeriod.end), 'MMM d, yyyy')}
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Compact banner version for displaying past winners
export function WinnerBanner({ winner }: { winner: SpotlightWinner }) {
  return (
    <Link href={`/business/${winner.id}`}>
      <Card className="border-2 border-yellow-400 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
        <div className="relative">
          {/* Golden Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-10 group-hover:opacity-20 transition-opacity" />

          <CardContent className="p-4 relative">
            <div className="flex items-center gap-4">
              {/* Trophy Badge */}
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md animate-pulse" />
                <div className="relative p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Business Logo */}
              <Avatar className="h-16 w-16 border-3 border-yellow-400 shadow-lg">
                <AvatarImage src={winner.logoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                  {winner.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    Winner
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(winner.winnerMonth), 'MMMM yyyy')}
                  </span>
                </div>
                <h4 className="font-bold text-lg group-hover:text-purple-600 transition-colors truncate">
                  {winner.name}
                </h4>
                <p className="text-sm text-muted-foreground truncate">{winner.category}</p>
              </div>

              {/* Vote Count */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-1 text-purple-600">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-lg font-bold">{winner.voteCount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">votes</p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
