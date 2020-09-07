const TWO_PWR_16_DBL = 1 << 16
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL
const TWO_PWR_24_DBL = 1 << 24
const TWO_PWR_24 = fromInt(TWO_PWR_24_DBL)
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL
const TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2
const MIN_VALUE = Object.freeze({ low: 0 | 0, high: 0x80000000 | 0 })
const MAX_VALUE = Object.freeze({ low: 0xFFFFFFFF | 0, high: 0x7FFFFFFF | 0 })
const MAX_UNSIGNED_VALUE = Object.freeze({ low: 0xFFFFFFFF | 0, high: 0xFFFFFFFF | 0 })
const ONE = Object.freeze(fromInt(1))
const UONE = Object.freeze(fromInt(1, true))
const NEG_ONE = Object.freeze(fromInt(-1))
const ZERO = Object.freeze(fromInt(0))
const UZERO = Object.freeze(fromInt(0, true))

const TMP_COMPARE = fromInt(0)
const TMP_SUBTRACT = fromInt(0)
const TMP_NEGATE = fromInt(0)
const TMP_CONVERT_BUFFER = new ArrayBuffer(8)
const TMP_CONVERT_FLOAT = new Float64Array(TMP_CONVERT_BUFFER)
const TMP_CONVERT_INT = new Uint32Array(TMP_CONVERT_BUFFER)

const isLE = (function () {
  const arrayBuffer = new ArrayBuffer(2)
  const uint8Array = new Uint8Array(arrayBuffer)
  const uint16array = new Uint16Array(arrayBuffer)
  uint8Array[0] = 0xAA // set first byte
  uint8Array[1] = 0xBB // set second byte
  return uint16array[0] === 0xBBAA
})()

const powDbl = Math.pow // Used 4 times (4*8 to 15+4)

/**
 * wasm optimizations, to do native i64 multiplication and divide
 */
let wasm = null

try {
  // Ported from
  wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
    // WASM Binary to be inserted by build script
  ])), {}).exports
} catch (e) {
  // no wasm support :(
}

function fromInt (value, unsigned, target) {
  if (target === undefined || target === null) {
    target = { low: 0, high: 0, unsigned: unsigned }
  }
  if (unsigned) {
    value >>>= 0
    target.high = (value | 0) < 0 ? -1 : 0
  } else {
    value |= 0
    target.high = value < 0 ? -1 : 0
  }
  target.low = value
  target.unsigned = !!unsigned
  return target
}

function toNumber (long) {
  if (long.unsigned) {
    return ((long.high >>> 0) * TWO_PWR_32_DBL) + (long.low >>> 0)
  }
  return long.high * TWO_PWR_32_DBL + (long.low >>> 0)
}

function clone (long) {
  return copy(long, {})
}

function toInt (long) {
  return long.unsigned ? long.low >>> 0 : long.low
}

function isZero (long) {
  return long.low === 0 && long.high === 0
}

function isOdd (long) {
  return (long.low & 1) === 1
}

function isEven (long) {
  return (long.low & 1) === 0
}

function eq (a, b) {
  return a.high === b.high && a.low === b.low
}

function lt (a, b) {
  return compare(a, b) < 0
}

function le (a, b) {
  return compare(a, b) <= 0
}

function ge (a, b) {
  return compare(a, b) >= 0
}

function gt (a, b) {
  return compare(a, b) > 0
}

function isNegative (long) {
  return !long.unsigned && long.high < 0
}

function isPositive (long) {
  return long.unsigned || long.high >= 0
}

function fromFloatLE (float, target, unsigned) {
  TMP_CONVERT_FLOAT[0] = float
  target.low = TMP_CONVERT_INT[0]
  target.high = TMP_CONVERT_INT[1]
  target.unsigned = !!unsigned
  return target
}

