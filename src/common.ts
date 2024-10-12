import { FixedLengthArray } from "./utils";

export function createCanvasList<L extends number>(amount: L): FixedLengthArray<HTMLCanvasElement, L>
export function createCanvasList(amount: number): HTMLCanvasElement[]
export function createCanvasList(amount: number): FixedLengthArray<HTMLCanvasElement, number> | HTMLCanvasElement[] {
    const arr = [];
    for (let i = 0; i < amount; i++) {
        arr.push(document.createElement("canvas"));
    }
    return arr as HTMLCanvasElement[];
}

export type PixelColor = [r: number, g: number, b: number, a: number];

export function getPixel(data: Uint8ClampedArray, index: number): PixelColor {
    const idx = index * 4;
    return [
        data[idx],
        data[idx + 1],
        data[idx + 2],
        data[idx + 3]
    ];
}

export function vLShift(n: number, shift: number) {
    return (n | 0) << shift;
    // let _n = Math.floor(n);
    // for (let i = 0; i < shift; i++) {
    //     _n *= 2;
    // }
    // return _n;
}

export function log(name: string, ...args: any[]) {
    const fn = console.log.bind(console,
        `%c %c ${name} %c `,
        "background: #f8a; font-weight: bold;",
        "background: #f58; color: #fff; font-weight: bold;",
        "background: #f8a; font-weight: bold;"
    );
    fn.apply(console, args);
}

export function warn(name: string, ...args: any[]) {
    const fn = console.warn.bind(console,
        `%c %c ${name} %c `,
        "background: #f8a; font-weight: bold;",
        "background: #f58; color: #fff; font-weight: bold;",
        "background: #f8a; font-weight: bold;"
    );
    fn.apply(console, args);
}

export function clamp(val: number, min: number, max: number) {
    return val > max ? max : (val < min ? min : val);
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * clamp(t, 0, 1);
}

export function getPixelHex(data: Uint8ClampedArray, index: number): number {
    // return in ARGB
    const c = getPixel(data, index);
    const hex = vLShift(c[3], 24) + vLShift(c[0], 16) + vLShift(c[1], 8) + c[2];
    return hex;
}

export function memoize<R>(fn: () => R): () => R {
    let obj = {
        value: <R | null>null,
        getValue() {
            if (this.value !== null) return this.value;
            this.value = fn();
            return this.value;
        }
    };

    return obj.getValue.bind(obj);
}

export function memoize1<A, R>(fn: (arg: A) => R): (arg: A) => R {
    let map = new Map<A, () => R>();
    return (a) => {
        if (map.has(a)) {
            return map.get(a)!() as R;
        }

        const memoized = memoize(() => fn(a));
        map.set(a, memoized);
        return memoized();
    }
}

export function memoize2<A, B, R>(fn: (arg1: A, arg2: B) => R): (arg1: A, arg2: B) => R {
    let map = new Map<A, (arg: B) => R>();
    return (a, b) => {
        if (map.has(a)) {
            return map.get(a)!(b) as R;
        }

        const memoized = memoize1((b: B) => fn(a, b));
        map.set(a, memoized);
        return memoized(b);
    }
}