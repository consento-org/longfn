const TWO_PWR_16_DBL = 1 << 16
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL
const TWO_PWR_24_DBL = 1 << 24
const TWO_PWR_24 = fromInt(TWO_PWR_24_DBL)
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL
const TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2
const MIN_VALUE = Object.freeze(fromBits(0, 0x80000000))
const MAX_VALUE = Object.freeze(fromBits(0xFFFFFFFF, 0x7FFFFFFF))
const MAX_UNSIGNED_VALUE = Object.freeze(fromBits(0xFFFFFFFF, 0xFFFFFFFF, true))
const ONE = Object.freeze(fromInt(1))
const UONE = Object.freeze(fromInt(1, true))
const NEG_ONE = Object.freeze(fromInt(-1))
const ZERO = Object.freeze(fromInt(0))
const UZERO = Object.freeze(fromInt(0, true))
const isLE = new Uint16Array(new Uint8Array([0xAA, 0xBB]).buffer)[0] === 0xBBAA

const powDbl = Math.pow // Used 4 times (4*8 to 15+4)

function fromBits (low, high, unsigned, target) {
  if (target === undefined || target === null) {
    return {
      low: low | 0,
      high: high | 0,
      unsigned: !!unsigned
    }
  }
  target.low = low | 0
  target.high = high | 0
  target.unsigned = !!unsigned
  return target
}

function fromInt (value, unsigned, target) {
  let high
  if (unsigned) {
    value >>>= 0
    high = ((value | 0) < 0 ? -1 : 0) | 0
  } else {
    value |= 0
    high = (value < 0 ? -1 : 0) | 0
  }
  return fromBits(value, high, unsigned, target)
}

function noBigInt () {
  throw new Error('BigInt is not supported on this platform.')
}

const fromBigInt = typeof BigInt === 'undefined'
  ? noBigInt
  : (function () {
      const N0 = BigInt(0)
      const N1 = BigInt(1)
      const NN1 = BigInt(-1)
      const NTWO_PWR_32_DBL = BigInt(TWO_PWR_32_DBL)
      const NTWO_PWR_64_DBL = BigInt(TWO_PWR_64_DBL)
      const NTWO_PWR_63_DBL = BigInt(TWO_PWR_63_DBL)
      return function fromBigInt (value, unsigned, target) {
        if (target === null || target === undefined) {
          target = { low: 0 | 0, high: 0 | 0, unsigned: false }
        }
        if (unsigned) {
          if (value < N0) {
            return copy(UZERO, target)
          }
          if (value >= NTWO_PWR_64_DBL) {
            return copy(MAX_UNSIGNED_VALUE, target)
          }
        } else {
          if (value <= -NTWO_PWR_63_DBL) {
            return copy(MIN_VALUE, target)
          }
          if (value + N1 >= NTWO_PWR_63_DBL) {
            return copy(MAX_VALUE, target)
          }
          if (value < N0) {
            return neg(fromBigInt(value * NN1, unsigned, target), target)
          }
        }
        return fromBits(
          Number(value % NTWO_PWR_32_DBL),
          Number(value / NTWO_PWR_32_DBL),
          unsigned,
          target
        )
      }
    })()

