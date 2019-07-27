import {config} from 'rxjs';

export class PendingPromise<T> {

  static resolve<U>(promiseCtor?: PromiseConstructorLike): PendingPromise<U> {
    const pending = new PendingPromise<U>(promiseCtor);
    pending.settled = true;
    pending.resolveFn({done: true} as any);
    return pending;
  }

  static reject<U>(reason?: any, promiseCtor?: PromiseConstructorLike): PendingPromise<U> {
    return new PendingPromise<U>(promiseCtor).reject(reason);
  }

  readonly promise: Promise<IteratorResult<T>>;

  polled: boolean = false;
  settled: boolean = false;

  private resolveFn!: (value?: IteratorResult<T> | PromiseLike<IteratorResult<T>>) => void;
  private rejectFn!: (reason?: any) => void;

  constructor(promiseCtor?: PromiseConstructorLike) {
    promiseCtor = promiseCtor || config.Promise || Promise;

    if (!promiseCtor) {
      throw new Error('Promises are not supported!');
    }

    this.promise = new promiseCtor<IteratorResult<T>>((resolve, reject) => {
      this.resolveFn = resolve;
      this.rejectFn = reject;
    }) as any;
  }

  resolve(value: T): this {
    this.settled = true;
    this.resolveFn({done: false, value});
    return this;
  }

  reject(reason?: any): this {
    this.settled = true;
    this.rejectFn(reason);
    return this;
  }

}
