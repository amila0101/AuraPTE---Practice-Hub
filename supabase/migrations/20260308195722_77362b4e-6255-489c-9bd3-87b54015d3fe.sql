
-- Community forum posts
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read posts"
ON public.forum_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create posts"
ON public.forum_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
ON public.forum_posts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.forum_posts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins can delete any post
CREATE POLICY "Admins can delete any post"
ON public.forum_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Forum replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read replies"
ON public.forum_replies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create replies"
ON public.forum_replies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
ON public.forum_replies FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any reply"
ON public.forum_replies FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
