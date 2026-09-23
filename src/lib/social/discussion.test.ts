import { describe, expect, it } from 'vitest';

import { buildThreads, parseComments, type ReactionRow } from './discussion.ts';

const comments = parseComments([
  {
    id: 'top',
    user_id: 'fan-1',
    match_id: 'match-1',
    match_event_id: null,
    parent_comment_id: null,
    content: 'Come on Chelsea',
    created_at: '2026-09-18T19:10:00.000Z',
    author: { display_name: 'Daniel' },
  },
  {
    id: 'reply',
    user_id: 'fan-2',
    match_id: 'match-1',
    match_event_id: null,
    parent_comment_id: 'top',
    content: 'Need a goal',
    created_at: '2026-09-18T19:12:00.000Z',
    author: { display_name: 'Alex' },
  },
  {
    id: 'event',
    user_id: 'fan-1',
    match_id: 'match-1',
    match_event_id: 'goal-1',
    parent_comment_id: null,
    content: 'What a strike',
    created_at: '2026-09-18T19:40:00.000Z',
    author: { display_name: 'Daniel' },
  },
]);

const reactions: ReactionRow[] = [
  {
    userId: 'fan-1',
    commentId: 'top',
    matchEventId: null,
    type: 'heart',
  },
  {
    userId: 'fan-2',
    commentId: 'top',
    matchEventId: null,
    type: 'heart',
  },
];

describe('match discussion', () => {
  it('nests replies and keeps event comments separate', () => {
    const threads = buildThreads(comments, reactions, 'fan-1', null);

    expect(threads).toHaveLength(1);
    expect(threads[0]?.replies.map((reply) => reply.content)).toEqual([
      'Need a goal',
    ]);
    expect(threads[0]?.reactions[0]).toEqual({
      type: 'heart',
      count: 2,
      reacted: true,
    });
    expect(
      buildThreads(comments, reactions, 'fan-2', 'goal-1')[0]?.content,
    ).toBe('What a strike');
  });
});
