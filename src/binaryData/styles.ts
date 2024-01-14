export function getStyles(){
    return /*css*/`
    *, *::before, *::after {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        border: none;
    }
    .container {
        --editor-show-wireframe: 0;
        --editor-font-family: monospace;
        --editor-font-size: 14;
        --editor-byte-width: 23;
        --editor-char-width: 11;
        --editor-row-number-digit-count: 8;

        overflow-x: hidden;
        overflow-y: auto;
        display: grid;
        position: relative;
        --row-height: 16px;
        font-family: var(--editor-font-family);
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
    .container[data-scroll-type="virtual"] .scrollbar {
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
    .scrollbar {
        --width: 16px;
        --scrollbar-width: var(--width);
        --handle-height: 5vh;
        --scrollbar-handle-height: var(--handle-height);
        display: none;
        position: absolute;
        height: 100%;
        right: 0;
        top: 0;
        width: var(--scrollbar-width);
        background-color: black;
        grid-template-rows: var(--scrollbar-width) 1fr var(--scrollbar-handle-height) var(--scrollbar-width);
        flex-direction: column;
        --scroll-percent: 0;
    }
    .scrollbar-button {
        width: 100%;
        background-color: #3a3a3a;
        z-index: 1;
    }
    .scrollbar-track {
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateY(calc(100% * var(--scroll-percent)));
    }
    .scrollbar-track-padding {}
    .scrollbar-handle {
        width: 100%;
        height: var(--scrollbar-handle-height);
        background-color: #515151;
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