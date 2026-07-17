import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Question {
  id: string;
  exam_type: string;
  skill: string;
  sub_type: string;
  title: string;
  instruction: string;
  content: string;
  options: string[] | null;
  correct_answer: Record<string, unknown> | null;
  difficulty: string;
  audio_url: string | null;
  image_url: string | null;
  is_ai_generated: boolean;
  created_at: string;
}

export const useQuestions = (skill?: string, examType?: string) => {
  return useQuery({
    queryKey: ["questions", skill, examType],
    queryFn: async () => {
      let query = supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (skill) query = query.eq("skill", skill);
      if (examType) query = query.eq("exam_type", examType);
      // Hide legacy Describe Image rows without generated images
      query = query.or("sub_type.neq.Describe Image,image_url.not.is.null");
      const { data, error } = await query;
      if (error) throw error;
      return data as Question[];
    },
  });
};

export const useGenerateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { skill: string; sub_type?: string; difficulty?: string; exam_type?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-question", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as Question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("New question generated!");
    },
    onError: (err) => {
      toast.error(`Failed to generate: ${err.message}`);
    },
  });
};

export const useScoreAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { question_id: string; answer_text: string; time_spent_seconds: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("score-answer", {
        body: params,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["daily-stats"] });
    },
    onError: (err) => {
      toast.error(`Scoring failed: ${err.message}`);
    },
  });
};

export const usePracticeSessions = () => {
  return useQuery({
    queryKey: ["practice-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*, questions(*)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
};

export const useDailyStats = () => {
  return useQuery({
    queryKey: ["daily-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_stats")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
};
