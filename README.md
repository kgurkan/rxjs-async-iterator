# Async iterators for RxJS

Adds async iterators (aka *[for-await-of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)* loops)

## Installation
The package is served via npm:
```
npm i --save rxjs-async-iterator
```

## Usage
```javascript
import {from} from 'rxjs';
import {delay} from 'rxjs/operators';
import {toAsyncIterable} from 'rxjs-async-iterator';

const numbers$ = from([1, 2, 3]).pipe(delay(100));

for async (const value of toAsyncIterable(numbers$)) {
    console.log(value);
}
```
