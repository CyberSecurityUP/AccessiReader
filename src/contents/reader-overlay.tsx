import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import cssText from "data-text:~style.css"
import { ReaderOverlay } from "~components/ReaderOverlay"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_end",
  all_frames: false
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent =
    cssText +
    `
    #plasmo-shadow-container {
      z-index: 999999 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: visible !important;
      pointer-events: none !important;
    }
    #plasmo-shadow-container > * {
      pointer-events: auto !important;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `
  return style
}

const ReaderOverlayContainer = () => {
  return <ReaderOverlay />
}

export default ReaderOverlayContainer
