import React, { useContext } from 'react';
import { act, render } from '@testing-library/react';

import { DispatchContext, StateContext } from '../../context';
import { CoolerArticleResource } from '__tests__/common';
import CacheProvider from '../CacheProvider';
import NetworkManager from '../../../state/NetworkManager';
import SubscriptionManager from '../../../state/SubscriptionManager';
import PollingSubscription from '../../../state/PollingSubscription';

describe('<CacheProvider />', () => {
  it('should not change dispatch function on re-render', () => {
    let dispatch;
    let count = 0;
    function DispatchTester() {
      dispatch = useContext(DispatchContext);
      count++;
      return null;
    }
    const chil = <DispatchTester />;
    const tree = <CacheProvider>{chil}</CacheProvider>;
    const { rerender } = render(tree);
    expect(dispatch).toBeDefined();
    const curDisp = dispatch;
    rerender(tree);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    rerender(<CacheProvider>{chil}</CacheProvider>);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    const managers = [
      new NetworkManager(),
      new SubscriptionManager(PollingSubscription),
    ];
    rerender(<CacheProvider managers={managers}>{chil}</CacheProvider>);
    expect(curDisp).toBe(dispatch);
    expect(count).toBe(1);
    rerender(
      <DispatchContext.Provider value={() => Promise.resolve()}>
        {chil}
      </DispatchContext.Provider>,
    );
    expect(curDisp).not.toBe(dispatch);
    expect(count).toBe(2);
  });
  it('should change state', () => {
    let dispatch: any, state;
    let count = 0;
    function ContextTester() {
      dispatch = useContext(DispatchContext);
      state = useContext(StateContext);
      count++;
      return null;
    }
    const chil = <ContextTester />;
    const tree = <CacheProvider>{chil}</CacheProvider>;
    render(tree);
    expect(dispatch).toBeDefined();
    expect(state).toBeDefined();
    const action = {
      type: 'rest-hooks/receive',
      payload: { id: 5, title: 'hi', content: 'more things here' },
      meta: {
        schema: CoolerArticleResource.getEntitySchema(),
        url: CoolerArticleResource.url({ id: 5 }),
        mutate: false,
        date: 50,
        expiresAt: 55,
      },
    };
    act(() => {
      dispatch(action);
    });
    expect(count).toBe(2);
    expect(state).toMatchSnapshot();
  });
});
