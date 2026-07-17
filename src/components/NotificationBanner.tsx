import { useState } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const NotificationBanner = () => {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: notifications } = useQuery({
    queryKey: ["user-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const visible = notifications?.filter((n) => !dismissed.includes(n.id)) || [];

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <AnimatePresence>
        {visible.slice(0, 3).map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
          >
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-foreground">{n.title}</p>
                <span className="text-[10px] text-muted-foreground">{format(new Date(n.created_at), "MMM d")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
            </div>
            <button
              onClick={() => setDismissed((prev) => [...prev, n.id])}
              className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBanner;
