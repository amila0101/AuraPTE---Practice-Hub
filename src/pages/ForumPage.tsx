import { useState } from "react";
import { MessageSquare, Plus, Send, ArrowLeft, Trash2, MessageCircle, Users, Search, Heart, Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useForumPosts, useForumReplies, useCreatePost, useCreateReply, useDeletePost } from "@/hooks/useForum";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const categories = [
  { value: "all", label: "All Topics" },
  { value: "general", label: "General" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "scores", label: "Score Reports" },
];

const categoryColors: Record<string, string> = {
  general: "hsl(var(--primary))",
  speaking: "hsl(var(--speaking))",
  writing: "hsl(var(--info))",
  reading: "hsl(var(--warning))",
  listening: "hsl(var(--destructive))",
  tips: "hsl(var(--accent))",
  scores: "hsl(var(--primary))",
};

// Pinned post IDs (demo)
const PINNED_IDS: string[] = [];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ForumPage = () => {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [replyContent, setReplyContent] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const { data: posts, isLoading } = useForumPosts(category);
  const { data: replies } = useForumReplies(selectedPostId || "");
  const createPost = useCreatePost();
  const createReply = useCreateReply();
  const deletePost = useDeletePost();

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter by search
  const filteredPosts = posts?.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  const selectedPost = posts?.find((p) => p.id === selectedPostId);


  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    createPost.mutate(
      { title: newTitle, content: newContent, category: newCategory },
      { onSuccess: () => { setNewTitle(""); setNewContent(""); setNewCategory("general"); } }
    );
  };

  const handleReply = () => {
    if (!replyContent.trim() || !selectedPostId) return;
    createReply.mutate(
      { postId: selectedPostId, content: replyContent },
      { onSuccess: () => setReplyContent("") }
    );
  };

  // Post detail view
  if (selectedPost) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto px-4 lg:px-6 py-8 space-y-6">
        <motion.div variants={item}>
          <Button variant="ghost" onClick={() => setSelectedPostId(null)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Forum
          </Button>
          <div className="rounded-2xl border-2 bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge style={{ background: `${categoryColors[selectedPost.category] || "hsl(var(--primary))"}20`, color: categoryColors[selectedPost.category] || "hsl(var(--primary))", border: "none" }} className="capitalize">{selectedPost.category}</Badge>
                  <span className="text-xs text-muted-foreground">{format(new Date(selectedPost.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
                <h1 className="text-xl font-black text-foreground">{selectedPost.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{selectedPost.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-muted-foreground">{selectedPost.author_name}</span>
                </div>
              </div>
              {(selectedPost.user_id === user?.id || isAdmin) && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { deletePost.mutate(selectedPost.id); setSelectedPostId(null); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-4 text-foreground/90 whitespace-pre-wrap">{selectedPost.content}</p>
          </div>
        </motion.div>

        {/* Replies */}
        <motion.div variants={item} className="space-y-3">
          <h3 className="text-sm font-black text-foreground">{replies?.length || 0} Replies</h3>
          {replies?.map((r) => (
            <div key={r.id} className="rounded-xl border-2 bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">{r.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">{r.author_name}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}

          {/* Reply input */}
          <div className="rounded-xl border-2 bg-card p-4 flex gap-3">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleReply} disabled={!replyContent.trim() || createReply.isPending} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Posts list view
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Community Forum</h1>
            <p className="text-sm text-muted-foreground font-semibold">Discuss, share tips & help each other</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Post title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.value !== "all").map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="What's on your mind?" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={5} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <DialogClose asChild>
                <Button onClick={handleCreatePost} disabled={!newTitle.trim() || !newContent.trim()}>Post</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search forum posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl border-2"
        />
      </motion.div>

      {/* Category filter */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border-2 ${
              category === c.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-transparent hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </motion.div>

      {/* Posts */}
      <motion.div variants={item} className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
        ) : filteredPosts?.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-semibold">
              {searchQuery ? `No posts match "${searchQuery}"` : "No posts yet. Be the first to start a discussion!"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredPosts?.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 bg-card p-5 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedPostId(post.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {PINNED_IDS.includes(post.id) && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </span>
                      )}
                      <Badge style={{ background: `${categoryColors[post.category] || "hsl(var(--primary))"}20`, color: categoryColors[post.category], border: "none" }} className="capitalize text-[10px]">{post.category}</Badge>
                    </div>
                    <h3 className="font-black text-foreground truncate">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">{post.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-muted-foreground">{post.author_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(post.created_at), "MMM d")}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.reply_count}
                      </div>
                      {/* Like button */}
                      <button
                        className={`flex items-center gap-1 text-xs font-bold ml-auto transition-colors ${
                          likedPosts.has(post.id) ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                        }`}
                        onClick={(e) => toggleLike(post.id, e)}
                      >
                        <Heart className={`h-3.5 w-3.5 ${likedPosts.has(post.id) ? "fill-red-500" : ""}`} />
                        {likedPosts.has(post.id) ? 1 : 0}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ForumPage;
