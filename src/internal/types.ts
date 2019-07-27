
export interface ObservableAsyncIterable<T> extends AsyncIterable<T> {
  [Symbol.asyncIterator](): ObservableAsyncIterator<T>;
}

export interface ObservableAsyncIterator<T> extends AsyncIterator<T> {
  next(value?: any): Promise<IteratorResult<T>>;
  return(value?: any): Promise<IteratorResult<T>>;
}
