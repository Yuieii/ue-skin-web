export const Either = {
    left(value) {
        return new EitherLeft(value);
    },
    right(value) {
        return new EitherRight(value);
    }
};
class EitherBase {
    ifLeft(fn) {
        if (this.side === "left") {
            fn(this.left);
        }
        return this;
    }
    ifRight(fn) {
        if (this.side === "right") {
            fn(this.right);
        }
        return this;
    }
}
class EitherLeft extends EitherBase {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    get side() {
        return "left";
    }
    get left() {
        return this.value;
    }
    get right() {
        throw new Error("Cannot get right value from an Either that only has a left value.");
    }
    map(left, _right) {
        return Either.left(left(this.value));
    }
    mapLeft(left) {
        return Either.left(left(this.value));
    }
    mapRight(_right) {
        return this;
    }
    swap() {
        return Either.right(this.value);
    }
    orThrow() {
        return this.value;
    }
}
class EitherRight extends EitherBase {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    get side() {
        return "right";
    }
    get left() {
        throw new Error("Cannot get right value from an Either that only has a left value.");
    }
    get right() {
        return this.value;
    }
    map(_left, right) {
        return Either.right(right(this.value));
    }
    mapLeft(_left) {
        return this;
    }
    mapRight(right) {
        return Either.right(right(this.value));
    }
    swap() {
        return Either.left(this.value);
    }
    orThrow() {
        throw new Error("Left value not present.");
    }
}
//# sourceMappingURL=utils.js.map