// ──────────────────────────────────────────
// TaskFlow — app.js
// ──────────────────────────────────────────

const STORAGE_KEY = 'taskflow_tasks';

// DOM refs
const form       = document.getElementById('task-form');
const input      = document.getElementById('task-input');
const list       = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const controls   = document.getElementById('controls');
const clearDone  = document.getElementById('clear-done');
const clearAll   = document.getElementById('clear-all');
const taskCount  = document.getElementById('task-count');
const statusBadge = document.getElementById('status-badge');
const statusLabel = statusBadge.querySelector('.status-label');
const toast      = document.getElementById('toast');

let toastTimer = null;

// ── Утилиты ──────────────────────────────

function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── localStorage ─────────────────────────

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Рендер ───────────────────────────────

function renderTasks() {
  const tasks = loadTasks();
  list.innerHTML = '';

  const total = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;

  // пустое состояние
  if (total === 0) {
    emptyState.classList.remove('hidden');
    controls.classList.add('hidden');
    taskCount.textContent = '0 задач';
    return;
  }

  emptyState.classList.add('hidden');
  controls.classList.remove('hidden');
  taskCount.textContent = `${doneCount}/${total} выполнено`;

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Отметить выполненным');
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'task-delete';
    delBtn.setAttribute('aria-label', 'Удалить задачу');
    delBtn.innerHTML = '×';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// ── CRUD ─────────────────────────────────

function addTask(text) {
  const tasks = loadTasks();
  const newTask = { id: generateId(), text: text.trim(), done: false };
  tasks.unshift(newTask);
  saveTasks(tasks);
  renderTasks();
  showToast('✓ Задача добавлена');
}

function toggleTask(id) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks(tasks);
    renderTasks();
  }
}

function deleteTask(id) {
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
  showToast('Задача удалена');
}

// ── Обработчики ──────────────────────────

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = '';
  input.focus();
});

clearDone.addEventListener('click', () => {
  const tasks = loadTasks().filter(t => !t.done);
  saveTasks(tasks);
  renderTasks();
  showToast('Выполненные удалены');
});

clearAll.addEventListener('click', () => {
  if (!confirm('Удалить все задачи?')) return;
  saveTasks([]);
  renderTasks();
  showToast('Список очищен');
});

// ── Статус сети ──────────────────────────

function updateNetworkStatus() {
  if (navigator.onLine) {
    statusBadge.className = 'status-badge online';
    statusLabel.textContent = 'онлайн';
  } else {
    statusBadge.className = 'status-badge offline';
    statusLabel.textContent = 'офлайн';
    showToast('⚡ Работаем офлайн — данные сохранены', 3500);
  }
}

window.addEventListener('online',  updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

// ── Service Worker ────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Зарегистрирован, scope:', reg.scope);
    } catch (err) {
      console.error('[SW] Ошибка регистрации:', err);
    }
  });
}

// ── Старт ────────────────────────────────
renderTasks();