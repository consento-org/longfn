/**
 * Start with node --noexpose_wasm for tests without wasm implementation
 */
const longfn = require('..')
const longjs = require('long')
const sshuffle = require('secure-shuffle')

function fnImpl (result) {
  let a = longfn.fromInt(1234141)
  let b = longfn.fromInt(4141241)
  const FOUR = longfn.fromInt(4)
  const FIFTY_THREE = longfn.fromInt(53)
  const fnMax = longfn.fromInt(12341411234141)
  return () => {
    for (let i = 0; i < result.length; i += 2) {
      longfn.mul(longfn.xor(a, b, a), FOUR, a)
      if (longfn.ge(a, fnMax)) {
        longfn.div(a, FIFTY_THREE, a)
      }
      const tmp = a
      a = b
      b = tmp
      result[i] = a.low
      result[i + 1] = a.high
    }
  }
}

function jsImpl (result) {
  const jsMax = longjs.fromInt(12341411234141)
  let c = longjs.fromInt(1234141)
  let d = longjs.fromInt(4141241)
  return () => {
    for (let i = 0; i < result.length; i += 2) {
      let tmp = c.xor(d).mul(4)
      if (tmp.gte(jsMax)) {
        tmp = tmp.div(53)
      }
      c = d
      d = tmp
      result[i] = c.low
      result[i + 1] = c.high
    }
  }
}

const impls = {
  js: jsImpl,
  fn: fnImpl
}

function exec (name, size, ignore) {
  const buf = Buffer.alloc(size) // 32 MB
  const run = impls[name](new Uint32Array(buf))
  const start = Date.now()
  run()
  const end = Date.now()
  if (!ignore) {
    results[name] += (end - start)
  }
}

const results = {}
for (const name in impls) {
  results[name] = 0
  exec(name, 1024, true)
}
for (let i = 0; i < 3; i++) {
  for (const name of sshuffle(Object.keys(impls))) {
    exec(name, 1024 * 1024 * 32)
  }
}

for (const name in impls) {
  console.log(`${name}: ${results[name]}ms`)
}
