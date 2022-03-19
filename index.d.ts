declare namespace longfn {
  interface Long {
    high: number
    low: number
  }

  interface ISLong extends Long {
    unsigned?: false
  }

  interface IULong extends Long {
    unsigned: true
  }

  type ILong = ISLong | IULong

  interface ILongLike {
    high?: number
    low?: number
    unsigned?: boolean
  }

  const ZERO: ISLong
  const UZERO: IULong
  const ONE: ISLong
  const UONE: IULong
  const NEG_ONE: ISLong
  const MAX_VALUE: ISLong
  const MIN_VALUE: ISLong
  const MAX_UNSIGNED_VALUE: IULong

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

  function toSigned (long: ILong, target: ILongLike): ISLong
  function toUnsigned (long: ILong, target: ILongLike): IULong

  function fromFloat (float: number, unsigned: true, target?: ILongLike): IULong
  function fromFloat (float: number, unsigned?: false, target?: ILongLike): ISLong
  function fromInt (number: number, unsigned: true, target?: ILongLike): IULong
  function fromInt (number: number, unsigned?: false, target?: ILongLike): ISLong
  function fromBigInt (input: bigint, unsigned?: falsey, target?: ILongLike): ISLong
  function fromBigInt (input: bigint, unsigned: truey, target?: ILongLike): IULong
  function fromNumber (value: number, unsigned: true, target?: ILongLike): IULong
  function fromNumber (value: number, unsigned?: false, target?: ILongLike): ISLong
  function fromBits (low: number, high: number, unsigned: true, target?: ILongLike): IULong
  function fromBits (low: number, high?: number, unsigned?: false, target?: ILongLike): ISLong
  function fromString (input: string, unsigned?: falsey, target?: ILongLike): ISLong
  function fromString (input: string, unsigned: truey, target?: ILongLike): IULong
  function fromString (input: string, unsigned: truey, radix: RADIX, target?: ILongLike): IULong
  function fromString (input: string, unsigned: falsey, radix: RADIX, target?: ILongLike): ISLong
  function fromString (input: string, radix: RADIX, unsigned: true, target?: ILongLike): IULong
  function fromString (input: string, radix: RADIX, unsigned: false, target?: ILongLike): ISLong
  function toNumber (long: ILong): number
  function toInt (long: ILong): number
  function toBigInt (long: ILong): bigint
  function toBytes (long: ILong): Uint8Array
  function toBytes (long: ILong, offset: number): Uint8Array
  function toBytes <TTarget extends ArrayBufferView> (long: ILong, target: TTarget): TTarget
  function toBytes <TTarget extends ArrayBufferView> (long: ILong, offset: number, target: TTarget): TTarget
  function toBytes <TTarget extends ArrayBufferView> (long: ILong, target: TTarget, offset: number): TTarget
  function toBytesLE (long: ILong): Uint8Array
  function toBytesLE (long: ILong, offset: number): Uint8Array
  function toBytesLE <TTarget extends ArrayBufferView> (long: ILong, target: TTarget): TTarget
  function toBytesLE <TTarget extends ArrayBufferView> (long: ILong, offset: number, target: TTarget): TTarget
  function toBytesLE <TTarget extends ArrayBufferView> (long: ILong, target: TTarget, offset: number): TTarget
  function toBytesBE (long: ILong): Uint8Array
  function toBytesBE (long: ILong, offset: number): Uint8Array
  function toBytesBE <TTarget extends ArrayBufferView> (long: ILong, target: TTarget): TTarget
  function toBytesBE <TTarget extends ArrayBufferView> (long: ILong, offset: number, target: TTarget): TTarget
  function toBytesBE <TTarget extends ArrayBufferView> (long: ILong, target: TTarget, offset: number): TTarget
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ILong, target?: ILongLike): ISLong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ISLong, target?: ILongLike): ISLong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | IULong, target?: ILongLike): IULong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ILong, unsigned: falsey, target?: ILongLike): ISLong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ILong, unsigned: truey, target?: ILongLike): IULong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | ISLong, unsigned: null | undefined, target?: ILongLike): ISLong
  function fromValue (value: string | number | boolean | null | undefined | ArrayBufferView | number[] | IULong, unsigned: null | undefined, target?: ILongLike): IULong
  function fromBytes (bytes: ArrayBufferView, unsigned: falsey, target?: ILongLike): ISLong
  function fromBytes (bytes: ArrayBufferView, unsigned: truey, target?: ILongLike): IULong
  function fromBytes (bytes: ArrayBufferView, unsigned: falsey, offset: number, target?: ILongLike): ISLong
  function fromBytes (bytes: ArrayBufferView, unsigned: truey, offset: number, target?: ILongLike): IULong
  function fromBytesLE (bytes: ArrayBufferView, unsigned: falsey, target?: ILongLike): ISLong
  function fromBytesLE (bytes: ArrayBufferView, unsigned: truey, target?: ILongLike): IULong
  function fromBytesLE (bytes: ArrayBufferView, unsigned: falsey, offset: number, target?: ILongLike): ISLong
  function fromBytesLE (bytes: ArrayBufferView, unsigned: truey, offset: number, target?: ILongLike): IULong
  function fromBytesBE (bytes: ArrayBufferView, unsigned: falsey, target?: ILongLike): ISLong
  function fromBytesBE (bytes: ArrayBufferView, unsigned: truey, target?: ILongLike): IULong
  function fromBytesBE (bytes: ArrayBufferView, unsigned: falsey, offset: number, target?: ILongLike): ISLong
  function fromBytesBE (bytes: ArrayBufferView, unsigned: truey, offset: number, target?: ILongLike): IULong
  function toString (long: ILong, radix?: number): string

  function isLong (obj: any): obj is ILong
  function isLongLike (obj: any): obj is ILongLike
  function isULong (obj: any): obj is IULong
  function isSLong (obj: any): obj is ISLong
  function isEven (long: ILong): boolean
  function isNegative (long: ILong): boolean
  function isPositive (long: ILong): boolean
  function isZero (long: ILong): boolean
  function isOdd (long: ILong): boolean
  function compare (a: ILong, b: ILong): number
  function eq (a: ILong, b: ILong): boolean
  function ne (a: ILong, b: ILong): boolean
  function lt (long: ILong, greater: ILong): boolean
  function le (long: ILong, sameOrGreater: ILong): boolean
  function gt (long: ILong, sameOrLesser: ILong): boolean
  function ge (long: ILong, lesser: ILong): boolean
  function mod (long: ILong, divisor: ILong, target: ILongLike): ILong
  function rotl <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong
  function rotr <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong
  function shl <TLong extends ILong>(long: ILong, numBits: number, target: ILongLike): TLong
  function shr <TLong extends ILong>(long: ILong, numBits: number, target: ILongLike): TLong
  function shru <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong
  function sub <TLong extends ILong>(long: TLong, subtrahend: TLong, target: ILongLike): TLong
  function or <TLong extends ILong>(long: TLong, subtrahend: TLong, target: ILongLike): TLong
  function xor <TLong extends ILong>(long: TLong, other: TLong, target: ILongLike): TLong
  function not <TLong extends ILong>(long: TLong, target: ILongLike): TLong
  function copy <TLong extends ILong>(source: TLong, target: ILongLike): TLong
  function copy (source: ILong, target: ILongLike, unsigned: truish): IULong
  function copy (source: ILong, target: ILongLike, unsigned: falsish): ISLong
  function neg <TLong extends ILong>(long: TLong, target: ILongLike): TLong
  function add (long: ILong, addend: ILong, target: ILongLike): ILong
  function and (long: ILong, other: ILong, target: ILongLike): ILong
  function div (long: ILong, divisor: ILong, target: ILongLike): ILong
  function mul <TLong extends ISLong | IULong>(long: TLong, multiplier: TLong, target?: ILongLike): TLong
  function clz (long: ILong): number
  function ctz (long: ILong): number
}

export = longfn