// Ported from: https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L161-L178
function fromNumber (value, unsigned, target) {
  if (target === null || target === undefined) {
    target = { low: 0 | 0, high: 0 | 0, unsigned: false }
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

function fromValue (value, unsigned, target) {
  if (typeof unsigned === 'object' && unsigned !== null) {
    return fromValue(value, undefined, unsigned)
  }
  if (typeof value === 'bigint') {
    return fromBigInt(value, unsigned, target)
  }
  if (typeof value === 'number') {
    return fromNumber(value, unsigned, target)
  }
  if (typeof value === 'string') {
    return fromString(value, unsigned, undefined, target)
  }
  if (value === null || value === undefined || value === false) {
    return copy(
      unsigned ? UZERO : ZERO,
      target || fromInt(0)
    )
  }
  if (value === true) {
    return copy(
      unsigned ? UONE : ONE,
      target || fromInt(0)
    )
  }
  if (value.buffer instanceof ArrayBuffer) {
    return fromBytes(value, unsigned, target)
  }
  if (Array.isArray(value)) {
    return fromBits(value[0], value[1], typeof unsigned === 'boolean' ? unsigned : value[2], target)
  }
  return fromBits(value.low, value.high, typeof unsigned === 'boolean' ? unsigned : value.unsigned, target)
}

function toNumber (long) {
  if (long.unsigned) {
    return ((long.high >>> 0) * TWO_PWR_32_DBL) + (long.low >>> 0)
  }
  return long.high * TWO_PWR_32_DBL + (long.low >>> 0)
}

function toBytesLE (long, offset, target) {
  if (offset && offset.buffer) {
    return toBytesLE(long, target, offset)
  }
  const i = offset || 0
  let out
  if (!target) {
    target = new Uint8Array(i + 8)
    out = target
  } else if (!(target instanceof Uint8Array)) {
    out = new Uint8Array(target.buffer, target.byteOffset, target.byteLength)
  } else {
    out = target
  }
  const hi = long.high
  const lo = long.low
  out[i] = lo & 0xff
  out[i + 1] = lo >>> 8 & 0xff
  out[i + 2] = lo >>> 16 & 0xff
  out[i + 3] = lo >>> 24
  out[i + 4] = hi & 0xff
  out[i + 5] = hi >>> 8 & 0xff
  out[i + 6] = hi >>> 16 & 0xff
  out[i + 7] = hi >>> 24
  return target
}

function fromBytesLE (source, unsigned, offset, target) {
  if (typeof offset === 'object') {
    return fromBytesLE(source, unsigned, 0, offset)
  }
  if (typeof unsigned === 'number') {
    return fromBytesLE(source, undefined, unsigned, offset)
  }
  if (target === null || target === undefined) {
    target = { low: 0 | 0, high: 0 | 0, unsigned: unsigned }
  }
  if (!(source instanceof Uint8Array)) {
    source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
  }
  const i = offset || 0
  return fromBits(
    source[i] |
    source[i + 1] << 8 |
    source[i + 2] << 16 |
    source[i + 3] << 24,
    source[i + 4] |
    source[i + 5] << 8 |
    source[i + 6] << 16 |
    source[i + 7] << 24,
    unsigned,
    target
  )
}

const fromBytes = isLE ? fromBytesLE : fromBytesBE

function toBytesBE (long, offset, target) {
  if (offset && offset.buffer) {
    return toBytesBE(long, target, offset)
  }
  const i = offset || 0
  let out
  if (!target) {
    target = new Uint8Array(i + 8)
    out = target
  } else if (!(target instanceof Uint8Array)) {
    out = new Uint8Array(target.buffer, target.byteOffset, target.byteLength)
  } else {
    out = target
  }
  const hi = long.high
  const lo = long.low
  out[i] = hi >>> 24
  out[i + 1] = hi >>> 16 & 0xff
  out[i + 2] = hi >>> 8 & 0xff
  out[i + 3] = hi & 0xff
  out[i + 4] = lo >>> 24
  out[i + 5] = lo >>> 16 & 0xff
  out[i + 6] = lo >>> 8 & 0xff
  out[i + 7] = lo & 0xff
  return target
}

function fromBytesBE (source, unsigned, offset, target) {
  if (typeof offset === 'object') {
    return fromBytesBE(source, unsigned, 0, offset)
  }
  if (typeof unsigned === 'number') {
    return fromBytesBE(source, undefined, unsigned, offset)
  }
  if (target === null || target === undefined) {
    target = { low: 0 | 0, high: 0 | 0, unsigned: unsigned }
  }
  if (!(source instanceof Uint8Array)) {
    source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
  }
  const i = offset || 0
  return fromBits(
    source[i + 4] << 24 |
    source[i + 5] << 16 |
    source[i + 6] << 8 |
    source[i + 7],
    source[i] << 24 |
    source[i + 1] << 16 |
    source[i + 2] << 8 |
    source[i + 3],
    unsigned,
    target
  )
}

const toString = (function () {
  const TMP_NEG = fromInt(0)
  const radixLong = fromInt(0)
  const tmpDiv = fromInt(0)
  const rem1 = fromInt(0)
  const TMP_REM2 = fromInt(0)
  const TMP_RADIX_POW = fromInt(0)
  const TMP_REMDIV = fromInt(0)
  const TMP_INTVAL = fromInt(0)
  // Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L480-L516
  return function toString (long, radix) {
    if (radix === undefined || radix === null || radix === 0 || radix === false) {
      radix = 10
    } else if (typeof radix === 'string') {
      radix = parseInt(radix, 10)
    }
    if (radix < 2 || radix > 36) {
      throw new RangeError(`Radix between 2 and 36 expected, got: ${radix}`)
    }
    if (isZero(long)) {
      return '0'
    }
    if (isNegative(long)) { // Unsigned Longs are never negative
      if (eq(long, MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        fromNumber(radix, false, radixLong)
        div(long, radixLong, tmpDiv)
        mul(tmpDiv, radixLong, rem1)
        sub(rem1, long, rem1)
        return toString(tmpDiv, radix) + toInt(rem1).toString(radix)
      } else {
        return '-' + toString(neg(long, TMP_NEG), radix)
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    fromNumber(powDbl(radix, 6), long.unsigned, TMP_RADIX_POW)
    copy(long, TMP_REM2)
    let result = ''
    while (true) {
      div(TMP_REM2, TMP_RADIX_POW, TMP_REMDIV)
      mul(TMP_REMDIV, TMP_RADIX_POW, TMP_INTVAL)
      const intval = toInt(sub(TMP_REM2, TMP_INTVAL, TMP_INTVAL)) >>> 0
      let digits = intval.toString(radix)
      copy(TMP_REMDIV, TMP_REM2)
      if (isZero(TMP_REM2)) {
        return digits + result
      } else {
        while (digits.length < 6) {
          digits = '0' + digits
        }
        result = '' + digits + result
      }
    }
  }
})()

function toInt (long) {
  return long.unsigned ? long.low >>> 0 : long.low
}

const toBigInt = typeof BigInt === 'undefined'
  ? noBigInt
  : (function () {
      const NTWO_PWR_32_DBL = BigInt(TWO_PWR_32_DBL)
      const NBASE = BigInt(0x80000000) * 2n
      const NN1 = BigInt(-1)
      const tmp = fromInt(0)
      return function toBigInt (long) {
        if (isNegative(long)) {
          return toBigInt(neg(long, tmp)) * NN1
        }
        const low = long.low < 0 ? NBASE + BigInt(long.low) : BigInt(long.low)
        const value = BigInt(long.high) * NTWO_PWR_32_DBL + low
        if (long.unsigned) {
          return BigInt.asUintN(64, value)
        }
        return BigInt.asIntN(64, value)
      }
    })()

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
  if (!a.unsigned !== !b.unsigned && (a.high >>> 31) === 1 && (b.high >>> 31) === 1) {
    return false
  }
  return a.high === b.high && a.low === b.low
}

function ne (a, b) {
  return !eq(a, b)
}

function lt (long, greater) {
  return compare(long, greater) < 0
}

function le (long, sameOrGreater) {
  return compare(long, sameOrGreater) <= 0
}

function ge (long, sameOrLesser) {
  return compare(long, sameOrLesser) >= 0
}

function gt (long, lesser) {
  return compare(long, lesser) > 0
}

function isNegative (long) {
  return !long.unsigned && long.high < 0
}

function isPositive (long) {
  return long.unsigned || long.high >= 0
}

const fromFloat = (function () {
  const buffer = new ArrayBuffer(8)
  const floatIn = new Float64Array(buffer)
  const intOut = new Uint32Array(buffer)

  if (isLE) {
    return function fromFloatLE (float, target, unsigned) {
      if (target === null || target === undefined) {
        target = { low: 0 | 0, high: 0 | 0, unsigned: unsigned }
      }
      floatIn[0] = float
      target.low = intOut[0]
      target.high = intOut[1]
      target.unsigned = !!unsigned
      return target
    }
  }
  return function fromFloatBE (float, target, unsigned) {
    if (target === null || target === undefined) {
      target = { low: 0 | 0, high: 0 | 0, unsigned: unsigned }
    }
    floatIn[0] = float
    target.low = intOut[1]
    target.high = intOut[0]
    target.unsigned = !!unsigned
    return target
  }
})()

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

function or (long, other, target) {
  target.low = long.low | other.low
  target.high = long.high | other.high
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

const neg = (function () {
  const tmp = fromInt(0)
  return function neg (long, target) {
    if (!long.unsigned && eq(long, MIN_VALUE)) {
      return copy(MIN_VALUE, target, false)
    }
    return add(not(long, tmp), ONE, target)
  }
})()

const sub = (function () {
  const tmp = fromInt(0)
  return function sub (long, subtrahend, target) {
    return add(long, neg(subtrahend, tmp), target)
  }
})()

const compare = (function () {
  const tmp = fromInt(0)
  return function compare (a, b) {
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
      return isNegative(sub(a, b, tmp)) ? -1 : 1
    }
    // Both are positive if at least one is unsigned
    return (b.high >>> 0) > (a.high >>> 0) || (b.high === a.high && (b.low >>> 0) > (a.low >>> 0)) ? -1 : 1
  }
})()

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
const mul = (function () {
  const TMP_MULTI1 = fromInt(0)
  const TMP_MULTI2 = fromInt(0)
  return function mul (long, multiplier, target) {
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

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L957-L1062
const div = (function () {
  const rem = fromInt(0)
  const approxRes = fromInt(0)
  const approxRem = fromInt(0)
  const negLong = fromInt(0)
  const negDivisor = fromInt(0)
  const unsignedDivisor = fromInt(0)
  const halfUnsigned = fromInt(0)
  return function div (long, divisor, target) {
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
        shl(div(halfThis, divisor, {}), 1, approx)
        if (eq(approx, ZERO)) {
          return copy(isNegative(divisor) ? ONE : NEG_ONE, target, false)
        }
        sub(long, mul(divisor, approx, target), target)
        return add(approx, div(target, divisor, target), target)
      }
      if (eq(divisor, MIN_VALUE)) {
        return copy(ZERO, target)
      }
      if (isNegative(long)) {
        long = neg(long, negLong)
        if (isNegative(divisor)) {
          return div(long, neg(divisor, negDivisor), target)
        }
        return neg(div(long, divisor, target), target)
      }
      if (isNegative(divisor)) {
        return neg(div(long, neg(divisor, negDivisor), target), target)
      }
      copy(ZERO, target)
    } else {
      // The algorithm below has not been made for unsigned longs. It's therefore
      // required to take special care of the MSB prior to running it.
      if (!divisor.unsigned) {
        divisor = copy(divisor, unsignedDivisor, true)
      }
      if (gt(divisor, long)) {
        return copy(UZERO, target)
      }
      if (gt(divisor, shru(long, 1, halfUnsigned))) { // 15 >>> 1 = 7 ; with divisor = 8 ; true
        return copy(UONE, target)
      }
      copy(UZERO, target)
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    copy(long, rem)
    while (ge(rem, divisor)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      let approx = Math.max(1, Math.floor(toNumber(rem) / toNumber(divisor)))

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      const log2 = Math.ceil(Math.log(approx) / Math.LN2)
      const delta = (log2 <= 48) ? 1 : powDbl(2, log2 - 48)

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      fromNumber(approx, false, approxRes)
      mul(approxRes, divisor, approxRem)
      while (isNegative(approxRem) || gt(approxRem, rem)) {
        approx -= delta
        fromNumber(approx, long.unsigned, approxRes)
        mul(approxRes, divisor, approxRem)
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      add(target, isZero(approxRes) ? ONE : approxRes, target)
      sub(rem, approxRem, rem)
    }
    return target
  }
})()

const mod = (function () {
  const tmp = fromInt(0)
  return function modjs (long, divisor, target) {
    div(long, divisor, tmp)
    mul(tmp, divisor, tmp)
    return sub(long, tmp, target)
  }
})()

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
  target.low = source.low | 0
  target.high = source.high | 0
  target.unsigned = forceUnsigned !== undefined ? forceUnsigned : !!source.unsigned
  return target
}

let RADIX_DIGITS
function getDigitsByRadix (radix) {
  if (RADIX_DIGITS === undefined) {
    RADIX_DIGITS = {}
    for (let radix = 2; radix <= 36; radix++) {
      const radixLng = fromInt(radix, true)
      const digitsByPos = []
      let multi = fromInt(1, true)
      let prev = fromInt(0, true)
      for (let pos = 0; gt(multi, prev); pos++) {
        const lookup = {}
        digitsByPos.push(lookup)
        for (let digit = 1; digit < radix; digit++) {
          const num = fromInt(digit, true)
          lookup[digit.toString(radix)] = mul(num, multi, num)
        }
        const tmp = prev
        prev = multi
        multi = mul(multi, radixLng, tmp)
      }
      RADIX_DIGITS[radix] = digitsByPos
    }
  }
  return RADIX_DIGITS[radix]
}

// Ported from https://github.com/dcodeIO/long.js/blob/ce11b4b2bd3ba1240a057d62018563d99db318f9/src/long.js#L227-L268
function fromString (str, unsigned, radix, target) {
  if (str.length === 0) {
    return copy(ZERO, target)
  }
  if (typeof unsigned === 'object') {
    target = unsigned
    unsigned = false
    radix = undefined
  } else if (typeof unsigned === 'number' || typeof radix === 'boolean') {
    return fromString(str, radix, unsigned, target)
  }
  if (target === null || target === undefined) {
    target = { low: 0 | 0, high: 0 | 0, unsigned: unsigned }
  }
  if (str === 'NaN' || str === 'Infinity' || str === '+Infinity' || str === '-Infinity') {
    throw new Error(`Input "${str}" is not supported by longfn.`)
  }
  str = str.trim()
  const p = str.indexOf('-')
  if (p > 0) {
    throw new Error(`Input "${str}" contains hyphen at unexpected position ${p}`)
  }
  const negate = p === 0
  if (negate) {
    if (unsigned) {
      throw new Error(`Input "${str}" is marked as negative though it is supposed to be unsigned.`)
    }
    str = str.substr(1)
  }
  if (radix === undefined || radix === 0 || radix === false) {
    if (/^0x/i.test(str)) {
      str = str.substr(2)
      radix = 16
    } else if (/^0/.test(str)) {
      throw new Error(`If no radix is specified, input "${str}" should not start with a 0 as a it is an unclear state in JavaScript`)
    } else {
      radix = 10
    }
  } else {
    if (typeof radix === 'string') {
      radix = parseInt(radix, 10)
    }
    if (radix < 2 || radix > 36) {
      throw new RangeError(`Radix between 2 and 36 expected, got: ${radix}`)
    }
  }
  const digits = getDigitsByRadix(radix)
  copy(ZERO, target, true)
  let numDigits = 0
  for (; numDigits < str.length; numDigits++) {
    const byPos = digits[numDigits % digits.length]
    const char = str[numDigits]
    if (char === '0') {
      // zero does nothing
      continue
    }
    const value = byPos[char]
    if (value === undefined) {
      break
    }
  }
  for (let digit = 0, pos = numDigits - 1; digit < numDigits; digit++, pos--) {
    const byPos = digits[digit % digits.length]
    const char = str[pos]
    if (char === '0') {
      // zero does nothing
      continue
    }
    add(target, byPos[char], target)
  }
  target.unsigned = !!unsigned
  if (negate) {
    neg(target, target)
  }
  return target
}

module.exports = Object.freeze({
  ZERO: ZERO,
  UZERO: UZERO,
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
  eq: eq,
  ne: ne,
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
  mul: mul,
  div: div,
  mod: mod,
  add: add,
  sub: sub,
  or: or,
  xor: xor,
  and: and,
  not: not,
  copy: copy,
  neg: neg,
  fromInt: fromInt,
  toNumber: toNumber,
  toInt: toInt,
  toBigInt: toBigInt,
  toString: toString,
  toBytes: isLE ? toBytesLE : toBytesBE,
  toBytesLE: toBytesLE,
  toBytesBE: toBytesBE,
  fromValue: fromValue,
  fromBytes: fromBytes,
  fromBytesLE: fromBytesLE,
  fromBytesBE: fromBytesBE,
  fromNumber: fromNumber,
  fromBits: fromBits,
  fromBigInt: fromBigInt,
  fromString: fromString,
  fromFloat: fromFloat
})
