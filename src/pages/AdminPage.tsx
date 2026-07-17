import { useState } from "react";
import { Shield, Users, FileQuestion, BarChart3, AlertTriangle, Trash2, Edit, Send, Bell, Search, UserCog, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdmin, useAdminStats, useAdminQuestions, useAdminUsers, useDeleteQuestion, useUpdateQuestion, useSendBroadcast, useAdminNotifications, useManageRole, useDeleteUser } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const AdminPage = () => {
  const { t } = useLanguage();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: questions, isLoading: questionsLoading } = useAdminQuestions();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: notifications } = useAdminNotifications();
  const deleteQuestion = useDeleteQuestion();
  const updateQuestion = useUpdateQuestion();
  const sendBroadcast = useSendBroadcast();
  const manageRole = useManageRole();
  const deleteUser = useDeleteUser();
  const [searchQ, setSearchQ] = useState("");
  const [searchU, setSearchU] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", difficulty: "", content: "" });

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-sm">You don't have admin privileges.</p>
      </div>
    );
  }

  const filteredQuestions = questions?.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      q.skill.toLowerCase().includes(searchQ.toLowerCase()) ||
      q.sub_type.toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredUsers = users?.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(searchU.toLowerCase()) ||
      u.id.toLowerCase().includes(searchU.toLowerCase())
  );

  const handleEdit = (q: any) => {
    setEditingQuestion(q);
    setEditForm({ title: q.title, difficulty: q.difficulty || "medium", content: q.content });
  };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    updateQuestion.mutate(
      { id: editingQuestion.id, updates: editForm },
      { onSuccess: () => setEditingQuestion(null) }
    );
  };

  const handleBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    sendBroadcast.mutate(
      { title: broadcastTitle, message: broadcastMsg },
      { onSuccess: () => { setBroadcastTitle(""); setBroadcastMsg(""); } }
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("admin")} {t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">Full platform control</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("totalUsers"), value: stats?.totalUsers || 0, icon: Users, color: "hsl(var(--primary))" },
          { label: t("totalQuestions"), value: stats?.totalQuestions || 0, icon: FileQuestion, color: "hsl(var(--info))" },
          { label: t("totalSessions"), value: stats?.totalSessions || 0, icon: BarChart3, color: "hsl(var(--warning))" },
          { label: "Broadcasts", value: stats?.totalNotifications || 0, icon: Bell, color: "hsl(var(--destructive))" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border-2 bg-card p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground">{statsLoading ? "..." : stat.value.toLocaleString()}</p>
              <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="questions" className="gap-2"><FileQuestion className="h-4 w-4" />{t("questions")}</TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-2"><Send className="h-4 w-4" />Broadcast</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="rounded-2xl border-2 bg-card overflow-hidden">
              <div className="p-4 border-b-2 flex items-center gap-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users by name or ID..." value={searchU} onChange={(e) => setSearchU(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
              </div>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">{u.full_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.target_exam || "PTE"} / {u.target_score || 65}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{u.sessionCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.length > 0 ? u.roles.map((r: string) => (
                              <Badge key={r} className="capitalize bg-primary/10 text-primary border-0">{r}</Badge>
                            )) : <Badge variant="outline">user</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm"><UserCog className="h-4 w-4" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Manage Roles — {u.full_name || u.id.slice(0, 8)}</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                  {(["admin", "moderator", "user"] as const).map((role) => {
                                    const hasRole = u.roles.includes(role);
                                    return (
                                      <div key={role} className="flex items-center justify-between p-3 rounded-xl border-2">
                                        <span className="font-semibold capitalize">{role}</span>
                                        <Button
                                          size="sm"
                                          variant={hasRole ? "destructive" : "default"}
                                          onClick={() => manageRole.mutate({ userId: u.id, role, action: hasRole ? "remove" : "add" })}
                                          disabled={manageRole.isPending}
                                        >
                                          {hasRole ? <><X className="h-3 w-3 mr-1" />Remove</> : <><Check className="h-3 w-3 mr-1" />Add</>}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { if (confirm(`Permanently delete user "${u.full_name || u.id.slice(0, 8)}"? This cannot be undone.`)) deleteUser.mutate(u.id); }}
                              disabled={deleteUser.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="p-3 border-t-2 text-xs text-muted-foreground font-semibold">
                {filteredUsers?.length || 0} users found
              </div>
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="rounded-2xl border-2 bg-card overflow-hidden">
              <div className="p-4 border-b-2 flex items-center gap-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search questions..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
              </div>
              {questionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>AI</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions?.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-semibold max-w-[200px] truncate">{q.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{q.skill}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{q.sub_type}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{q.difficulty}</Badge></TableCell>
                        <TableCell>
                          {q.is_ai_generated ? <Badge className="bg-primary/10 text-primary border-0">AI</Badge> : <Badge variant="outline">Manual</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(q)}><Edit className="h-4 w-4" /></Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("Delete this question?")) deleteQuestion.mutate(q.id); }}
                              disabled={deleteQuestion.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="p-3 border-t-2 text-xs text-muted-foreground font-semibold">
                {filteredQuestions?.length || 0} questions found
              </div>
            </div>
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send */}
              <div className="rounded-2xl border-2 bg-card p-6 space-y-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2"><Send className="h-5 w-5" />Send Broadcast</h3>
                <p className="text-sm text-muted-foreground">Send a notification to all users on the platform.</p>
                <Input placeholder="Notification title..." value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
                <Textarea placeholder="Write your message here..." rows={4} value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                <Button
                  onClick={handleBroadcast}
                  disabled={!broadcastTitle.trim() || !broadcastMsg.trim() || sendBroadcast.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendBroadcast.isPending ? "Sending..." : "Send to All Users"}
                </Button>
              </div>

              {/* History */}
              <div className="rounded-2xl border-2 bg-card p-6 space-y-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2"><Bell className="h-5 w-5" />Broadcast History</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {notifications?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No broadcasts sent yet</p>
                  )}
                  {notifications?.map((n) => (
                    <div key={n.id} className="rounded-xl border-2 p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground">{n.title}</p>
                        <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, HH:mm")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Question</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Title</label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Difficulty</label>
              <Select value={editForm.difficulty} onValueChange={(v) => setEditForm({ ...editForm, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Content</label>
              <Textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveEdit} disabled={updateQuestion.isPending}>
              {updateQuestion.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminPage;
