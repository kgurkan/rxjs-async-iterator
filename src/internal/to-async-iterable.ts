import {Observable} from 'rxjs';
import {ObservableAsyncIteratorImpl} from './iterator';
import {ObservableAsyncIterable} from './types';

export function toAsyncIterable<T>(
  obs: Observable<T>,
  promiseCtor?: PromiseConstructorLike,
): ObservableAsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return new ObservableAsyncIteratorImpl(obs, promiseCtor);
    },
  };
}
