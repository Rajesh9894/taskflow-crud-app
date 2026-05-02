// API URL
const API = "http://127.0.0.1:8000/api";

// Global Variables
let editId = null;
let deleteId = null;
let searchTimer = null;

// Load Tasks

async function loadTasks() {
  let search = document.getElementById("searchInput").value;
  let status = document.getElementById("statusFilter").value;
  let priority = document.getElementById("priorityFilter").value;

  let url = API + "/tasks/?";

  if (search) {
    url += "search=" + search + "&";
  }

  if (status) {
    url += "status=" + status + "&";
  }

  if (priority) {
    url += "priority=" + priority + "&";
  }

  let tbody = document.getElementById("taskTableBody");

  // Loading Spinner
  tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:40px;">
                <div class="spinner"></div>
            </td>
        </tr>
    `;

  try {
    let response = await fetch(url);
    let data = await response.json();

    let tasks = data.results || data;

    showTasks(tasks);
    loadStats();
  } catch (error) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">⚠</div>
                        <h3>API Connection Failed</h3>
                        <p>Run Django server on port 8000</p>
                    </div>
                </td>
            </tr>
        `;
  }
}

// Show Tasks in Table

function showTasks(tasks) {
  let tbody = document.getElementById("taskTableBody");

  if (tasks.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">☑</div>
                        <h3>No Tasks Found</h3>
                        <p>Create task or change filter</p>
                    </div>
                </td>
            </tr>
        `;
    return;
  }

  let rows = "";

  tasks.forEach((task) => {
    let statusText = "To Do";

    if (task.status === "in_progress") {
      statusText = "In Progress";
    }

    if (task.status === "done") {
      statusText = "Done";
    }

    let priorityText =
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    let createdDate = task.created_at ? task.created_at.slice(0, 10) : "-";

    let dueDate = task.due_date || "-";

    let description = task.description
      ? `<div class="task-desc">${task.description}</div>`
      : "";

    rows += `
            <tr>
                <td>
                    <div class="task-title">${task.title}</div>
                    ${description}
                </td>

                <td>
                    <span class="badge badge-${task.status}">
                        ${statusText}
                    </span>
                </td>

                <td>
                    <span class="badge badge-${task.priority}">
                        ${priorityText}
                    </span>
                </td>

                <td class="tag">${dueDate}</td>
                <td class="tag">${createdDate}</td>

                <td>
                    <div class="actions">

                        <button
                            class="btn btn-secondary btn-sm"
                            onclick="openEditModal(${task.id})">
                            Edit
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="openDeleteModal(${task.id}, '${task.title}')">
                            Delete
                        </button>

                    </div>
                </td>
            </tr>
        `;
  });

  tbody.innerHTML = rows;
}

// Load Dashboard Stats

async function loadStats() {
  try {
    let response = await fetch(API + "/tasks/stats/");
    let data = await response.json();

    document.getElementById("statTotal").textContent = data.total;
    document.getElementById("statTodo").textContent = data.todo;
    document.getElementById("statProgress").textContent = data.in_progress;
    document.getElementById("statDone").textContent = data.done;

    document.getElementById("badgeTotal").textContent = data.total;

    document.getElementById("pageSub").textContent =
      data.total + " Tasks | " + data.done + " Completed";
  } catch (error) {
    console.log("Stats failed");
  }
}

// Open Create Modal

function openCreateModal() {
  editId = null;

  document.getElementById("modalTitle").textContent = "Create Task";
  document.getElementById("saveBtn").textContent = "Create Task";

  document.getElementById("fieldTitle").value = "";
  document.getElementById("fieldDesc").value = "";
  document.getElementById("fieldPriority").value = "medium";
  document.getElementById("fieldStatus").value = "todo";
  document.getElementById("fieldDue").value = "";

  document.getElementById("taskModal").classList.add("show");
}

// Open Edit Modal

async function openEditModal(id) {
  editId = id;

  try {
    let response = await fetch(API + "/tasks/" + id + "/");
    let task = await response.json();

    document.getElementById("modalTitle").textContent = "Edit Task";
    document.getElementById("saveBtn").textContent = "Update Task";

    document.getElementById("fieldTitle").value = task.title;
    document.getElementById("fieldDesc").value = task.description;
    document.getElementById("fieldPriority").value = task.priority;
    document.getElementById("fieldStatus").value = task.status;
    document.getElementById("fieldDue").value = task.due_date || "";

    document.getElementById("taskModal").classList.add("show");
  } catch (error) {
    showToast("Failed to load task", "error");
  }
}

// Save Task (Create + Update)

async function saveTask() {
  let title = document.getElementById("fieldTitle").value.trim();

  if (title.length < 3) {
    showToast("Title minimum 3 letters", "error");
    return;
  }

  let taskData = {
    title: title,
    description: document.getElementById("fieldDesc").value,
    priority: document.getElementById("fieldPriority").value,
    status: document.getElementById("fieldStatus").value,
    due_date: document.getElementById("fieldDue").value || null,
  };

  let url = API + "/tasks/";
  let method = "POST";

  if (editId) {
    url = API + "/tasks/" + editId + "/";
    method = "PUT";
  }

  try {
    await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    showToast(editId ? "Task Updated" : "Task Created");

    closeModal("taskModal");
    loadTasks();
  } catch (error) {
    showToast("Save Failed", "error");
  }
}

// Delete Popup

function openDeleteModal(id, name) {
  deleteId = id;

  document.getElementById("deleteTaskName").textContent = name;

  document.getElementById("deleteModal").classList.add("show");
}

// Confirm Delete

async function confirmDelete() {
  try {
    await fetch(API + "/tasks/" + deleteId + "/", {
      method: "DELETE",
    });

    showToast("Task Deleted");

    closeModal("deleteModal");

    loadTasks();
  } catch (error) {
    showToast("Delete Failed", "error");
  }
}

// Close Modal

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

// Filters

function applyFilters() {
  loadTasks();
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("priorityFilter").value = "";

  loadTasks();
}

// Search Delay

function debounceSearch() {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(function () {
    loadTasks();
  }, 300);
}

//Setview

function setView(status) {

    document.getElementById("statusFilter").value =
        status === "all" ? "" : status;

    if (status === "all") {
        document.getElementById("pageTitle").innerText = "All Tasks";
    }
    else if (status === "todo") {
        document.getElementById("pageTitle").innerText = "To Do Tasks";
    }
    else if (status === "in_progress") {
        document.getElementById("pageTitle").innerText = "In Progress Tasks";
    }
    else if (status === "done") {
        document.getElementById("pageTitle").innerText = "Done Tasks";
    }

    loadTasks();
}

// Toast Message

function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");

  let toast = document.createElement("div");

  toast.className = "toast " + type;
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(function () {
    toast.remove();
  }, 3000);
}

// Page Load

loadTasks();
