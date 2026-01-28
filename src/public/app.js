// src/public/app.js

const $ = (id) => document.getElementById(id);

// Read and update CSRF token in <meta>
function getCsrfToken() {
  const el = document.querySelector('meta[name="csrf-token"]');
  return el ? el.getAttribute("content") : "";
}

function setCsrfToken(token) {
  const el = document.querySelector('meta[name="csrf-token"]');
  if (el) el.setAttribute("content", token || "");
}

async function refreshCsrfToken() {
  const res = await fetch("/csrf", { credentials: "same-origin" });
  if (!res.ok) return "";
  const data = await res.json().catch(() => null);
  const token = data?.csrfToken || "";
  if (token) setCsrfToken(token);
  return token;
}

// Auth elements
const emailEl = $("email");
const passwordEl = $("password");
const loginBtn = $("loginBtn");
const registerBtn = $("registerBtn");
const logoutBtn = $("logoutBtn");
const authStatus = $("authStatus");
const registerHint = $("registerHint");
const registerLink = $("registerLink");
const errorBanner = $("errorBanner");

// Task creation
const taskTitleEl = $("taskTitle");
const taskDescriptionEl = $("taskDescription");
const prioritySelectEl = $("prioritySelect");
const dueDateInputEl = $("dueDateInput");
const addBtn = $("addBtn");

// Filters
const searchInputEl = $("searchInput");
const statusFilterEl = $("statusFilter");
const priorityFilterEl = $("priorityFilter");
const applyFiltersBtn = $("applyFiltersBtn");

// Pagination
const prevPageBtn = $("prevPageBtn");
const nextPageBtn = $("nextPageBtn");
const pageInfoEl = $("pageInfo");

// Task list
const taskListEl = $("taskList");

// Global state
const state = {
  user: null,
  limit: 5,
  offset: 0,
  total: 0,
  q: "",
  status: "",
  priority: "",
};

// Error banner + hint
function showError(msg) {
  if (!msg) {
    errorBanner.style.display = "none";
    errorBanner.textContent = "";
    return;
  }
  errorBanner.style.display = "block";
  errorBanner.textContent = msg;
}

function showRegisterHint(show) {
  registerHint.style.display = show ? "block" : "none";
}

function clearAuthInputs() {
  emailEl.value = "";
  passwordEl.value = "";
}

// Enable / disable UI based on auth
function setAuthedUI(isAuthed) {
  loginBtn.style.display = isAuthed ? "none" : "inline-block";
  registerBtn.style.display = isAuthed ? "none" : "inline-block";
  logoutBtn.style.display = isAuthed ? "inline-block" : "none";

  // also disable when authed (quick win)
  loginBtn.disabled = isAuthed;
  registerBtn.disabled = isAuthed;

  taskTitleEl.disabled = !isAuthed;
  taskDescriptionEl.disabled = !isAuthed;
  prioritySelectEl.disabled = !isAuthed;
  dueDateInputEl.disabled = !isAuthed;
  addBtn.disabled = !isAuthed;

  searchInputEl.disabled = !isAuthed;
  statusFilterEl.disabled = !isAuthed;
  priorityFilterEl.disabled = !isAuthed;
  applyFiltersBtn.disabled = !isAuthed;

  prevPageBtn.disabled = !isAuthed;
  nextPageBtn.disabled = !isAuthed;
}

// Query string helper
function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// Detect CSRF error
function isCsrfError(status, text) {
  if (status !== 403) return false;
  const t = (text || "").toLowerCase();
  return t.includes("csrf");
}

