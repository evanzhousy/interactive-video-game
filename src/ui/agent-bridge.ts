import { createAgent } from "@ui-sdk/react/agent";

/**
 * Shared @ui-sdk/react agent bridge initialized prior to initial React mount so
 * every primitive registers into snapshots without exposing hidden game rolls.
 */
export const uiAgent = createAgent();
