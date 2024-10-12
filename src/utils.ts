export type Expand<T> = T extends infer O ? { [P in keyof O]: O[P] } : never;
export type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift';
export type FixedLengthArray<T, L extends number, TObj = [T, ...T[]]> =
    Pick<TObj, Exclude<keyof TObj, ArrayLengthMutationKeys>>
    & {
        readonly length: L
        [index: number]: T
        [Symbol.iterator]: () => IterableIterator<T>
    };

export interface IConstructor<T> {
    new(): T
    prototype: T
}

export type EitherSide = "left" | "right";

export type Either<L = any, R = any> = EitherLeft<L> | EitherRight<R>;

type EitherChooseSide<L, R, S extends EitherSide> = {
    left: L,
    right: R
}[S];

export const Either = {
    left<L>(value: L): EitherLeft<L> {
        return new EitherLeft(value);
    },

    right<R>(value: R): EitherRight<R> {
        return new EitherRight(value);
    }
};

abstract class EitherBase<L, R, S extends EitherSide> {
    public abstract get side(): S;
    public abstract get left(): L;
    public abstract get right(): R;

    public abstract map<A, B>(left: (source: L) => A, right: (source: R) => B): Either<A, B>;
    public abstract mapLeft<O>(left: (source: L) => O): Either<O, R>;
    public abstract mapRight<O>(right: (source: R) => O): Either<L, O>;
    public abstract swap(): Either<R, L>;
    public abstract orThrow(): L;
    
    public ifLeft(fn: (value: L) => void): this {
        if (this.side === "left") {
            fn(this.left);
        }

        return this;
    }

    public ifRight(fn: (value: R) => void): this {
        if (this.side === "right") {
            fn(this.right);
        }

        return this;
    }
}

class EitherLeft<L> extends EitherBase<L, never, "left"> {
    private readonly value: L;

    public constructor(value: L) {
        super();
        this.value = value;
    }

    public get side(): "left" {
        return "left";
    }

    public get left(): L {
        return this.value;
    }

    public get right(): never {
        throw new Error("Cannot get right value from an Either that only has a left value.");
    }

    public map<A, B>(left: (source: L) => A, _right: (source: never) => B): EitherLeft<A> {
        return Either.left(left(this.value));
    }
    
    public mapLeft<O>(left: (source: L) => O): EitherLeft<O> {
        return Either.left(left(this.value));
    }

    public mapRight<O>(_right: (source: never) => O): this {
        return this;
    }

    public swap(): EitherRight<L> {
        return Either.right(this.value);
    }

    public orThrow(): L {
        return this.value;
    }
}

class EitherRight<R> extends EitherBase<never, R, "right"> {
    private readonly value: R;

    public constructor(value: R) {
        super();
        this.value = value;
    }

    public get side(): "right" {
        return "right";
    }

    public get left(): never {
        throw new Error("Cannot get right value from an Either that only has a left value.");
    }

    public get right(): R {
        return this.value;
    }
    
    public map<A, B>(_left: (source: never) => A, right: (source: R) => B): EitherRight<B> {
        return Either.right(right(this.value));
    }

    public mapLeft<O>(_left: (source: never) => O): this {
        return this;
    }

    public mapRight<O>(right: (source: R) => O): EitherRight<O> {
        return Either.right(right(this.value));
    }

    public swap(): EitherLeft<R> {
        return Either.left(this.value);
    }

    public orThrow(): never {
        throw new Error("Left value not present.");
    }
}