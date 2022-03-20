declare namespace longfn {
  /**
  * A 64 bit two's-complement integer, with low and high 32 bit values as signed integers.
  * 
  * @see fromBigInt
  * @see fromBits
  * @see fromBytes
  * @see fromBytesLE
  * @see fromBytesBE
  * @see fromFloat
  * @see fromInt
  * @see fromNumber
  * @see fromValue
  */
  interface Long {
    /**
     * The high 32 bits as a signed value.
     */
    high: number
    /**
     * The low 32 bits as a signed value.
     */
    low: number
  }

  /**
   * 
   */
  interface ISLong extends Long {
    /**
     * Signed long value
     */
    unsigned?: false
  }

  interface IULong extends Long {
    /**
     * Unsigned long value
     */
    unsigned: true
  }

  /**
   * Signed or Unsigned long
   */
  type ILong = ISLong | IULong

  /**
   * Input Long value
   */
  type ILongLike = Partial<ILong>

  /**
   * Signed zero
   */
  const ZERO: ISLong

  /**
   * Unsigned zero.
   */
  const UZERO: IULong

  /**
   * Signed one.
   */
  const ONE: ISLong

  /**
   * Unsigned one.
   */
  const UONE: IULong

  /**
   * Signed negative one.
   */
  const NEG_ONE: ISLong

  /**
   * Maximum signed value.
   */
  const MAX_VALUE: ISLong

  /**
   * Minimum signed value.
   */
  const MIN_VALUE: ISLong

  /**
   * Maximum unsigned value.
   */
  const MAX_UNSIGNED_VALUE: IULong

  /**
   * Radix that can be use to stringify.
   */
  type RADIX =
    2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
    10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 |
    20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 |
    30 | 31 | 32 | 33 | 34 | 35 | 36 |
    '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
    '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' |
    '20' | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' |
    '30' | '31' | '32' | '33' | '34' | '35' | '36'
  
  type falsish = null | undefined | 0 | ''
  type truish = 1
  type truey = truish | true
  type falsey = falsish | false

  /**
   * Converts this Long to signed.
   */
  function toSigned (long: ILong, target: ILongLike): ISLong

  /**
   * Converts this Long to unsigned.
   */
  function toUnsigned (long: ILong, target: ILongLike): IULong

  /**
   * Returns a Long representing the float value.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array
   * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#endianness
   */
  function fromFloat (float: number, unsigned: true, target?: ILongLike): IULong
  function fromFloat (float: number, unsigned?: false, target?: ILongLike): ISLong

  /**
   * Returns a Long representing the given 32 bit integer value.
   */
  function fromInt (number: number, unsigned: true, target?: ILongLike): IULong
  function fromInt (number: number, unsigned?: false, target?: ILongLike): ISLong

  /**
   * Returns a Long representing the given BigInt value.
   */
  function fromBigInt (input: bigint, unsigned?: falsey, target?: ILongLike): ISLong
  function fromBigInt (input: bigint, unsigned: truey, target?: ILongLike): IULong

  /**
   * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
   */
  function fromNumber (value: number, unsigned: true, target?: ILongLike): IULong
  function fromNumber (value: number, unsigned?: false, target?: ILongLike): ISLong

  /**
   * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is assumed to use 32 bits.
   */
  function fromBits (low: number, high: number, unsigned: true, target?: ILongLike): IULong
  function fromBits (low: number, high?: number, unsigned?: false, target?: ILongLike): ISLong

  /**
   * Returns a Long representation of the given string, written using the specified radix.
   */
  function fromString (input: string, unsigned?: falsey, target?: ILongLike): ISLong
  function fromString (input: string, unsigned: truey, target?: ILongLike): IULong
  function fromString (input: string, unsigned: truey, radix: RADIX, target?: ILongLike): IULong
  function fromString (input: string, unsigned: falsey, radix: RADIX, target?: ILongLike): ISLong
  function fromString (input: string, radix: RADIX, unsigned: true, target?: ILongLike): IULong
  function fromString (input: string, radix: RADIX, unsigned: false, target?: ILongLike): ISLong

  /**
   * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
   */
  function toNumber (long: ILong): number

  /**
   * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
   */
  function toInt (long: ILong): number

  /**
   * Converts the Long to a BigInt integer.
   */
  function toBigInt (long: ILong): bigint

  interface ToBytes {
    (long: ILong): Uint8Array
    (long: ILong, offset: number): Uint8Array
    <TTarget extends ArrayBufferView | number[]> (long: ILong, target: TTarget): TTarget
    <TTarget extends ArrayBufferView | number[]> (long: ILong, offset: number, target: TTarget): TTarget
    <TTarget extends ArrayBufferView | number[]> (long: ILong, target: TTarget, offset: number): TTarget
  }
  type ToBytesRaw = <TTarget extends ArrayBufferView | number[]> (long: ILong, offset: number, target: TTarget) => TTarget

  /**
   * Converts this Long to its system endian byte representation.
   * 
   * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#endianness
   */
  const toBytes: ToBytes

  /**
   * Strict variant of toBytes that is faster
   */
  const toBytesRaw: ToBytesRaw

  /**
   * Converts this Long to its little endian byte representation.
   */
  const toBytesLE: ToBytes

  /**
   * Strict variant of toBytesLE that is faster
   */
  const toBytesLERaw: ToBytesRaw

  /**
   * Converts this Long to its big endian byte representation.
   */
  const toBytesBE: ToBytes

  /**
   * Strict variant of toBytesLE that is faster
   */
  const toBytesBERaw: ToBytesRaw

  /**
   * Converts the specified value to a Long.
   */
  function fromValue <T extends string | number | boolean | null | undefined | ArrayBufferView | number[] | ILong> (value: T, target?: ILongLike): T extends ISLong ? ISLong : T extends IULong ? IULong : ILong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ILong, unsigned: falsey, target?: ILongLike): ISLong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ILong, unsigned: truey, target?: ILongLike): IULong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ISLong, unsigned: null | undefined, target?: ILongLike): ISLong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | IULong, unsigned: null | undefined, target?: ILongLike): IULong

  interface FromBytes {
    (bytes: ArrayBufferView | number[], unsigned: falsey, target?: ILongLike): ISLong
    (bytes: ArrayBufferView | number[], unsigned: truey, target?: ILongLike): IULong
    (bytes: ArrayBufferView | number[], unsigned: falsey, offset: number, target?: ILongLike): ISLong
    (bytes: ArrayBufferView | number[], unsigned: truey, offset: number, target?: ILongLike): IULong
  }

  type FromBytesRaw = <TTarget extends ILong> (source: ArrayBufferView | number[], offset: number, target: TTarget) => TTarget

  /**
   * Creates a Long from the system byte representation, using the system's endianness.
   * 
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#endianness
   */
  const fromBytes: FromBytes

  /**
   * Strict variant of fromBytes that is faster
   */
  const fromBytesRaw: FromBytesRaw

  /**
   * Creates a Long from its little endian byte representation.
   */
  const fromBytesLE: FromBytes

  /**
   * Strict variant of fromBytesLE that is faster
   */
  const fromBytesLERaw: FromBytesRaw

  /**
   * Creates a Long from its big endian byte representation.
   */
  const fromBytesBE: FromBytes

  /**
   * Strict variant of fromBytesLE that is faster
   */
  const fromBytesBERaw: FromBytesRaw

  /**
   * Converts the Long to a string written in the specified radix.
   */
  function toString (long: ILong, radix?: RADIX): string

  /**
   * Tests if the specified object is a Long.
   */
  function isLong (obj: any): obj is ILong

  /**
   * Tests if the specified object is a valid input for Long.
   */
  function isLongLike (obj: any): obj is ILongLike

  /**
   * Tests if the specified object is a unsigned Long.
   */
  function isULong (obj: any): obj is IULong

  /**
   * Tests if the specified object is a signed Long.
   */
  function isSLong (obj: any): obj is ISLong

  /**
   * Tests if this Long's value is even.
   */
  function isEven (long: ILong): boolean

  /**
   * Tests if this Long's value is negative.
   */
  function isNegative (long: ILong): boolean

  /**
   * Tests if this Long's value is positive or zero.
   */
  function isPositive (long: ILong): boolean

  /**
   * Tests if this Long's value equals zero.
   */
  function isZero (long: ILong): boolean

  /**
   * Tests if this Long's value is odd.
   */
  function isOdd (long: ILong): boolean

  /**
   * Compares this Long's value with the specified's.
   * 
   * @returns -1 if smaller, 1 if bigger, 0 if equal
   */
  function compare (a: ILong, b: ILong): number

  /**
   * Tests if this Long's value equals zero.
   */
  function eq (a: ILong, b: ILong): boolean

  /**
   * Tests if this Long's value differs from the specified's.
   */
  function ne (a: ILong, b: ILong): boolean

  /**
   * Tests if this Long's value is less than the specified's.
   */
  function lt (long: ILong, greater: ILong): boolean

  /**
   * Tests if this Long's value is less than or equal the specified's.
   */
  function le (long: ILong, sameOrGreater: ILong): boolean

  /**
   * Tests if this Long's value is greater than the specified's.
   */
  function gt (long: ILong, sameOrLesser: ILong): boolean

  /**
   * Tests if this Long's value is greater than or equal the specified's.
   */
  function ge (long: ILong, lesser: ILong): boolean

  /**
   * Returns this Long modulo the specified.
   */
  function mod (long: ILong, divisor: ILong, target: ILongLike): ILong

  /**
   * Returns this Long with bits rotated to the left by the given amount.
   */
  function rotl <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong

  /**
   * Returns this Long with bits rotated to the right by the given amount.
   */
  function rotr <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong

  /**
   * Returns this Long with bits shifted to the left by the given amount.
   */
  function shl <TLong extends ILong>(long: ILong, numBits: number, target: ILongLike): TLong

  /**
   * Returns this Long with bits arithmetically shifted to the right by the given amount.
   */
  function shr <TLong extends ILong>(long: ILong, numBits: number, target: ILongLike): TLong

  /**
   * Returns this Long with bits logically shifted to the right by the given amount.
   */
  function shru <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong

  /**
   * Returns the difference of this and the specified Long in the target Long.
   */
  function sub <TLong extends ILong>(long: TLong, subtrahend: TLong, target: ILongLike): TLong

  /**
   * Returns the bitwise OR of this Long and the specified.
   */
  function or <TLong extends ILong>(long: TLong, subtrahend: TLong, target: ILongLike): TLong

  /**
   * Returns the bitwise XOR of this Long and the given one.
   */
  function xor <TLong extends ILong>(long: TLong, other: TLong, target: ILongLike): TLong

  /**
   * Returns the bitwise NOT of this Long.
   */
  function not <TLong extends ILong>(long: TLong, target: ILongLike): TLong
  function copy <TLong extends ILongLike>(source: TLong, target: ILongLike):
    TLong extends { unsigned: falsey }
      ? ISLong
      : TLong extends { unsigned: truey }
        ? IULong
        : TLong extends { unsigned: boolean }
          ? ILong
          : ISLong
  function copy (source: ILong, target: ILongLike, unsigned: truey): IULong
  function copy (source: ILong, target: ILongLike, unsigned: falsish): ISLong

  /**
   * Negates this Long's value.
   */
  function neg <TLong extends ILong>(long: TLong, target: ILongLike): TLong

  /**
   * Returns the sum of this and the specified Long.
   */
  function add (long: ILong, addend: ILong, target: ILongLike): ILong

  /**
   * Returns the bitwise AND of this Long and the specified.
   */
  function and (long: ILong, other: ILong, target: ILongLike): ILong

  /**
   * Returns this Long divided by the specified.
   */
  function div (long: ILong, divisor: ILong, target: ILongLike): ILong

  /**
   * Returns the product of this and the specified Long.
   */
  function mul <TLong extends ISLong | IULong>(long: TLong, multiplier: TLong, target?: ILongLike): TLong

  /**
   * Returns count leading zeros of this Long.
   */
  function clz (long: ILong): number

  /**
   * Returns count trailing zeros of this Long.
   */
  function ctz (long: ILong): number
}

export = longfn
