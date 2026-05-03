import { useSmoothText } from "./useSmoothText.js";
export function SmoothText({ text, ...options }) {
    const [visibleText] = useSmoothText(text, options);
    return visibleText;
}
//# sourceMappingURL=SmoothText.js.map