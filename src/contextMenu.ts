import { reactive } from "vue"

interface ContextMenu {
    sections: Section[]
}

interface Section {
    items: MenuItem[]
}

export interface RootMenu extends ContextMenu {}
export interface SubMenu extends ContextMenu {
    name: string
}

export interface MenuAction {
    name: string
    fn: ()=>void
}

type MenuItem = SubMenu | MenuAction;

export const contextMenuState = reactive({
    visible: false
} as ({
    visible: false
} | {
    visible: true
    x: number
    y: number
    menu: ContextMenu
}))

export function openMenu(event: MouseEvent, menu: RootMenu){
    event.preventDefault();
    Object.assign(contextMenuState, {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        menu
    })
}

export function closeMenu(){
    Object.assign(contextMenuState, {
        visible: false,
        x: undefined,
        y: undefined,
        menu: undefined
    })
}

export function isMenuAction(e: MenuItem): e is MenuAction {
    return e.hasOwnProperty("fn");
}