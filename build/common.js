export function createCanvasList(amount) {
    const arr = [];
    for (let i = 0; i < amount; i++) {
        arr.push(document.createElement("canvas"));
    }
    return arr;
}
export function getPixel(data, index) {
    const idx = index * 4;
    return [
        data[idx],
        data[idx + 1],
        data[idx + 2],
        data[idx + 3]
    ];
}
export function vLShift(n, shift) {
    return (n | 0) << shift;
    // let _n = Math.floor(n);
    // for (let i = 0; i < shift; i++) {
    //     _n *= 2;
    // }
    // return _n;
}
export function log(name, ...args) {
    const fn = console.log.bind(console, `%c %c ${name} %c `, "background: #f8a; font-weight: bold;", "background: #f58; color: #fff; font-weight: bold;", "background: #f8a; font-weight: bold;");
    fn.apply(console, args);
}
export function warn(name, ...args) {
    const fn = console.warn.bind(console, `%c %c ${name} %c `, "background: #f8a; font-weight: bold;", "background: #f58; color: #fff; font-weight: bold;", "background: #f8a; font-weight: bold;");
    fn.apply(console, args);
}
export function clamp(val, min, max) {
    return val > max ? max : (val < min ? min : val);
}
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}
export function getPixelHex(data, index) {
    // return in ARGB
    const c = getPixel(data, index);
    const hex = vLShift(c[3], 24) + vLShift(c[0], 16) + vLShift(c[1], 8) + c[2];
    return hex;
}
export function memoize(fn) {
    let obj = {
        value: null,
        getValue() {
            if (this.value !== null)
                return this.value;
            this.value = fn();
            return this.value;
        }
    };
    return obj.getValue.bind(obj);
}
export function memoize1(fn) {
    let map = new Map();
    return (a) => {
        if (map.has(a)) {
            return map.get(a)();
        }
        const memoized = memoize(() => fn(a));
        map.set(a, memoized);
        return memoized();
    };
}
export function memoize2(fn) {
    let map = new Map();
    return (a, b) => {
        if (map.has(a)) {
            return map.get(a)(b);
        }
        const memoized = memoize1((b) => fn(a, b));
        map.set(a, memoized);
        return memoized(b);
    };
}
//# sourceMappingURL=common.js.map