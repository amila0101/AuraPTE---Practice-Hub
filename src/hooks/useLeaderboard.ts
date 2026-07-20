import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardUser {
  id: string;
  name: string;
  score: number;
  questionsCompleted: number;
  streak: number;
}

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: pError } = await supabase.from("profiles").select("id, full_name");
      if (pError) throw pError;

      // Fetch all practice sessions to calculate scores
      // Note: If RLS restricts this, it will only return the user's own sessions.
      // We assume public read access is enabled for the leaderboard feature.
      const { data: sessions, error: sError } = await supabase.from("practice_sessions").select("user_id, overall_score");
      if (sError) throw sError;

      // Fetch daily stats to calculate streak & questions completed
      const { data: stats, error: stError } = await supabase.from("daily_stats").select("user_id, questions_done, date");
      if (stError) throw stError;

      const userMap: Record<string, LeaderboardUser> = {};

      profiles?.forEach(p => {
        userMap[p.id] = {
          id: p.id,
          name: p.full_name || "Unknown Scholar",
          score: 0,
          questionsCompleted: 0,
          streak: 0,
        };
      });

      // Calculate aggregate stats
      stats?.forEach(s => {
        if (!userMap[s.user_id]) {
          userMap[s.user_id] = { id: s.user_id, name: "Unknown Scholar", score: 0, questionsCompleted: 0, streak: 0 };
        }
        userMap[s.user_id].questionsCompleted += (s.questions_done || 0);
        userMap[s.user_id].streak += 1; // Simplified streak calculation
      });

      // Calculate average score
      const scoreCount: Record<string, { total: number; count: number }> = {};
      sessions?.forEach(s => {
        if (!scoreCount[s.user_id]) scoreCount[s.user_id] = { total: 0, count: 0 };
        scoreCount[s.user_id].total += (s.overall_score || 0);
        scoreCount[s.user_id].count += 1;
      });

      Object.keys(scoreCount).forEach(uid => {
        if (userMap[uid]) {
          userMap[uid].score = Math.round(scoreCount[uid].total / scoreCount[uid].count);
        }
      });

      // Convert to array and sort
      return Object.values(userMap)
        .filter(u => u.questionsCompleted > 0) // Only show active users
        .sort((a, b) => b.score - a.score || b.questionsCompleted - a.questionsCompleted);
    },
  });
};
