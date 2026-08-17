/* @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import {
  createGatewayBrowserClientFixture,
  createSessionCapabilityFixture,
  createTestChatPane,
} from "./chat-pane.test-support.ts";
import { createPageState } from "./chat-state-page.ts";
import { openSlot } from "./sidebar-layout.ts";

describe("chat pane workspace rendering", () => {
  it("keeps an inactive stored workspace tab off files and artifacts", async () => {
    const request = vi.fn(async (method: string) =>
      method === "sessions.workspace.status"
        ? { sessionKey: "agent:main:current", gitCheckout: true }
        : {},
    );
    const listFiles = vi.fn(async () => ({
      sessionKey: "agent:main:current",
      files: [],
    }));
    const client = createGatewayBrowserClientFixture({ request });
    const sessions = createSessionCapabilityFixture({ listFiles, state: { modelOverrides: {} } });
    const { pane } = createTestChatPane({ client, sessions });
    const state = createPageState(
      pane.context,
      { afterCommit: () => () => undefined, invalidate: () => undefined },
      pane,
    );
    state.client = client;
    state.connected = true;
    state.connectionEpoch = 4;
    state.sessionKey = "agent:main:current";
    pane.state = state;
    const agentsList = { agents: [{ id: "main" }], defaultId: "main" };
    state.agentsList = agentsList;
    pane.context.agents.state.agentsList = agentsList;
    state.sidebarLayout = openSlot(openSlot({ columns: [] }, "workspace"), "terminal");

    pane.render();

    await vi.waitFor(() =>
      expect(request).toHaveBeenCalledWith("sessions.workspace.status", {
        agentId: "main",
        sessionKey: "agent:main:current",
      }),
    );
    expect(listFiles).not.toHaveBeenCalled();
    expect(request.mock.calls.some(([method]) => method === "artifacts.list")).toBe(false);
  });
});