// API helper with automatic CSRF refresh + retry once
async function api(url, opts = {}) {
  showError("");
  showRegisterHint(false);

  const method = (opts.method || "GET").toUpperCase();
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = { ...(opts.headers || {}) };

  const hasBody = opts.body !== undefined && opts.body !== null;
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (isWrite) {
    const token = getCsrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const doFetch = async () => {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers,
      ...opts,
    });

    const ct = res.headers.get("content-type") || "";
    let data = null;
    let text = "";

    if (ct.includes("application/json")) {
      data = await res.json().catch(() => null);
      text = data ? JSON.stringify(data) : "";
    } else {
      text = await res.text().catch(() => "");
    }

    return { res, data, text };
  };

  let { res, data, text } = await doFetch();

  if (isCsrfError(res.status, (data && (data.error || data.message)) || text)) {
    await refreshCsrfToken();

    if (isWrite) {
      const newToken = getCsrfToken();
      if (newToken) headers["X-CSRF-Token"] = newToken;
    }

    ({ res, data, text } = await doFetch());
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      (text && text.trim()) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data;
}

// Check session
async function checkSession() {
  try {
    const data = await api("/auth/me");
    state.user = data.user;
    authStatus.textContent = `Logged in as ${data.user.email}`;
    setAuthedUI(true);
    state.offset = 0;
    await fetchTasks();
  } catch {
    state.user = null;
    authStatus.textContent = "Not logged in";
    setAuthedUI(false);
    taskListEl.innerHTML = "";
    pageInfoEl.textContent = "Page 1 / 1";
  }
}

// Login
async function login() {
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  if (!email || !password) {
    showError("Email and password required.");
    return;
  }

  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    state.user = data.user;
    authStatus.textContent = `Logged in as ${data.user.email}`;
    setAuthedUI(true);
    state.offset = 0;

    clearAuthInputs();
    await refreshCsrfToken();
    await fetchTasks();
  } catch (e) {
    if (e.status === 404) {
      showError("Account not found. You can register now.");
      showRegisterHint(true);
      return;
    }
    if (e.status === 401) {
      showError("Incorrect password.");
      showRegisterHint(false);
      return;
    }
    showError(e.message);
  }
}

// Register
async function register() {
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  if (!email || !password) {
    showError("Email and password required.");
    return;
  }

  try {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    state.user = data.user;
    authStatus.textContent = `Logged in as ${data.user.email}`;
    setAuthedUI(true);
    state.offset = 0;

    clearAuthInputs();
    await refreshCsrfToken();
    await fetchTasks();
  } catch (e) {
    showError(e.message);
  }
}

// Logout
async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {}

  state.user = null;
  authStatus.textContent = "Not logged in";
  setAuthedUI(false);
  taskListEl.innerHTML = "";
  pageInfoEl.textContent = "Page 1 / 1";

  await refreshCsrfToken();
}

loginBtn.addEventListener("click", login);
registerBtn.addEventListener("click", register);
logoutBtn.addEventListener("click", logout);

registerLink.addEventListener("click", (e) => {
  e.preventDefault();
  register();
});

// Enter = login
passwordEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

