import {Observable, Subscription} from 'rxjs';
import {PendingPromise} from './pending-promise';
import {ObservableAsyncIterator} from './types';

export class ObservableAsyncIteratorImpl<T> implements ObservableAsyncIterator<T> {

  private pendingPromises: Array<PendingPromise<T>> = [];
  private subscription = new Subscription();

  constructor(obs: Observable<T>, private readonly PromiseCtor?: PromiseConstructorLike) {
    const subscription = obs.subscribe({
      next: (value: T) => this.settlePending('resolve', value),
      error: (error: any) => this.settlePending('reject', error),
      complete: () => {
        this.subscription.unsubscribe();
        this.pendingPromises.push(PendingPromise.resolve<T>(this.PromiseCtor));
      },
    });

    this.subscription.add(subscription);
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }

  next(): Promise<IteratorResult<T>> {
    const pending = this.poll();
    this.discardIfNeeded(pending);
    return pending.promise;
  }

  return(): Promise<IteratorResult<T>> {
    this.subscription.unsubscribe();
    this.pendingPromises = [];
    return PendingPromise.resolve<T>(this.PromiseCtor).promise;
  }

  private poll(): PendingPromise<T> {
    const pending = this.pendingPromises[0] || this.queue();
    pending.polled = true;
    return pending;
  }

  private queue(): PendingPromise<T> {
    const pending = new PendingPromise<T>(this.PromiseCtor);
    this.pendingPromises.push(pending);
    return pending;
  }

  private settlePending(method: 'resolve' | 'reject', value: any): void {
    const {pendingPromises} = this;
    const lastPending = pendingPromises[pendingPromises.length - 1];
    const pending = lastPending && !lastPending.settled ? lastPending : this.queue();
    this.discardIfNeeded(pending[method](value));
  }

  private discardIfNeeded(pending: PendingPromise<T>): void {
    if (pending.settled && pending.polled) {
      const index = this.pendingPromises.indexOf(pending);
      this.pendingPromises.splice(index, 1);
    }
  }

}
