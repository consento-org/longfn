const longjs = require('long')
const longfn = require('.')

// long.js
const x = longjs.fromInt(2)
let outX = x
for (let i = 0; i < 20; i++) {
  outX = outX.mul(4)
}

console.log(outX) // Long { low: 0, high: 512, unsigned: false }

// longfn
const y = longfn.fromInt(2)
const mul = longfn.fromInt(4) // long.js hides the casting of 4 into a longjs instance, which is done for every operation!
const outY = longfn.clone(y)
for (let i = 0; i < 20; i++) {
  longfn.mul(outY, mul, outY) // note how there is no variable reassignment
}
// and the outY memory is just being reused

console.log(outY) // { low: 0, high: 512, unsigned: false }
