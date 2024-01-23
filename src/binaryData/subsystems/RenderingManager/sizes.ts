interface SizesDependencies {
    devicePixelRatio: number
    scale: number
}

export class Sizes {
    unit: number

    constructor(deps: SizesDependencies){
        this.unit = deps.scale * deps.devicePixelRatio;
    }
}