import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { useMatchDiscussion } from '@/hooks/use-match-discussion';
import {
  REACTION_TYPES,
  type CommentThread,
  type ReactionSummary,
  type ReactionType,
} from '@/lib/social/discussion';

type Discussion = ReturnType<typeof useMatchDiscussion>;

const REACTION_LABELS: Record<ReactionType, string> = {
  heart: 'Heart',
  laugh: 'Laugh',
  shock: 'Shock',
};

export function DiscussionPanel({
  title,
  eventId,
  discussion,
  showStatus = true,
}: {
  title: string;
  eventId: string | null;
  discussion: Discussion;
  showStatus?: boolean;
}) {
  const threads = discussion.threadsFor(eventId);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  async function submit(parentCommentId: string | null, content: string) {
    await discussion.post(eventId, parentCommentId, content);
  }

  return (
    <View style={styles.section}>
      <ThemedText style={styles.heading}>{title}</ThemedText>
      {showStatus && discussion.loading ? (
        <ThemedText themeColor="textSecondary">Loading discussion.</ThemedText>
      ) : null}
      {showStatus && discussion.error ? (
        <ThemedText themeColor="danger">{discussion.error}</ThemedText>
      ) : null}
      {eventId ? (
        <ReactionRow
          reactions={discussion.eventReactions(eventId)}
          onToggle={(type, reacted) => {
            void discussion.react({
              commentId: null,
              eventId,
              type,
              reacted,
            });
          }}
        />
      ) : null}
      {threads.length === 0 && !discussion.loading ? (
        <ThemedText themeColor="textSecondary">No comments yet.</ThemedText>
      ) : null}
      {threads.map((thread) => (
        <CommentCard
          key={thread.id}
          comment={thread}
          discussion={discussion}
          replyTo={replyTo}
          onReply={setReplyTo}
          onSubmitReply={submit}
        />
      ))}
      <TextField
        label="Comment"
        value={draft}
        onChangeText={setDraft}
        placeholder="Say something about the match"
      />
      <Button
        label="Post"
        onPress={() => {
          void submit(null, draft)
            .then(() => {
              setDraft('');
            })
            .catch(() => undefined);
        }}
      />
    </View>
  );
}

function CommentCard({
  comment,
  discussion,
  replyTo,
  onReply,
  onSubmitReply,
  nested = false,
}: {
  comment: CommentThread;
  discussion: Discussion;
  replyTo: string | null;
  onReply: (commentId: string | null) => void;
  onSubmitReply: (
    parentCommentId: string | null,
    content: string,
  ) => Promise<void>;
  nested?: boolean;
}) {
  const theme = useTheme();
  const [reply, setReply] = useState('');
  const own = discussion.userId === comment.userId;
  const canDelete = own || discussion.moderator;

  return (
    <View style={styles.thread}>
      <View
        style={[
          styles.card,
          nested && styles.nested,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemedText style={styles.author}>{comment.authorName}</ThemedText>
        <ThemedText>{comment.content}</ThemedText>
        <ReactionRow
          reactions={comment.reactions}
          onToggle={(type, reacted) => {
            void discussion.react({
              commentId: comment.id,
              eventId: null,
              type,
              reacted,
            });
          }}
        />
        <View style={styles.actions}>
          {nested ? null : (
            <Action
              label="Reply"
              onPress={() => {
                onReply(replyTo === comment.id ? null : comment.id);
              }}
            />
          )}
          {canDelete ? (
            <Action
              label="Delete"
              onPress={() => {
                void discussion.remove(comment.id);
              }}
            />
          ) : null}
          {own ? null : (
            <Action
              label="Report"
              onPress={() => {
                void discussion.report(comment.id);
              }}
            />
          )}
          {own ? null : (
            <Action
              label="Block"
              onPress={() => {
                void discussion.block(comment.userId);
              }}
            />
          )}
        </View>
        {replyTo === comment.id ? (
          <View style={styles.replyBox}>
            <TextField
              label="Reply"
              value={reply}
              onChangeText={setReply}
              placeholder="Reply"
            />
            <Button
              label="Reply"
              onPress={() => {
                void onSubmitReply(comment.id, reply)
                  .then(() => {
                    setReply('');
                    onReply(null);
                  })
                  .catch(() => undefined);
              }}
            />
          </View>
        ) : null}
      </View>
      {comment.replies.map((replyComment) => (
        <CommentCard
          key={replyComment.id}
          comment={replyComment}
          discussion={discussion}
          replyTo={null}
          onReply={onReply}
          onSubmitReply={onSubmitReply}
          nested
        />
      ))}
    </View>
  );
}

function ReactionRow({
  reactions,
  onToggle,
}: {
  reactions: ReactionSummary[];
  onToggle: (type: ReactionType, reacted: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.actions}>
      {REACTION_TYPES.map((type) => {
        const summary = reactions.find((reaction) => reaction.type === type);

        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            onPress={() => {
              onToggle(type, summary?.reacted ?? false);
            }}
            style={[
              styles.reaction,
              {
                borderColor: theme.border,
                backgroundColor: summary?.reacted
                  ? theme.backgroundSelected
                  : theme.background,
              },
            ]}
          >
            <ThemedText style={styles.actionLabel}>
              {REACTION_LABELS[type]} {summary?.count ?? 0}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <ThemedText themeColor="link" style={styles.actionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  heading: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  thread: {
    gap: Spacing.two,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  nested: {
    marginLeft: Spacing.four,
  },
  author: {
    fontFamily: FontFamily.semibold,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  reaction: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  actionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  replyBox: {
    gap: Spacing.two,
  },
});
