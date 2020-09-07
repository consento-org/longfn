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

  function fromFloat (float: number, unsigned: true): IULong
  function fromFloat (float: number, unsigned?: false): ISLong
  function fromInt (number: number, unsigned: true, target?: ILongLike): IULong
  function fromInt (number: number, unsigned?: false, target?: ILongLike): ISLong
  function fromNumber (value: number, unsigned: true, target?: ILongLike): IULong
  function fromNumber (value: number, unsigned?: false, target?: ILongLike): ISLong
  function toNumber (long: ILong): number
  function toInt (long: ILong): number

  // function toBytes (long: ILong, unsigned: boolean, target: Uint8Array): Uint8Array
  // function toBytesBE (long: ILong, unsigned: boolean, target: Uint8Array): Uint8Array
  // function toBytesLE (long: ILong, unsigned: boolean, target: Uint8Array): Uint8Array
  // function toString (long: ILong, unsigned: boolean, radix?: number): string

  function isEven (long: ILong): boolean
  function isNegative (long: ILong): boolean
  function isPositive (long: ILong): boolean
  function isZero (long: ILong): boolean
  function isOdd (long: ILong): boolean
  function ne (a: ILong, b: ILong): boolean
  function lt (a: ILong, b: ILong): boolean
  function le (a: ILong, b: ILong): boolean
  function gt (a: ILong, b: ILong): boolean
  function ge (a: ILong, b: ILong): boolean
  function mod (long: ILong, divisor: ILong, target: ILongLike): ILong
  function rotl <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong
  function rotr <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong
  function shl <TLong extends ILong>(long: ILong, numBits: number, target: ILongLike): TLong
  function shr <TLong extends ILong>(long: ILong, numBits: number, target: ILongLike): TLong
  function shru <TLong extends ILong>(long: TLong, numBits: number, target: ILongLike): TLong
  function sub <TLong extends ILong>(long: TLong, subtrahend: TLong, target: ILongLike): TLong
  function xor <TLong extends ILong>(long: TLong, other: TLong, target: ILongLike): TLong
  function not <TLong extends ILong>(long: TLong, target: ILongLike): TLong
  function copy <TLong extends ILong>(source: TLong, target: ILongLike): TLong
  function neg <TLong extends ILong>(long: TLong, target: ILongLike): TLong
  function add (long: ILong, addend: ILong, target: ILongLike): ILong
  function and (long: ILong, other: ILong, target: ILongLike): ILong
  function compare (a: ILong, b: ILong): number
  function eq (a: ILong, b: ILong): boolean
  function div (long: ILong, divisor: ILong, target: ILongLike): ILong
  function mul <TLong extends ISLong | IULong>(long: TLong, multiplier: TLong, target?: ILongLike): TLong
}

export = longfn
