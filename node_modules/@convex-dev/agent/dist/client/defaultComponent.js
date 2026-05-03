import { componentsGeneric } from "convex/server";
export function componentAPI(args) {
    return args?.component ?? defaultComponent;
}
export const defaultComponent = componentsGeneric()
    .agent;
//# sourceMappingURL=defaultComponent.js.map