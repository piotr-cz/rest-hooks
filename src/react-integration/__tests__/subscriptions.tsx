import React, { Suspense } from 'react';
import { cleanup, renderHook, act } from 'react-hooks-testing-library';

import nock from 'nock';

import { PollingArticleResource } from '../../__tests__/common';
import { useSubscription, useCache } from '../hooks';
import createRenderRestHook from '../../test/helper';
import {
  makeRestProvider,
  makeExternalCacheProvider,
} from '../../test/providers';

afterEach(cleanup);

for (const makeProvider of [makeRestProvider, makeExternalCacheProvider]) {
  describe(`${makeProvider.name} with subscriptions`, () => {
    const articlePayload = {
      id: 5,
      title: 'hi ho',
      content: 'whatever',
      tags: ['a', 'best', 'react'],
    };
    let renderRestHook: ReturnType<typeof createRenderRestHook>;

    function onError(e: any) {
      e.preventDefault();
    }
    beforeEach(() => {
      window.addEventListener('error', onError);
    });
    afterEach(() => {
      window.removeEventListener('error', onError);
    });

    beforeEach(() => {
      nock('http://test.com')
        .get(`/article/${articlePayload.id}`)
        .reply(200, articlePayload);
      renderRestHook = createRenderRestHook(makeProvider);
    });
    afterEach(() => {
      renderRestHook.cleanup();
    });

    it('useSubscription() + useCache()', async () => {
      jest.useFakeTimers();
      const frequency: number = (PollingArticleResource.singleRequest()
        .options as any).pollFrequency;

      const { result, waitForNextUpdate } = renderRestHook(() => {
        useSubscription(PollingArticleResource.singleRequest(), articlePayload);
        return useCache(PollingArticleResource.singleRequest(), articlePayload);
      });

      // should be null to start
      expect(result.current).toBeNull();
      // should be defined after frequency milliseconds
      jest.advanceTimersByTime(frequency);
      await waitForNextUpdate();
      expect(result.current).toBeInstanceOf(PollingArticleResource);
      expect(result.current).toEqual(
        PollingArticleResource.fromJS(articlePayload),
      );
      // should update again after frequency
      nock('http://test.com')
        .get(`/article/${articlePayload.id}`)
        .reply(200, { ...articlePayload, title: 'fiver' });
      jest.advanceTimersByTime(frequency);
      await waitForNextUpdate();
      expect((result.current as any).title).toBe('fiver');
    });
  });
}