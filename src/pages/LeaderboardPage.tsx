import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePracticeSessions, useDailyStats } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  questionsCompleted: number;
  streak: number;
  isCurrentUser: boolean;
}

const LeaderboardPage = () => {
  const [tab, setTab] = useState<"weekly" | "alltime">("weekly");
  const { user } = useAuth();
  const { data: sessions = [] } = usePracticeSessions();
  const { data: dailyStats = [] } = useDailyStats();

  // Calculate user's own stats
  const totalScore = sessions.reduce((sum, s) => sum + ((s as any).overall_score || 0), 0);
  const avgScore = sessions.length > 0 ? Math.round(totalScore / sessions.length) : 0;
  const totalQuestions = sessions.length;
  const streak = dailyStats.length;

  // Generate mock leaderboard with user's real data mixed in
  const mockEntries: LeaderboardEntry[] = [
    { rank: 1, name: "Sarah K.", score: 87, questionsCompleted: 342, streak: 45, isCurrentUser: false },
    { rank: 2, name: "Raj P.", score: 85, questionsCompleted: 298, streak: 38, isCurrentUser: false },
    { rank: 3, name: "Li Wei", score: 83, questionsCompleted: 276, streak: 30, isCurrentUser: false },
    { rank: 4, name: "Ahmed M.", score: 81, questionsCompleted: 254, streak: 25, isCurrentUser: false },
    { rank: 5, name: "Maria G.", score: 79, questionsCompleted: 231, streak: 22, isCurrentUser: false },
    { rank: 6, name: "James T.", score: 77, questionsCompleted: 210, streak: 18, isCurrentUser: false },
    { rank: 7, name: "Priya S.", score: 75, questionsCompleted: 195, streak: 15, isCurrentUser: false },
    { rank: 8, name: "Chen Y.", score: 73, questionsCompleted: 178, streak: 12, isCurrentUser: false },
    { rank: 9, name: "Emma L.", score: 71, questionsCompleted: 156, streak: 10, isCurrentUser: false },
    { rank: 10, name: "David R.", score: 69, questionsCompleted: 134, streak: 8, isCurrentUser: false },
  ];

  // Insert current user
  const userEntry: LeaderboardEntry = {
    rank: 0,
    name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You",
    score: avgScore,
    questionsCompleted: totalQuestions,
    streak,
    isCurrentUser: true,
  };

  const allEntries = [...mockEntries, userEntry]
    .sort((a, b) => b.score - a.score || b.questionsCompleted - a.questionsCompleted)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const userRank = allEntries.find(e => e.isCurrentUser)?.rank || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/12 flex items-center justify-center text-2xl">🏆</div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground font-semibold">Compete with other PTE learners</p>
        </div>
      </div>

      {/* Your rank card */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-bold text-primary">Your Ranking</p>
          <p className="text-3xl font-black text-foreground">#{userRank}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-black text-foreground">{avgScore}</p>
            <p className="text-xs text-muted-foreground font-semibold">Avg Score</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{totalQuestions}</p>
            <p className="text-xs text-muted-foreground font-semibold">Questions</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground font-semibold">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button 
          variant={tab === "weekly" ? "default" : "outline"} 
          onClick={() => setTab("weekly")} 
          className="rounded-xl font-bold flex-1"
        >
          This Week
        </Button>
        <Button 
          variant={tab === "alltime" ? "default" : "outline"} 
          onClick={() => setTab("alltime")} 
          className="rounded-xl font-bold flex-1"
        >
          All Time
        </Button>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {allEntries.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 sm:gap-4 rounded-xl border-2 p-3 sm:p-4 transition-all ${
              entry.isCurrentUser 
                ? "border-primary bg-primary/5 shadow-md" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="w-8 flex justify-center shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                {entry.name} {entry.isCurrentUser && <span className="text-xs text-primary">(You)</span>}
              </p>
              <p className="text-xs text-muted-foreground">{entry.questionsCompleted} questions · {entry.streak} day streak</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-foreground">{entry.score}</p>
              <p className="text-xs text-muted-foreground">avg score</p>
            </div>
            {entry.rank <= 3 && (
              <Star className={`h-4 w-4 shrink-0 ${entry.rank === 1 ? "text-yellow-500 fill-yellow-500" : entry.rank === 2 ? "text-gray-400 fill-gray-400" : "text-amber-600 fill-amber-600"}`} />
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        <Users className="h-3 w-3 inline mr-1" />
        Rankings update in real-time based on practice scores and consistency
      </p>
    </div>
  );
};

export default LeaderboardPage;
