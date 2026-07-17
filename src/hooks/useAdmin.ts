import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profilesRes, questionsRes, sessionsRes, notificationsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("practice_sessions").select("id", { count: "exact", head: true }),
        supabase.from("admin_notifications").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: profilesRes.count || 0,
        totalQuestions: questionsRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        totalNotifications: notificationsRes.count || 0,
      };
    },
  });
};

export const useAdminQuestions = () => {
  return useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabase.from("user_roles").select("*");
      
      // Get session counts per user
      const { data: sessions } = await supabase
        .from("practice_sessions")
        .select("user_id");

      const sessionCounts: Record<string, number> = {};
      sessions?.forEach((s) => {
        sessionCounts[s.user_id] = (sessionCounts[s.user_id] || 0) + 1;
      });

      return (data || []).map((profile) => ({
        ...profile,
        roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
        sessionCount: sessionCounts[profile.id] || 0,
      }));
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Question deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("questions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast.success("Question updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useSendBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, message }: { title: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("admin_notifications").insert({
        title,
        message,
        sent_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Broadcast sent to all users!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAdminNotifications = () => {
  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
};

export const useManageRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: "admin" | "moderator" | "user"; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: role as any,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
