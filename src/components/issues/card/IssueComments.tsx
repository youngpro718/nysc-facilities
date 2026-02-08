import { useState } from "react";
import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment } from "../types/IssueTypes";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CommentWithAuthor extends Comment {
  profiles?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface IssueCommentsProps {
  issueId: string;
  compact?: boolean; // For inline display in cards
}

export const IssueComments = ({ issueId, compact = false }: IssueCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['issue-comments', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_comments')
        .select(`
          *,
          profiles:author_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true }); // Oldest first for conversation flow

      if (error) throw error;
      return data as CommentWithAuthor[];
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Must be logged in to comment');
      
      const { data, error } = await supabase
        .from('issue_comments')
        .insert([
          {
            issue_id: issueId,
            content,
            author_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', issueId] });
      setNewComment("");
      toast.success("Comment added");
    },
    onError: (error) => {
      toast.error("Failed to add comment");
      logger.error("Error adding comment:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getAuthorName = (comment: CommentWithAuthor) => {
    if (comment.profiles?.first_name || comment.profiles?.last_name) {
      return `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim();
    }
    return 'Unknown User';
  };

  const getAuthorInitials = (comment: CommentWithAuthor) => {
    const first = comment.profiles?.first_name?.[0] || '';
    const last = comment.profiles?.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  // Compact mode for inline display
  if (compact) {
    return (
      <div className="space-y-3">
        {comments && comments.length > 0 && (
          <div className="space-y-2">
            {comments.slice(-3).map((comment) => (
              <div key={comment.id} className="flex gap-2 text-sm">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  {comment.profiles?.avatar_url && (
                    <AvatarImage src={comment.profiles.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs">{getAuthorInitials(comment)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs">{getAuthorName(comment)}</span>
                  <p className="text-muted-foreground text-xs line-clamp-2">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length > 3 && (
              <p className="text-xs text-muted-foreground">+{comments.length - 3} more comments</p>
            )}
          </div>
        )}
        
        {user && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] text-sm"
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment input at top */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback>
                {(profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!newComment.trim() || addCommentMutation.isPending}
              size="sm"
            >
              {addCommentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Sign in to add comments</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to add an update or question</p>
          </div>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {comment.profiles?.avatar_url && (
                  <AvatarImage src={comment.profiles.avatar_url} />
                )}
                <AvatarFallback>{getAuthorInitials(comment)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{getAuthorName(comment)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
