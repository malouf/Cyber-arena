import type { AgentComponent } from "./types.js";
export type CustomComponent = {
    /**
     * If you have a custom name for the agent component, you can pass it here
     * as components.myAgentName.
     */
    component?: AgentComponent;
};
export declare function componentAPI(args?: CustomComponent): AgentComponent;
export declare const defaultComponent: AgentComponent;
//# sourceMappingURL=defaultComponent.d.ts.map