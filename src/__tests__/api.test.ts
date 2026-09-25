import { beforeEach, describe, expect, test, vi } from "vitest";
import { QbtClient } from "@/api/qbt";

describe("QbtClient", () => {
  let client: QbtClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Isolate session persistence: a previous successful login writes the SID
    // to localStorage, and a new client's constructor would restore it, making
    // isLoggedIn falsely true. localStorage availability varies across runtimes
    // (present in CI, absent locally); optional chaining is safe on both ends
    globalThis.localStorage?.clear();
    client = new QbtClient({ baseUrl: "http://localhost:8080" });
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  test("login sends correct params and extracts SID", async () => {
    fetchSpy.mockResolvedValue(
      new Response("Ok.", {
        status: 200,
        headers: { "set-cookie": "SID=test-sid-123; path=/" },
      }),
    );

    await client.login({ username: "admin", password: "adminadmin" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/v2/auth/login");
    expect(options.method).toBe("POST");
    expect(client.isLoggedIn()).toBe(true);
  });

  test("login handles 403 (IP banned)", async () => {
    fetchSpy.mockResolvedValue(new Response("Forbidden", { status: 403 }));

    await expect(client.login({ username: "admin", password: "wrong" })).rejects.toThrow(
      "IP banned",
    );

    expect(client.isLoggedIn()).toBe(false);
  });

  test("checkLocalAuthBypass detects no-auth mode", async () => {
    fetchSpy.mockResolvedValue(new Response("v5.0.0", { status: 200 }));

    const result = await client.checkLocalAuthBypass();
    expect(result).toBe(true);
    expect(client.isLoggedIn()).toBe(true);
  });

  test("checkLocalAuthBypass returns false when auth required", async () => {
    fetchSpy.mockResolvedValue(new Response("Forbidden", { status: 403 }));

    const result = await client.checkLocalAuthBypass();
    expect(result).toBe(false);
  });

  test("getTransferInfo calls correct endpoint", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          dl_info_speed: 1024000,
          up_info_speed: 256000,
          dl_info_data: 1048576,
          up_info_data: 524288,
          dl_rate_limit: -1,
          up_rate_limit: -1,
          dht_nodes: 42,
          connection_status: "connected",
          fresh_session: false,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const info = await client.getTransferInfo();
    expect(info.dl_info_speed).toBe(1024000);
    expect(info.dht_nodes).toBe(42);
    expect(info.connection_status).toBe("connected");
  });

  test("logout clears auth state", async () => {
    fetchSpy.mockResolvedValue(new Response("Ok.", { status: 200 }));
    await client.logout();
    expect(client.isLoggedIn()).toBe(false);
  });
});
