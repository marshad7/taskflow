const request = require("supertest");
const { createApp } = require("../src/app");

async function registerAndLogin(agent, email) {
  await agent.post("/auth/register").send({ email, password: "password123" });
}

describe("tasks", () => {
  test("tasks require auth", async () => {
    const app = createApp();
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(401);
  });

  test("create/list/update/delete task", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await registerAndLogin(agent, "crud@example.com");

    const created = await agent
      .post("/tasks")
      .send({ title: "Finish CRUD", priority: "high", status: "doing" });

    expect(created.statusCode).toBe(201);
    const id = created.body.task.id;

    const list1 = await agent.get("/tasks");
    expect(list1.statusCode).toBe(200);
    expect(list1.body.tasks.length).toBe(1);

    const updated = await agent.put(`/tasks/${id}`).send({ status: "done" });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.task.status).toBe("done");
    expect(updated.body.task.completed_at).toBeTruthy();

    const del = await agent.delete(`/tasks/${id}`);
    expect(del.statusCode).toBe(200);
    expect(del.body.ok).toBe(true);

    const list2 = await agent.get("/tasks");
    expect(list2.body.tasks.length).toBe(0);
  });

  test("users cannot see each other’s tasks", async () => {
    const app = createApp();
    const a = request.agent(app);
    const b = request.agent(app);

    await registerAndLogin(a, "usera@example.com");
    await registerAndLogin(b, "userb@example.com");

    await a.post("/tasks").send({ title: "A task" });
    await b.post("/tasks").send({ title: "B task" });

    const aList = await a.get("/tasks");
    const bList = await b.get("/tasks");

    expect(aList.body.tasks.length).toBe(1);
    expect(aList.body.tasks[0].title).toBe("A task");

    expect(bList.body.tasks.length).toBe(1);
    expect(bList.body.tasks[0].title).toBe("B task");
  });

  test("create task rejects empty title (400)", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await registerAndLogin(agent, "v1@example.com");

    const res = await agent.post("/tasks").send({ title: "" });
    expect(res.statusCode).toBe(400);
  });

  test("update task rejects invalid status (400)", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await registerAndLogin(agent, "v2@example.com");

    const created = await agent.post("/tasks").send({ title: "Test task" });
    expect(created.statusCode).toBe(201);

    const id = created.body.task.id;

    const res = await agent.put(`/tasks/${id}`).send({ status: "finished" });
    expect(res.statusCode).toBe(400);
  });
});