function fromFloatBE (float, target, unsigned) {
  TMP_CONVERT_FLOAT[0] = float
  target.low = TMP_CONVERT_INT[0]
  target.high = TMP_CONVERT_INT[1]
  target.unsigned = !!unsigned
  return target
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L808-L843
function add (long, addend, target) {
  // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
  const a48 = long.high >>> 16
  const a32 = long.high & 0xFFFF
  const a16 = long.low >>> 16
  const a00 = long.low & 0xFFFF

  const b48 = addend.high >>> 16
  const b32 = addend.high & 0xFFFF
  const b16 = addend.low >>> 16
  const b00 = addend.low & 0xFFFF

  let c00 = a00 + b00
  let c16 = c00 >>> 16
  c00 &= 0xFFFF
  c16 += a16 + b16
  let c32 = c16 >>> 16
  c16 &= 0xFFFF
  c32 += a32 + b32
  let c48 = c32 >>> 16
  c32 &= 0xFFFF
  c48 += a48 + b48
  c48 &= 0xFFFF

  target.low = (c16 << 16) | c00
  target.high = (c48 << 16) | c32
  target.unsigned = !!long.unsigned
  return target
}

function not (long, target) {
  target.low = ~long.low
  target.high = ~long.high
  target.unsigned = !!long.unsigned
  return target
}

function xor (long, other, target) {
  target.low = long.low ^ other.low
  target.high = long.high ^ other.high
  target.unsigned = !!long.unsigned
  return target
}

function and (long, other, target) {
  target.low = long.low & other.low
  target.high = long.high & other.high
  target.unsigned = !!long.unsigned
  return target
}

function neg (long, target) {
  if (!long.unsigned && eq(long, MIN_VALUE)) {
    return copy(MIN_VALUE, target, false)
  }
  return add(not(long, TMP_NEGATE), ONE, target)
}

function sub (long, subtrahend, target) {
  return add(long, neg(subtrahend, TMP_SUBTRACT), target)
}

function compare (a, b) {
  if (eq(a, b)) {
    return 0
  }
  const aNeg = isNegative(a)
  const bNeg = isNegative(b)
  if (aNeg && !bNeg) {
    return -1
  }
  if (!aNeg && bNeg) {
    return 1
  }
  // At this point the sign bits are the same
  if (!a.unsigned) {
    return isNegative(sub(a, b, TMP_COMPARE)) ? -1 : 1
  }
  // Both are positive if at least one is unsigned
  return (b.high >>> 0) > (a.high >>> 0) || (b.high === a.high && (b.low >>> 0) > (a.low >>> 0)) ? -1 : 1
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L1157-L1172
function shr (long, numBits, target) {
  if ((numBits &= 63) === 0) {
    target.low = long.low
    target.high = long.high
  } else if (numBits < 32) {
    target.low = (long.low >>> numBits) | (long.high << (32 - numBits))
    target.high = long.high >> numBits
  } else {
    target.low = long.high >> (numBits - 32)
    target.high = long.high >= 0 ? 0 : -1
  }
  target.unsigned = !!long.unsigned
  return target
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L1207-L1219
function shru (long, numBits, target) {
  if ((numBits &= 63) === 0) {
    target.low = long.low
    target.high = long.high
  } else if (numBits < 32) {
    target.low = (long.low >>> numBits) | (long.high << (32 - numBits))
    target.high = long.high >>> numBits
  } else if (numBits === 32) {
    target.low = long.high
    target.high = 0
  } else {
    target.low = long.high >>> (numBits - 32)
    target.high = 0
  }
  target.unsigned = !!long.unsigned
  return target
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L1213-L1219
function shl (long, numBits, target) {
  if ((numBits &= 63) === 0) {
    target.low = long.low
    target.high = long.high
  } else if (numBits < 32) {
    target.low = long.low << numBits
    target.high = (long.high << numBits) | (long.low >>> (32 - numBits))
  } else {
    target.low = 0
    target.high = long.low << (numBits - 32)
  }
  target.unsigned = !!long.unsigned
  return target
}

// Ported from: https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L161-L178
function fromNumber (value, unsigned, target) {
  if (target === null || target === undefined) {
    target = { low: 0, high: 0, unsigned: unsigned }
  }
  if (isNaN(value)) {
    return copy(unsigned ? UZERO : ZERO, target)
  }
  if (unsigned) {
    if (value < 0) {
      return copy(UZERO, target)
    }
    if (value >= TWO_PWR_64_DBL) {
      return copy(MAX_UNSIGNED_VALUE, target)
    }
  } else {
    if (value <= -TWO_PWR_63_DBL) {
      return copy(MIN_VALUE, target)
    }
    if (value + 1 >= TWO_PWR_63_DBL) {
      return copy(MAX_VALUE, target)
    }
    if (value < 0) {
      return neg(fromNumber(-value, unsigned, target), target)
    }
  }
  target.low = (value % TWO_PWR_32_DBL) | 0
  target.high = (value / TWO_PWR_32_DBL) | 0
  target.unsigned = !!unsigned
  return target
}

function mulRaw (long, multiplier, target) {
  // If both longs are small, use float multiplication
  if (lt(long, TWO_PWR_24) && lt(multiplier, TWO_PWR_24)) {
    const numa = toNumber(long)
    const numb = toNumber(multiplier)
    const multiplied = numa * numb
    fromNumber(multiplied, long.unsigned, target)
    return target
  }

  // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
  // We can skip products that would overflow.

  const a48 = long.high >>> 16
  const a32 = long.high & 0xFFFF
  const a16 = long.low >>> 16
  const a00 = long.low & 0xFFFF

  const b48 = multiplier.high >>> 16
  const b32 = multiplier.high & 0xFFFF
  const b16 = multiplier.low >>> 16
  const b00 = multiplier.low & 0xFFFF

  let c00 = a00 * b00
  let c16 = c00 >>> 16
  c00 &= 0xFFFF
  c16 += a16 * b00
  let c32 = c16 >>> 16
  c16 &= 0xFFFF
  c16 += a00 * b16
  c32 += c16 >>> 16
  c16 &= 0xFFFF
  c32 += a32 * b00
  let c48 = c32 >>> 16
  c32 &= 0xFFFF
  c32 += a16 * b16
  c48 += c32 >>> 16
  c32 &= 0xFFFF
  c32 += a00 * b32
  c48 += c32 >>> 16
  c32 &= 0xFFFF
  c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48
  c48 &= 0xFFFF

  target.low = (c16 << 16) | c00
  target.high = (c48 << 16) | c32
  target.unsigned = !!long.unsigned
  return target
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L865-L940
const muljs = (function () {
  const TMP_MULTI1 = fromInt(0)
  const TMP_MULTI2 = fromInt(0)
  return function muljs (long, multiplier, target) {
    if (isZero(long) || isZero(multiplier)) {
      return copy(long.unsigned ? UZERO : ZERO, target)
    }

    if (eq(long, MIN_VALUE)) {
      copy(isOdd(multiplier) ? MIN_VALUE : ZERO, target)
      target.unsigned = !!long.unsigned
      return target
    }

    if (eq(multiplier, MIN_VALUE)) {
      copy(isOdd(long) ? MIN_VALUE : ZERO, target)
      target.unsigned = !!long.unsigned
      return target
    }

    if (isNegative(long)) {
      neg(long, TMP_MULTI1)
      if (isNegative(multiplier)) {
        neg(multiplier, TMP_MULTI2)
        mulRaw(TMP_MULTI1, TMP_MULTI2, target)
      } else {
        mulRaw(TMP_MULTI1, multiplier, TMP_MULTI2)
        neg(TMP_MULTI2, target)
      }
      return target
    }

    if (isNegative(multiplier)) {
      neg(multiplier, TMP_MULTI1)
      mulRaw(long, TMP_MULTI1, TMP_MULTI2)
      neg(TMP_MULTI2, target)
      return target
    }
    return mulRaw(long, multiplier, target)
  }
})()

function mulwasm (long, multiplier, target, _) {
  target.low = wasm.mul(long.low, long.high, multiplier.low, multiplier.high)
  target.high = wasm.get_high()
  target.unsigned = !!long.unsigned
  return target
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L957-L1062
const divjs = (function () {
  const rem2 = fromInt(0)
  const approxRes = fromInt(0)
  const approxRem = fromInt(0)
  return function divjs (long, divisor, target) {
    if (isZero(divisor)) {
      throw Error('division by zero')
    }
    if (isZero(long)) {
      return copy(long, target)
    }
    if (!long.unsigned) {
      // This section is only relevant for signed longs and is derived from the
      // closure library as a whole.
      if (eq(long, MIN_VALUE)) {
        if (eq(divisor, ONE) || eq(divisor, NEG_ONE)) {
          return copy(MIN_VALUE, target, false) // recall that -MIN_VALUE == MIN_VALUE
        }
        if (eq(divisor, MIN_VALUE)) {
          return copy(ONE, target, false)
        }
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        const halfThis = shr(long, 1, {})
        const approx = {}
        shl(divjs(halfThis, divisor, {}), 1, approx)
        if (eq(approx, ZERO)) {
          return copy(isNegative(divisor) ? ONE : NEG_ONE, target, false)
        }
        const rem1 = sub(long, muljs(divisor, approx, {}), {})
        return add(approx, divjs(rem1, divisor, {}), target)
      }
      if (eq(divisor, MIN_VALUE)) {
        return copy(ZERO, target)
      }
      if (isNegative(long)) {
        long = neg(long, {})
        if (isNegative(divisor)) {
          return divjs(long, neg(divisor, {}), target)
        }
        return neg(divjs(long, divisor, {}), target)
      }
      if (isNegative(divisor)) {
        return neg(divjs(long, neg(divisor, {}), {}), target)
      }
      copy(ZERO, target)
    } else {
      // The algorithm below has not been made for unsigned longs. It's therefore
      // required to take special care of the MSB prior to running it.
      if (!divisor.unsigned) {
        divisor = copy(divisor, {}, true)
      }
      if (gt(divisor, long)) {
        return copy(UZERO, target)
      }
      if (gt(divisor, shru(long, 1, {}))) { // 15 >>> 1 = 7 ; with divisor = 8 ; true
        return copy(UONE, target)
      }
      copy(UZERO, target)
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    copy(long, rem2)
    while (ge(rem2, divisor)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      let approx = Math.max(1, Math.floor(toNumber(rem2) / toNumber(divisor)))

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      const log2 = Math.ceil(Math.log(approx) / Math.LN2)
      const delta = (log2 <= 48) ? 1 : powDbl(2, log2 - 48)

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      fromNumber(approx, false, approxRes)
      muljs(approxRes, divisor, approxRem)
      while (isNegative(approxRem) || gt(approxRem, rem2)) {
        approx -= delta
        fromNumber(approx, long.unsigned, approxRes)
        muljs(approxRes, divisor, approxRem)
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      add(target, isZero(approxRes) ? ONE : approxRes, target)
      sub(rem2, approxRem, rem2)
    }
    return target
  }
})()

function divwasm (long, divisor, target) {
  if (isZero(divisor)) {
    throw Error('division by zero')
  }
  // guard against signed division overflow: the largest
  // negative number / -1 would be 1 larger than the largest
  // positive number, due to two's complement.
  if (
    !long.unsigned &&
    long.high === -0x80000000 &&
    divisor.low === -1 &&
    divisor.high === -1
  ) {
    // be consistent with non-wasm code path
    return copy(long, target)
  }
  target.low = (long.unsigned ? wasm.div_u : wasm.div_s)(
    long.low,
    long.high,
    divisor.low,
    divisor.high
  )
  target.high = wasm.get_high()
  target.unsigned = !!long.unsigned
  return target
}

function modwasm (long, divisor, target) {
  target.low = (long.unsigned ? wasm.rem_u : wasm.rem_s)(
    long.low,
    long.high,
    divisor.low,
    divisor.high
  )
  target.high = wasm.get_high()
  target.unsigned = !!long.unsigned
  return target
}

function modjs (long, divisor, target) {
  return sub(long, muljs(divjs(long, divisor, {}), divisor, {}), target)
}

function rotl (long, numBits, target) {
  if ((numBits &= 63) === 0) {
    return copy(long, target)
  }
  if (numBits === 32) {
    target.low = long.high
    target.high = long.low
  } else if (numBits < 32) {
    const b = 32 - numBits
    target.low = (long.low << numBits) | (long.high >>> b)
    target.high = (long.high << numBits) | (long.low >>> b)
  } else {
    numBits -= 32
    const b = 32 - numBits
    target.low = (long.high << numBits) | (long.low >>> b)
    target.high = (long.low << numBits) | (long.high >>> b)
  }
  target.unsigned = !!long.unsigned
  return target
}

function rotr (long, numBits, target) {
  if ((numBits &= 63) === 0) {
    return copy(long, target)
  }
  if (numBits === 32) {
    target.low = long.high
    target.high = long.low
  } else if (numBits < 32) {
    const b = 32 - numBits
    target.low = (long.high << b) | (long.low >>> numBits)
    target.high = (long.low << b) | (long.high >>> numBits)
  } else {
    numBits -= 32
    const b = 32 - numBits
    target.low = (long.low << b) | (long.high >>> numBits)
    target.high = (long.high << b) | (long.low >>> numBits)
  }
  target.unsigned = !!long.unsigned
  return target
}

function copy (source, target, forceUnsigned) {
  target.low = source.low
  target.high = source.high
  target.unsigned = forceUnsigned !== undefined ? forceUnsigned : !!source.unsigned
  return target
}

const mul = wasm ? mulwasm : muljs
const div = wasm ? divwasm : divjs
module.exports = Object.freeze({
  ZERO: ZERO,
  UZERO, UZERO,
  ONE: ONE,
  UONE: UONE,
  NEG_ONE: NEG_ONE,
  MAX_VALUE: MAX_VALUE,
  MIN_VALUE: MIN_VALUE,
  MAX_UNSIGNED_VALUE: MAX_UNSIGNED_VALUE,
  isZero: isZero,
  isNegative: isNegative,
  isPositive: isPositive,
  isOdd: isOdd,
  isEven: isEven,
  clone: clone,
  eq: eq,
  lt: lt,
  le: le,
  gt: gt,
  ge: ge,
  compare: compare,
  shr: shr,
  shru: shru,
  shl: shl,
  rotr: rotr,
  rotl: rotl,
  mul,
  div,
  mod: wasm ? modwasm : modjs,
  add: add,
  sub: sub,
  xor: xor,
  and: and,
  not: not,
  copy: copy,
  neg: neg,
  fromInt: fromInt,
  toNumber: toNumber,
  toInt: toInt,
  fromNumber: fromNumber,
  fromFloat: isLE ? fromFloatLE : fromFloatBE
})
