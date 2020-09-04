import { add, and, ILong } from '..'

let a: ILong = { high: 0, low: 0 }

a = add(a, a, a)
a = and(a, a, a)

