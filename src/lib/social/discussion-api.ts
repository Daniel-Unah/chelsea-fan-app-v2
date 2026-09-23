import { getSupabaseClient } from '@/lib/supabase/client';

import {
  parseComments,
  parseReactions,
  type CommentRow,
  type ReactionRow,
  type ReactionType,
} from './discussion.ts';

const COMMENT_COLUMNS =
  'id, user_id, match_id, match_event_id, parent_comment_id, content, created_at, author:profiles(display_name)';

export async function loadDiscussion(
  matchId: string,
  eventIds: string[] = [],
): Promise<{
  comments: CommentRow[];
  reactions: ReactionRow[];
}> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const commentResult = await client
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (commentResult.error) {
    throw new Error(commentResult.error.message);
  }

  const comments = parseComments(commentResult.data);
  const commentIds = comments.map((comment) => comment.id);
  const eventTargets = [
    ...new Set([
      ...eventIds,
      ...comments.flatMap((comment) =>
        comment.matchEventId ? [comment.matchEventId] : [],
      ),
    ]),
  ];

  if (commentIds.length === 0 && eventTargets.length === 0) {
    return { comments, reactions: [] };
  }

  const reactionResult = await client
    .from('reactions')
    .select('user_id, comment_id, match_event_id, reaction_type')
    .or(
      [
        commentIds.length > 0 ? `comment_id.in.(${commentIds.join(',')})` : '',
        eventTargets.length > 0
          ? `match_event_id.in.(${eventTargets.join(',')})`
          : '',
      ]
        .filter((part) => part)
        .join(','),
    );

  if (reactionResult.error) {
    throw new Error(reactionResult.error.message);
  }

  return { comments, reactions: parseReactions(reactionResult.data) };
}

export async function postComment(input: {
  userId: string;
  matchId: string;
  eventId: string | null;
  parentCommentId: string | null;
  content: string;
}): Promise<void> {
  const client = requiredClient();
  const content = input.content.trim();

  if (content.length < 1 || content.length > 280) {
    throw new Error('Comments must be 1 to 280 characters.');
  }

  const { error } = await client.from('comments').insert({
    user_id: input.userId,
    match_id: input.matchId,
    match_event_id: input.eventId,
    parent_comment_id: input.parentCommentId,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleReaction(input: {
  userId: string;
  commentId: string | null;
  eventId: string | null;
  type: ReactionType;
  reacted: boolean;
}): Promise<void> {
  const client = requiredClient();

  if (input.reacted) {
    let query = client
      .from('reactions')
      .delete()
      .eq('user_id', input.userId)
      .eq('reaction_type', input.type);

    query = input.commentId
      ? query.eq('comment_id', input.commentId)
      : query.eq('match_event_id', input.eventId ?? '');

    const { error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await client.from('reactions').insert({
    user_id: input.userId,
    comment_id: input.commentId,
    match_event_id: input.eventId,
    reaction_type: input.type,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const client = requiredClient();
  const { error } = await client.from('comments').delete().eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function reportComment(input: {
  commentId: string;
  reporterId: string;
}): Promise<void> {
  const client = requiredClient();
  const { error } = await client.from('comment_reports').insert({
    comment_id: input.commentId,
    reporter_id: input.reporterId,
    reason: 'Report',
  });

  if (error) {
    throw new Error(
      error.code === '23505'
        ? 'You already reported this comment.'
        : error.message,
    );
  }
}

export async function blockUser(input: {
  blockerId: string;
  blockedId: string;
}): Promise<void> {
  const client = requiredClient();
  const { error } = await client.from('blocks').insert({
    blocker_id: input.blockerId,
    blocked_id: input.blockedId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function viewerIsModerator(userId: string): Promise<boolean> {
  const client = requiredClient();
  const { data, error } = await client
    .from('profiles')
    .select('is_moderator')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return isRecord(data) && data.is_moderator === true;
}

function requiredClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
