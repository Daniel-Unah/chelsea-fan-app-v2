import { useEffect, useState } from 'react';

import {
  blockUser,
  deleteComment,
  loadDiscussion,
  postComment,
  reportComment,
  toggleReaction,
  viewerIsModerator,
} from '@/lib/social/discussion-api';
import {
  buildThreads,
  summarize,
  type CommentThread,
  type ReactionRow,
  type ReactionSummary,
  type ReactionType,
} from '@/lib/social/discussion';
import { useAuth } from '@/providers/auth-provider';

export function useMatchDiscussion(
  matchId: string | undefined,
  eventIds: string[],
) {
  const { isLoggedIn, session } = useAuth();
  const userId = session?.user.id ?? null;
  const eventKey = eventIds.join(',');
  const [comments, setComments] = useState<
    Awaited<ReturnType<typeof loadDiscussion>>['comments']
  >([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [moderator, setModerator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !matchId || !userId) {
      return;
    }

    const id = matchId;
    const viewerId = userId;
    let active = true;

    async function load() {
      try {
        const [discussion, isModerator] = await Promise.all([
          loadDiscussion(id, eventKey ? eventKey.split(',') : []),
          viewerIsModerator(viewerId),
        ]);

        if (!active) {
          return;
        }

        setComments(discussion.comments);
        setReactions(discussion.reactions);
        setModerator(isModerator);
        setError(null);
      } catch (caught) {
        if (!active) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : 'Could not load discussion.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [eventKey, isLoggedIn, matchId, userId]);

  async function refresh() {
    if (!matchId || !userId) {
      return;
    }

    const discussion = await loadDiscussion(
      matchId,
      eventKey ? eventKey.split(',') : [],
    );
    setComments(discussion.comments);
    setReactions(discussion.reactions);
  }

  async function run(action: () => Promise<void>) {
    try {
      setError(null);
      await action();
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'That action failed.',
      );
      throw caught;
    }
  }

  return {
    loading,
    error,
    userId,
    moderator,
    threadsFor(eventId: string | null): CommentThread[] {
      return buildThreads(comments, reactions, userId, eventId);
    },
    eventReactions(eventId: string): ReactionSummary[] {
      return summarize(reactions, userId, null, eventId);
    },
    post(
      eventId: string | null,
      parentCommentId: string | null,
      content: string,
    ) {
      if (!userId || !matchId) {
        return Promise.resolve();
      }

      return run(() =>
        postComment({
          userId,
          matchId,
          eventId,
          parentCommentId,
          content,
        }),
      );
    },
    react(target: {
      commentId: string | null;
      eventId: string | null;
      type: ReactionType;
      reacted: boolean;
    }) {
      if (!userId) {
        return Promise.resolve();
      }

      return run(() => toggleReaction({ userId, ...target }));
    },
    remove(commentId: string) {
      return run(() => deleteComment(commentId));
    },
    report(commentId: string) {
      if (!userId) {
        return Promise.resolve();
      }

      return run(() => reportComment({ commentId, reporterId: userId }));
    },
    block(blockedId: string) {
      if (!userId) {
        return Promise.resolve();
      }

      return run(() => blockUser({ blockerId: userId, blockedId }));
    },
  };
}
