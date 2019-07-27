import {asyncScheduler, from, Observable, Observer, scheduled, Subscription, throwError} from 'rxjs';
import {delay} from 'rxjs/operators';
import {toAsyncIterable} from './to-async-iterable';

describe('toAsyncIterable', () => {

  const NUMBERS: number[] = [1, 2, 3];
  const NUMBER_OBSERVABLE: Observable<number> = from(NUMBERS);
  const TEST_ERROR = new Error('Test');

  describe('iteration', () => {

    it.each([
      ['sync', NUMBER_OBSERVABLE],
      ['async', scheduled(NUMBER_OBSERVABLE, asyncScheduler)],
      ['delayed', NUMBER_OBSERVABLE.pipe(delay(10))],
    ] as any)('should iterate %s observable', async (type: string, obs: Observable<number>) => {
      const collected: unknown[] = [];

      for await (const value of toAsyncIterable(obs)) {
        collected.push(value);
      }

      expect(collected).toEqual(NUMBERS);
    });

  });

  describe('abrupt completion', () => {

    it('should unsubscribe on break form for-async-of loop', async () => {
      const observable = wrapObservable(scheduled(NUMBER_OBSERVABLE, asyncScheduler));
      const iterable = toAsyncIterable(observable);

      // noinspection LoopStatementThatDoesntLoopJS
      for await (const value of iterable) {
        break;
      }

      expect(observable.unsubscribed).toBeTruthy();
    });

    it('should unsubscribe when error thrown from for-async-of loop', async () => {
      const observable = wrapObservable(scheduled(NUMBER_OBSERVABLE, asyncScheduler));

      try {
        // noinspection LoopStatementThatDoesntLoopJS
        for await (const value of toAsyncIterable(observable)) {
          // noinspection ExceptionCaughtLocallyJS
          throw TEST_ERROR;
        }
      } catch (e) {
        expect(e).toBe(TEST_ERROR);
        expect(observable.unsubscribed).toBeTruthy();
      }
    });

    it('should break loop if observable throws', async (done: jest.DoneCallback) => {
      const observable = wrapObservable(throwError(TEST_ERROR));

      try {
        for await (const value of toAsyncIterable(observable)) {
          done.fail('Should throw');
        }
      } catch (e) {
        expect(e).toBe(TEST_ERROR);
        expect(observable.unsubscribed).toBeTruthy();
        done();
      }
    });

  });

  it('should unsubscribe', async () => {
    let unsubscribed = false;
    const observable = new Observable<any>(() => {
      return () => unsubscribed = true;
    });

    const iterator = toAsyncIterable(observable)[Symbol.asyncIterator]();

    const result = await iterator.return();
    expect(unsubscribed).toBeTruthy();
    expect(result).toEqual({done: true});
  });

  it('should generate new iterator every time', async () => {
    const iterable = toAsyncIterable(NUMBER_OBSERVABLE);

    const iter1 = iterable[Symbol.asyncIterator]();
    const iter2 = iterable[Symbol.asyncIterator]();
    expect(iter1).not.toBe(iter2);
  });

  it('should immediately subscribe', async () => {
    let numSubscriptions = 0;
    const iterable = toAsyncIterable(new Observable<void>(() => {
      numSubscriptions++;
    }));
    expect(numSubscriptions).toBe(0);

    iterable[Symbol.asyncIterator]();
    iterable[Symbol.asyncIterator]();
    expect(numSubscriptions).toEqual(2);
  });

  /**
   * Wrap a source observable so the tests can easily check if subscriptions of observable are unsubscribed.
   * It is expected that returning observable will be subscribed only once.
   */
  function wrapObservable<T>(source: Observable<T>): Observable<T> & { unsubscribed: boolean } {
    let subscription: Subscription | null = null;
    const observable = new Observable((observer: Observer<T>) => {
      subscription = source.subscribe(observer);
      return () => subscription!.unsubscribe();
    });

    Object.defineProperty(observable, 'unsubscribed', {
      get: () => subscription && subscription.closed,
      enumerable: true,
      configurable: true,
    });

    return observable as any;
  }

});