// Date helpers
function formatDueDate(due_date) {
  if (!due_date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(due_date)) return due_date;

  const d = new Date(due_date);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function updateTask(id, patch) {
  await api(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

async function deleteTask(id) {
  await api(`/tasks/${id}`, { method: "DELETE" });
}

function renderTaskRow(task) {
  const li = document.createElement("li");
  li.className = "task-row";

  // Due-date intelligence
  const dueISO = formatDueDate(task.due_date);
  const tISO = todayISO();

  if (dueISO && task.status !== "done") {
    if (dueISO < tISO) li.classList.add("overdue");
    else if (dueISO === tISO) li.classList.add("due-today");
  }

  const left = document.createElement("div");
  left.className = "task-left";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  const desc = document.createElement("div");
  desc.className = "task-desc";
  desc.textContent = task.description || "";

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.textContent = `[${task.status}] (${task.priority})${dueISO ? ` • due ${dueISO}` : ""}`;

  const right = document.createElement("div");
  right.className = "task-controls";

  const status = document.createElement("select");
  status.innerHTML = `
    <option value="todo">Todo</option>
    <option value="doing">Doing</option>
    <option value="done">Done</option>
  `;
  status.value = task.status;

  const priority = document.createElement("select");
  priority.innerHTML = `
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  `;
  priority.value = task.priority;

  const due = document.createElement("input");
  due.type = "date";
  due.value = dueISO;

  const del = document.createElement("button");
  del.textContent = "Delete";

  status.addEventListener("change", async () => {
    await updateTask(task.id, { status: status.value });
    fetchTasks();
  });

  priority.addEventListener("change", async () => {
    await updateTask(task.id, { priority: priority.value });
    fetchTasks();
  });

  due.addEventListener("change", async () => {
    await updateTask(task.id, { due_date: due.value || null });
    fetchTasks();
  });

  del.addEventListener("click", async () => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(task.id);
    fetchTasks();
  });

  // Inline title editing
  title.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.title;

    left.replaceChild(input, title);
    input.focus();
    input.select();

    const cancel = () => left.replaceChild(title, input);

    const save = async () => {
      const newTitle = input.value.trim();
      if (!newTitle) {
        showError("Title cannot be empty.");
        return;
      }
      await updateTask(task.id, { title: newTitle });
      fetchTasks();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", save);
  });

  // Inline description editing (click description)
  desc.addEventListener("click", () => {
    const textarea = document.createElement("textarea");
    textarea.rows = 2;
    textarea.style.width = "100%";
    textarea.value = task.description || "";

    left.replaceChild(textarea, desc);
    textarea.focus();
    textarea.select();

    const cancel = () => left.replaceChild(desc, textarea);

    const save = async () => {
      const newDesc = textarea.value.trim();
      await updateTask(task.id, { description: newDesc });
      fetchTasks();
    };

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cancel();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
    });

    textarea.addEventListener("blur", save);
  });

  left.appendChild(title);
  if (task.description) left.appendChild(desc);
  left.appendChild(meta);

  right.appendChild(status);
  right.appendChild(priority);
  right.appendChild(due);
  right.appendChild(del);

  li.appendChild(left);
  li.appendChild(right);

  return li;
}

async function fetchTasks() {
  if (!state.user) return;

  const url =
    "/tasks" +
    qs({
      limit: state.limit,
      offset: state.offset,
      q: state.q,
      status: state.status,
      priority: state.priority,
    });

  const data = await api(url);
  taskListEl.innerHTML = "";

  data.tasks.forEach((t) => taskListEl.appendChild(renderTaskRow(t)));

  state.total = data.page.total;

  const currentPage = Math.floor(state.offset / state.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(state.total / state.limit));

  pageInfoEl.textContent = `Page ${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = state.offset === 0;
  nextPageBtn.disabled = state.offset + state.limit >= state.total;
}

async function addTask() {
  const title = taskTitleEl.value.trim();
  const description = taskDescriptionEl.value.trim();

  if (!title) return showError("Task title required.");

  await api("/tasks", {
    method: "POST",
    body: JSON.stringify({
      title,
      description,
      priority: prioritySelectEl.value,
      due_date: dueDateInputEl.value || null,
    }),
  });

  taskTitleEl.value = "";
  taskDescriptionEl.value = "";
  dueDateInputEl.value = "";
  state.offset = 0;
  fetchTasks();
}

addBtn.addEventListener("click", addTask);

applyFiltersBtn.addEventListener("click", () => {
  state.q = searchInputEl.value.trim();
  state.status = statusFilterEl.value;
  state.priority = priorityFilterEl.value;
  state.offset = 0;
  fetchTasks();
});

prevPageBtn.addEventListener("click", () => {
  state.offset = Math.max(0, state.offset - state.limit);
  fetchTasks();
});

nextPageBtn.addEventListener("click", () => {
  state.offset += state.limit;
  fetchTasks();
});

// Boot
(async () => {
  await refreshCsrfToken();
  await checkSession();
})();
