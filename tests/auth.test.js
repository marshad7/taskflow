const request = require("supertest");
const { createApp } = require("../src/app");

describe("auth", () => {
  test("register -> me -> logout works", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const reg = await agent
      .post("/auth/register")
      .send({ email: "test@example.com", password: "password123" });

    expect(reg.statusCode).toBe(201);
    expect(reg.body.user.email).toBe("test@example.com");

    const me = await agent.get("/auth/me");
    expect(me.statusCode).toBe(200);
    expect(me.body.user.email).toBe("test@example.com");

    const out = await agent.post("/auth/logout");
    expect(out.statusCode).toBe(200);
    expect(out.body.ok).toBe(true);

    const me2 = await agent.get("/auth/me");
    expect(me2.statusCode).toBe(401);
  });
});
