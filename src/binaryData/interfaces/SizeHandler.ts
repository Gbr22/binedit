import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { rowHeight } from "../constants";
import type { DataProvider } from "../dataProvider";
import { getDataProviderRowCount } from "./DataHandler";
import { defineSubsystem, subsystemProps, type SubsystemInterface, applySubsystem } from "../composition";

export type ISizeHandler = SubsystemInterface<typeof SizeHandler>;

export const SizeHandler = defineSubsystem({
    name: "SizeHandler",
    props: subsystemProps<{
        viewportRowCount: TrackedVar<number>
    }>(),
    proto: {
        initSizeHandler(this: Editor){
            this.viewportRowCount = new TrackedVar(0);
        
            const resizeObserver = new ResizeObserver((entries) => {
                this.resize();
            });
            
            resizeObserver.observe(this.element);
        },
        resize(this: Editor){
            const rect = this.element.getBoundingClientRect();
            this.viewportRowCount.value = Math.floor(rect.height / rowHeight);
            this.desiredState.value = this.desiredState.value.with({
                width: Math.round(rect.width * window.devicePixelRatio),
                height: Math.round(rect.height * window.devicePixelRatio)
            })
        },
        toValidTopRow(this: Editor, dataProvider: DataProvider, topRow: number){
            if (topRow < 0){
                return 0;
            }
            const maxRow = getDataProviderRowCount(dataProvider) - Math.floor(this.viewportRowCount.value / 2);
            if (topRow > maxRow){
                return maxRow;
            }
            return topRow;
        }
    },
    init() {
        
    },
});

export function patchSizeHandler(){
    applySubsystem(Editor,SizeHandler);
}