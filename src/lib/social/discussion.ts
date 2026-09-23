export const REACTION_TYPES = ['heart', 'laugh', 'shock'] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export type CommentRow = {
  id: string;
  userId: string;
  matchId: string;
  matchEventId: string | null;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  authorName: string;
};

export type ReactionRow = {
  userId: string;
  commentId: string | null;
  matchEventId: string | null;
  type: ReactionType;
};

export type ReactionSummary = {
  type: ReactionType;
  count: number;
  reacted: boolean;
};

export type CommentThread = CommentRow & {
  reactions: ReactionSummary[];
  replies: CommentThread[];
};

export function parseComments(rows: unknown): CommentRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row) => {
    if (
      !isRecord(row) ||
      typeof row.id !== 'string' ||
      typeof row.user_id !== 'string' ||
      typeof row.match_id !== 'string' ||
      typeof row.content !== 'string' ||
      typeof row.created_at !== 'string'
    ) {
      return [];
    }

    return [
      {
        id: row.id,
        userId: row.user_id,
        matchId: row.match_id,
        matchEventId:
          typeof row.match_event_id === 'string' ? row.match_event_id : null,
        parentCommentId:
          typeof row.parent_comment_id === 'string'
            ? row.parent_comment_id
            : null,
        content: row.content,
        createdAt: row.created_at,
        authorName: authorName(row.author),
      },
    ];
  });
}

export function parseReactions(rows: unknown): ReactionRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row) => {
    if (
      !isRecord(row) ||
      typeof row.user_id !== 'string' ||
      !isReactionType(row.reaction_type)
    ) {
      return [];
    }

    return [
      {
        userId: row.user_id,
        commentId: typeof row.comment_id === 'string' ? row.comment_id : null,
        matchEventId:
          typeof row.match_event_id === 'string' ? row.match_event_id : null,
        type: row.reaction_type,
      },
    ];
  });
}

export function buildThreads(
  comments: CommentRow[],
  reactions: ReactionRow[],
  viewerId: string | null,
  eventId: string | null,
): CommentThread[] {
  const scoped = comments.filter((comment) => comment.matchEventId === eventId);
  const topLevel = scoped
    .filter((comment) => comment.parentCommentId === null)
    .sort(oldestFirst);

  return topLevel.map((comment) => ({
    ...comment,
    reactions: summarize(reactions, viewerId, comment.id, null),
    replies: scoped
      .filter((reply) => reply.parentCommentId === comment.id)
      .sort(oldestFirst)
      .map((reply) => ({
        ...reply,
        reactions: summarize(reactions, viewerId, reply.id, null),
        replies: [],
      })),
  }));
}

export function summarize(
  reactions: ReactionRow[],
  viewerId: string | null,
  commentId: string | null,
  eventId: string | null,
): ReactionSummary[] {
  return REACTION_TYPES.map((type) => {
    const matches = reactions.filter(
      (reaction) =>
        reaction.type === type &&
        reaction.commentId === commentId &&
        reaction.matchEventId === eventId,
    );

    return {
      type,
      count: matches.length,
      reacted:
        viewerId !== null &&
        matches.some((reaction) => reaction.userId === viewerId),
    };
  });
}

function oldestFirst(left: CommentRow, right: CommentRow): number {
  return left.createdAt.localeCompare(right.createdAt);
}

function authorName(value: unknown): string {
  if (Array.isArray(value)) {
    return authorName(value[0]);
  }

  if (isRecord(value) && typeof value.display_name === 'string') {
    return value.display_name;
  }

  return 'Fan';
}

function isReactionType(value: unknown): value is ReactionType {
  return value === 'heart' || value === 'laugh' || value === 'shock';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
