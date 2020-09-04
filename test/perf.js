/**
 * Start with node --noexpose_wasm for tests without wasm implementation
 */
const longfn = require('..')
const longjs = require('long')
const sshuffle = require('secure-shuffle')

// Creating a 32MB buffer to fill
const buf = Buffer.alloc(1024 * 1024 * 64)
const result = new Uint32Array(buf.buffer)

function fnImpl (result) {
  let a = longfn.fromInt(1234141)
  let b = longfn.fromInt(4141241)
  const FOUR = longfn.fromInt(4)
  const FIFTY_THREE = longfn.fromInt(53)
  const fnMax = longfn.fromInt(12341411234141)
  let count = 0
  return () => {
    for (let i = 0; i < result.length; i+=2) {
      longfn.mul(longfn.xor(a, b, a), FOUR, a)
      if (longfn.ge(a, fnMax)) {
        count += 1
        longfn.div(a, FIFTY_THREE, a)
      }
      const tmp = a
      a = b
      b = tmp
      result[i] = a.low
      result[i+1] = a.high
    }
  }
}

function jsImpl (arr) {
  const jsMax = longjs.fromInt(12341411234141)
  let c = longjs.fromInt(1234141)
  let d = longjs.fromInt(4141241)
  return () => {
    for (let i = 0; i < result.length; i+=2) {
      let tmp = c.xor(d).mul(4)
      if (tmp.gte(jsMax)) {
        tmp = tmp.div(53)
      }
      c = d
      d = tmp
      result[i] = c.low
      result[i+1] = c.high
    }
  }
}

const impls = {
  js: jsImpl,
  fn: fnImpl
}

let firstResult
for (const impl of sshuffle(Object.keys(impls))) {
  const buf = Buffer.alloc(1024 * 1024 * 32) // 32 MB
  const run = impls[impl](new Uint32Array(buf))
  const start = Date.now()
  run()
  const end = Date.now()
  console.log(`${impl}: ${end-start}ms`)
  if (firstResult === undefined) {
    firstResult = buf
  } else {
    console.log(`Same output? ${firstResult.equals(buf)}`)
  }
}

