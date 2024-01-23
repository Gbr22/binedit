interface DotInterface {
    x: number,
    y: number
    arr: [number, number]
}

export type Dot = [number, number] & DotInterface;

export function Dot({
    x,
    y
}: {x: number, y: number}): Dot {
    const arr: Dot = new DotClass({x,y}) as Dot;
    return arr;
}

interface DotClass {
    length: 2;
}
class DotClass extends Array<number> implements DotInterface {
    constructor({
        x,
        y
    }: {x: number, y: number}){
        super(2);
        this[0] = x;
        this[1] = y;
        Object.freeze(this);
    }

    get x(){
        return this[0];
    }
    get y(){
        return this[1];
    }
    get arr(): [number, number] {
        return this as any as [number, number];
    }
}

export class Box {
    left!: number
    right!: number
    top!: number
    bottom!: number
    width: number
    height: number
    arr: readonly [number, number, number, number]

    constructor(props: {
        left: number
        right: number
        top: number
        bottom: number
    }) {
        Object.assign(this,props);
        this.width = this.right - this.left;
        this.height = this.bottom - this.top;
        this.arr = Object.freeze([
            this.left,
            this.top,
            this.width,
            this.height
        ]);
        Object.freeze(this);
    }
    get center(){
        return Dot({
            x: this.left + this.width / 2,
            y: this.top + this.height / 2
        })
    }
}

export class BoundingBox {
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
    innerWidth: number;
    innerHeight: number;

    inner: Box;
    outer: Box;
    border: Box;

    constructor(props: {
        outerLeft: number,
        outerTop: number,
        innerWidth: number,
        innerHeight: number,
        paddingLeft?: number,
        paddingRight?: number,
        paddingTop?: number,
        paddingBottom?: number,
        marginLeft?: number,
        marginRight?: number,
        marginTop?: number,
        marginBottom?: number
    }){
        const {
            outerLeft,
            outerTop,
            innerWidth,
            innerHeight
        } = props;
        this.paddingLeft = props.paddingLeft ?? 0;
        this.paddingRight = props.paddingRight ?? 0;
        this.paddingTop = props.paddingTop ?? 0;
        this.paddingBottom = props.paddingBottom ?? 0;
        this.marginLeft = props.marginLeft ?? 0;
        this.marginRight = props.marginRight ?? 0;
        this.marginTop = props.marginTop ?? 0;
        this.marginBottom = props.marginBottom ?? 0;
        this.outerLeft = outerLeft;
        this.outerTop = outerTop;
        this.innerWidth = innerWidth;
        this.innerHeight = innerHeight;

        this.inner = new Box({
            left: this.innerLeft,
            right: this.innerRight,
            top: this.innerTop,
            bottom: this.innerBottom
        });
        this.border = new Box({
            left: this.borderLeft,
            right: this.borderRight,
            top: this.borderTop,
            bottom: this.borderBottom
        });
        this.outer = new Box({
            left: this.outerLeft,
            right: this.outerRight,
            top: this.outerTop,
            bottom: this.outerBottom
        });

        Object.freeze(this);
    }
    
    // outer -> border -> inner
    outerLeft: number;
    get borderLeft(){ return this.outerLeft + this.marginLeft; }
    get innerLeft(){ return this.borderLeft + this.paddingLeft; }

    // inner <- border <- outer
    get innerRight(){ return this.innerLeft + this.innerWidth; }
    get borderRight(){ return this.innerRight + this.paddingRight; }
    get outerRight(){ return this.borderRight + this.marginRight; }

    // outer -> border -> inner
    outerTop: number;
    get borderTop() { return this.outerTop + this.marginTop; }
    get innerTop() { return this.borderTop + this.paddingTop; }

    // inner <- border <- outer
    get innerBottom() { return this.innerTop + this.innerHeight; }
    get borderBottom() { return this.innerBottom + this.paddingBottom; }
    get outerBottom() { return this.borderBottom + this.marginBottom; }
}

export class CachedBoundingBox {
    create: ()=>BoundingBox
    #value: BoundingBox | undefined
    get value() {
        if (this.#value == undefined){
            this.#value = this.create();
        }
        return this.#value;
    }

    constructor(create: ()=>BoundingBox){
        this.create = create;
    }
}

export class CachedBoundingBoxes<Args extends any[]> {
    create: (...args: Args)=>BoundingBox
    #values = new Map<any,BoundingBox>()
    getKey: (...args: Args)=>any
    constructor(create: (...args: Args)=>BoundingBox, getKey: (...args: Args)=>any) {
        this.create = create;
        this.getKey = getKey;
    }
    get(...args: Args): BoundingBox {
        const key = this.getKey(...args);
        let value = this.#values.get(key);
        if (!value){
            value = this.create(...args);
            this.#values.set(key,value);
        }
        return value;
    }
}