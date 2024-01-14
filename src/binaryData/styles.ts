export function getStyles(){
    return /*css*/`
    *, *::before, *::after {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    }
    .container {
        overflow-x: hidden;
        overflow-y: auto;
        display: grid;
        position: relative;
        --row-height: 16px;
        font-family: monospace;
        max-height: 100%;
        height: 100%;
        font-size: 14px;
    }
    .container[data-scroll-type="virtual"] {
        overflow: hidden;
    }
    .container[data-scroll-type="virtual"] .scroll-view {
        display: none;
    }
    .container[data-scroll-type="virtual"] .scroll-bar {
        display: grid;
    }
    .data-view {
        position: sticky;
        top: 0;
        height: 100%;
        width: 100%;
    }
    .scroll-view {
        height: calc(var(--row-count) * var(--row-height));
        width: 100%;
        content: '';
        position: absolute;
        pointer-events: none;
    }
    .scroll-bar {
        --scroll-bar-width: 16px;
        --scroll-handle-size: 5vh;
        display: none;
        position: absolute;
        height: 100%;
        right: 0;
        top: 0;
        width: 16px;
        background-color: var(--scrollbar-background-color);
        grid-template-rows: var(--scroll-bar-width) 1fr var(--scroll-handle-size) var(--scroll-bar-width);
        flex-direction: column;
        --scroll-percent: 0;
    }
    .scroll-bar button {
        border: none;
        outline: none;
    }
    .up-arrow, .down-arrow {
        width: 100%;
        display: grid;
        place-content: center;
        color: var(--scrollbar-arrow-foreground-color);
        background-color: var(--scrollbar-arrow-background-color);
    
        transition: color 0.3s ease;
    
        z-index: 1;
    }
    .up-arrow:hover, .down-arrow:hover {
        color: var(--intense-foreground-color);
    }
    .up-arrow svg, .down-arrow svg {
        width: 100%;
    }
    .scroll-bar-track {
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateY(calc(100% * var(--scroll-percent)));
    }
    .scroll-bar-track-padding {}
    .scroll-bar-handle {
        background-color: var(--scrollbar-handle-background-color);
        width: 12px;
        height: 5vh;
        
        transition: background-color 0.2s ease;
    }
    .scroll-bar-handle:hover, .scroll-bar-handle:active {
        background-color: color-mix(in srgb, var(--scrollbar-handle-background-color), 8% var(--mixer-foreground));
    }
    
    .canvas-container {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }
    .canvas {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: top left;
        scale: calc(1 / var(--device-pixel-ratio));
    }
    `;
}