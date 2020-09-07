import { expectType } from 'tsd'
import { add, and, ILong, ISLong } from '.'

declare const l: ILong

expectType<ISLong>({ high: 0, low: 0 } as ISLong)
expectType<ILong>(add(l, l, l))
expectType<ILong>(and(l, l, l))

