# longfn

Longfn is an adaptation of [`long.js`](https://github.com/dcodeIO/long.js#readme)
which is functional and faster because of it.

## Usage

```javascript
const { fromInt, mul } = require('longfn')

const result = fromInt(0)
const base = fromInt(2)
const multiplier = fromInt(3)
mul(base, multiplier, result)

console.log(result) // { low: 6, high: 0, unsigned: false }
```

## Rationale

`long.js` has done an amazing job providing 64bit integer operations in
the 32bit environment of JavaScript, but we noticed that the performance
could be improved.

The `long.js` library and google libraries require the use of class instances
for operations `base = new Long(1, 0)` and they require that the instances are
immutable `result = base.mul(multiplier)` which means that at least three instances
need to be created for every multiplication operation. A closer look at the
implementation reveals that several instances might be created and sent to the
garbage collector in the process of one operation. Causing significant instantiation
and gc overhead.

`longfn` optimizes on `long.js` by trading developer comfort for speed. The API
forces the user to think about memory allocation and in exchanges offers flexibility
in the api use:

```javascript
// long.js
const x = longjs.fromInt(2)
let outX = x
for (let i = 0; i < 20; i++) {
  outX = outX.mul(4)
}

console.log(outX)

// longfn
const y = longfn.fromInt(2)
const mul = longfn.fromInt(4) // long.js hides the casting of 4 into a longjs instance, which is done for every operation!
const outY = longfn.clone(y)
for (let i = 0; i < 20; i++) {
  longfn.mul(outY, mul, outY) // note how there is no variable reassignment
}
// and the outY memory is just being reused

console.log(outY) // { low: 0, high: 512, unsigned: false }
```

In this simple example, `long.js` created **38 temporary instances** of `Long`, while the `longfn`
example create **no** temporary instance for this operation!

This should result in a more stable and predictable runtime behavior in games or
crypto applications.

In pratice this resulted in a noticable gain ~30% of `longfn` over `long.js` when wasm is available
but a massive **~500% gain** when wasm isnt available!

## State

Currently longfn is in its first release state, with feature parity with `long.js` and all tests 
of longjs are passing! We are aware that there are several things that should/could be better
tested and we welcome more tests and praxis reports.

Please let us know if you find a case where this library does not work for you!

## API

See [the TypeScript definition](./index.d.ts) for the available functions.

## Background

The ECMA-262 11th Edition _does_ support [BigInt](https://github.com/tc39/proposal-bigint) numbers, but these
are of arbitrary size/length. When trying to port an algorithm written in (u)int64 numbers it might be a good
idea to still have a comparable implementation (such as this) handy.

With [Webassembly](https://en.wikipedia.org/wiki/WebAssembly)(wasm) becoming a reality in 2017, it has become easier/
possible to write (u)int64 implementations with JavaScript. But while wasm has been deployed on several
platforms, it has yet to reach many minor environments (like [React-Native](https://react-native.canny.io/feature-requests/p/support-wasmwebassembly)).

As of ECMA-262 5th Edition, "all the positive and negative integers whose magnitude is no greater than 253 are representable in the Number type", which is "representing the doubleprecision 64-bit format IEEE 754 values as specified in the IEEE Standard for Binary Floating-Point Arithmetic". The maximum safe integer in JavaScript is 253-1.

Example: 264-1 is 18446744073709551615 but in JavaScript it evaluates to 18446744073709552000.

Furthermore, bitwise operators in JavaScript "deal only with integers in the range −231 through 231−1, inclusive, or in the range 0 through 232−1, inclusive. These operators accept any value of the Number type but first convert each such value to one of 232 integer values."

In some use cases, however, it is required to be able to reliably work with and perform bitwise operations on the full 64 bits. This is where long.js comes into play.

## License

[APL](./LICENSE)

Note: This library has been heavily ported from [`dcodeIO/long.js`](https://github.com/dcodeIO/long.js)
which has also be published under the APL. It also modifies and adapts code - particularly tests - from [`googles long library`](https://google.github.io/closure-library/api/goog.math.Long.html).
