import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useForumPosts = (category?: string) => {
  return useQuery({
    queryKey: ["forum-posts", category],
    queryFn: async () => {
      let query = supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) throw error;

      // Get profiles for all user_ids
      const userIds = [...new Set((data || []).map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Get reply counts
      const postIds = (data || []).map((p) => p.id);
      const { data: replies } = await supabase
        .from("forum_replies")
        .select("post_id")
        .in("post_id", postIds);

      const replyCounts: Record<string, number> = {};
      replies?.forEach((r) => {
        replyCounts[r.post_id] = (replyCounts[r.post_id] || 0) + 1;
      });

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = p.full_name || "Anonymous";
      });

      return (data || []).map((post) => ({
        ...post,
        author_name: profileMap[post.user_id] || "Anonymous",
        reply_count: replyCounts[post.id] || 0,
      }));
    },
  });
};

export const useForumReplies = (postId: string) => {
  return useQuery({
    queryKey: ["forum-replies", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = p.full_name || "Anonymous";
      });

      return (data || []).map((reply) => ({
        ...reply,
        author_name: profileMap[reply.user_id] || "Anonymous",
      }));
    },
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, content, category }: { title: string; content: string; category: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("forum_posts").insert({
        user_id: user.id,
        title,
        content,
        category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      toast.success("Post created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("forum_replies").insert({
        post_id: postId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["forum-replies", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      toast.success("Reply posted!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forum_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      toast.success("Post deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
