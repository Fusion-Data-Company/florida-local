import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Copy, Check, Mail, MessageSquare, Share2, Trophy, TrendingUp, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
}

interface ReferralCode {
  code: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  rank: number;
}

export default function ReferralCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Fetch referral code
  const { data: referralData, isLoading: codeLoading } = useQuery<ReferralCode>({
    queryKey: ["/api/loyalty/referral/code"],
  });

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/loyalty/referral/stats"],
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/loyalty/referral/leaderboard"],
  });

  // Send referral email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (recipientEmail: string) => {
      const response = await fetch("/api/loyalty/referral/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: recipientEmail }),
      });
      if (!response.ok) {
        throw new Error("Failed to send referral email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Referral Sent! 📧",
        description: "Your referral invitation has been sent.",
      });
      setEmail("");
      setShowShareDialog(false);
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send the referral email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const referralCode = referralData?.code;
  const referralUrl = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : "";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied! ✓",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSend = () => {
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sendEmailMutation.mutate(email);
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Join me on Florida Local Elite and earn rewards! Use my referral code: ${referralCode}\n${referralUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareViaTwitter = () => {
    const message = encodeURIComponent(
      `Join me on @FloridaLocalElite and earn rewards! ${referralUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${message}`, "_blank");
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, "_blank");
  };

  const isLoading = codeLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-slate-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Referral Center
        </h2>
        <p className="text-muted-foreground mt-1">
          Invite friends and earn rewards together
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Referrals</div>
                    <div className="text-3xl font-bold">{stats.totalReferrals}</div>
                  </div>
                  <Users className="h-10 w-10 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pending</div>
                    <div className="text-3xl font-bold">{stats.pendingReferrals}</div>
                  </div>
                  <TrendingUp className="h-10 w-10 text-yellow-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Completed</div>
                    <div className="text-3xl font-bold">{stats.completedReferrals}</div>
                  </div>
                  <Check className="h-10 w-10 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Points Earned</div>
                    <div className="text-3xl font-bold">{stats.totalPointsEarned.toLocaleString()}</div>
                  </div>
                  <Gift className="h-10 w-10 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Referral Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>
              Share this link with friends to earn 200 points for each signup, plus 500 bonus points when they make their first purchase!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code Display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={referralCode || "Loading..."}
                  readOnly
                  className="font-mono text-lg font-bold pr-10"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => copyToClipboard(referralCode || "")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Referral URL Display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={referralUrl || "Loading..."}
                  readOnly
                  className="text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => copyToClipboard(referralUrl || "")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Referral via Email</DialogTitle>
                    <DialogDescription>
                      Enter your friend's email address to send them an invitation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={handleEmailSend}
                      disabled={sendEmailMutation.isPending}
                    >
                      {sendEmailMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={shareViaWhatsApp}>
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>

              <Button variant="outline" onClick={shareViaTwitter}>
                <Share2 className="mr-2 h-4 w-4" />
                Twitter
              </Button>

              <Button variant="outline" onClick={shareViaFacebook}>
                <Share2 className="mr-2 h-4 w-4" />
                Facebook
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>How Referrals Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">1. Share Your Link</h4>
                <p className="text-sm text-muted-foreground">
                  Send your unique referral code to friends via email, social media, or messaging
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">2. Friend Signs Up</h4>
                <p className="text-sm text-muted-foreground">
                  Your friend creates an account using your referral code and gets 100 welcome points
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">3. Earn Together</h4>
                <p className="text-sm text-muted-foreground">
                  You earn 200 points immediately, plus 500 bonus points when they complete their first purchase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Referrers
            </CardTitle>
            <CardDescription>
              See who's sharing the most and earning big rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry, index) => {
                  const rankColors = [
                    "bg-yellow-500 text-white",
                    "bg-slate-400 text-white",
                    "bg-orange-600 text-white",
                  ];
                  const rankColor = rankColors[index] || "bg-muted";

                  return (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${rankColor}`}
                        >
                          {entry.rank}
                        </div>
                        <div>
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.completedReferrals} completed referrals
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {entry.totalPointsEarned.toLocaleString()} pts
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.totalReferrals} total
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <div>No leaderboard data yet</div>
                <div className="text-sm">Be the first to start referring!</div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
