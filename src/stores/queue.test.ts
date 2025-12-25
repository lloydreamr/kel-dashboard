import { beforeEach, describe, expect, it } from 'vitest';

import { useQueueStore } from './queue';

describe('useQueueStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useQueueStore.setState({
      expandedCardId: null,
      draftResponses: {},
    });
  });

  describe('expandCard', () => {
    it('sets expandedCardId', () => {
      useQueueStore.getState().expandCard('card-1');
      expect(useQueueStore.getState().expandedCardId).toBe('card-1');
    });

    it('replaces previously expanded card', () => {
      useQueueStore.getState().expandCard('card-1');
      useQueueStore.getState().expandCard('card-2');
      expect(useQueueStore.getState().expandedCardId).toBe('card-2');
    });
  });

  describe('collapseCard', () => {
    it('sets expandedCardId to null', () => {
      useQueueStore.getState().expandCard('card-1');
      useQueueStore.getState().collapseCard();
      expect(useQueueStore.getState().expandedCardId).toBeNull();
    });
  });

  describe('toggleCard', () => {
    it('expands collapsed card', () => {
      useQueueStore.getState().toggleCard('card-1');
      expect(useQueueStore.getState().expandedCardId).toBe('card-1');
    });

    it('collapses expanded card', () => {
      useQueueStore.getState().expandCard('card-1');
      useQueueStore.getState().toggleCard('card-1');
      expect(useQueueStore.getState().expandedCardId).toBeNull();
    });

    it('switches to different card', () => {
      useQueueStore.getState().expandCard('card-1');
      useQueueStore.getState().toggleCard('card-2');
      expect(useQueueStore.getState().expandedCardId).toBe('card-2');
    });
  });

  describe('draftResponses', () => {
    it('sets draft response with timestamp', () => {
      const before = Date.now();
      useQueueStore.getState().setDraftResponse('q-1', {
        decision_type: 'approved',
      });
      const after = Date.now();

      const draft = useQueueStore.getState().draftResponses['q-1'];
      expect(draft?.decision_type).toBe('approved');
      expect(draft?.lastModified).toBeGreaterThanOrEqual(before);
      expect(draft?.lastModified).toBeLessThanOrEqual(after);
    });

    it('merges draft updates', () => {
      useQueueStore.getState().setDraftResponse('q-1', {
        decision_type: 'approved_with_constraint',
      });
      useQueueStore.getState().setDraftResponse('q-1', {
        constraints: [{ type: 'budget' }],
      });

      const draft = useQueueStore.getState().draftResponses['q-1'];
      expect(draft?.decision_type).toBe('approved_with_constraint');
      expect(draft?.constraints).toEqual([{ type: 'budget' }]);
    });

    it('clears specific draft', () => {
      useQueueStore.getState().setDraftResponse('q-1', { decision_type: 'approved' });
      useQueueStore.getState().setDraftResponse('q-2', { decision_type: 'approved' });
      useQueueStore.getState().clearDraftResponse('q-1');

      expect(useQueueStore.getState().draftResponses['q-1']).toBeUndefined();
      expect(useQueueStore.getState().draftResponses['q-2']).toBeDefined();
    });

    it('clears all drafts', () => {
      useQueueStore.getState().setDraftResponse('q-1', { decision_type: 'approved' });
      useQueueStore.getState().setDraftResponse('q-2', { decision_type: 'approved' });
      useQueueStore.getState().clearAllDrafts();

      expect(useQueueStore.getState().draftResponses).toEqual({});
    });
  });
});
