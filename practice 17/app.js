const STORAGE_KEY = 'taskflow_tasks';
const SERVER_URL  = 'https://localhost:3001';

const appContent  = document.getElementById('app-content');
const homeBtn     = document.getElementById('home-btn');
const aboutBtn    = document.getElementById('about-btn');
const statusBadge = document.getElementById('status-badge');
const statusLabel = statusBadge.querySelector('.status-label');
const toast       = document.getElementById('toast');
const enableBtn   = document.getElementById('enable-push');
const disableBtn  = document.getElementById('disable-push');

let toastTimer = null;
function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function setActiveNav(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  appContent.innerHTML = '<div class="loading-placeholder">Загрузка...</div>';
  try {
    const response = await fetch(`/content/${page}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    appContent.innerHTML = html;
    if (page === 'home') initTasks();
  } catch (err) {
    appContent.innerHTML = `<p class="load-error">Ошибка загрузки страницы. Проверьте соединение.</p>`;
    console.error('[App Shell] Ошибка загрузки:', err);
  }
}

homeBtn.addEventListener('click', () => { setActiveNav('home-btn'); loadContent('home'); });
aboutBtn.addEventListener('click', () => { setActiveNav('about-btn'); loadContent('about'); });
loadContent('home');

function generateId() {
  return Date.now();
}

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  const list       = document.getElementById('tasks-list');
  const emptyState = document.getElementById('empty-state');
  const controls   = document.getElementById('controls');
  const taskCount  = document.getElementById('task-count');
  if (!list) return;

  const tasks = loadTasks();
  list.innerHTML = '';
  const total     = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;

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

    const textWrap = document.createElement('span');
    textWrap.className = 'task-text';

    const textNode = document.createTextNode(task.text);
    textWrap.appendChild(textNode);

    if (task.reminder) {
      const reminderBadge = document.createElement('small');
      reminderBadge.className = 'reminder-badge';
      const date = new Date(task.reminder);
      reminderBadge.textContent = `${date.toLocaleString('ru-RU')}`;
      textWrap.appendChild(document.createElement('br'));
      textWrap.appendChild(reminderBadge);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'task-delete';
    delBtn.setAttribute('aria-label', 'Удалить задачу');
    delBtn.innerHTML = '×';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(textWrap);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function addTask(text, reminderTimestamp = null) {
  const tasks   = loadTasks();
  const newTask = {
    id:       generateId(),
    text:     text.trim(),
    done:     false,
    reminder: reminderTimestamp
  };
  tasks.unshift(newTask);
  saveTasks(tasks);
  renderTasks();

  if (reminderTimestamp) {
    showToast('Напоминание запланировано');
    if (socket && socket.connected) {
      socket.emit('newReminder', {
        id:           newTask.id,
        text:         text.trim(),
        reminderTime: reminderTimestamp
      });
    }
  } else {
    showToast('✓ Задача добавлена');
    if (socket && socket.connected) {
      socket.emit('newTask', { text: text.trim(), timestamp: Date.now() });
    }
  }
}

function toggleTask(id) {
  const tasks = loadTasks();
  const task  = tasks.find(t => t.id === id);
  if (task) { task.done = !task.done; saveTasks(tasks); renderTasks(); }
}

function deleteTask(id) {
  saveTasks(loadTasks().filter(t => t.id !== id));
  renderTasks();
  showToast('Задача удалена');
}

function initTasks() {
  renderTasks();

  const form        = document.getElementById('task-form');
  const input       = document.getElementById('task-input');
  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');
  const clearDone   = document.getElementById('clear-done');
  const clearAll    = document.getElementById('clear-all');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTask(text);
    input.value = '';
    input.focus();
  });

  reminderForm.addEventListener('submit', e => {
    e.preventDefault();
    const text     = reminderText.value.trim();
    const datetime = reminderTime.value;
    if (!text || !datetime) return;
    const timestamp = new Date(datetime).getTime();
    if (timestamp <= Date.now()) {
      alert('Дата напоминания должна быть в будущем!');
      return;
    }
    addTask(text, timestamp);
    reminderText.value = '';
    reminderTime.value = '';
  });

  clearDone.addEventListener('click', () => {
    saveTasks(loadTasks().filter(t => !t.done));
    renderTasks();
    showToast('Выполненные удалены');
  });

  clearAll.addEventListener('click', () => {
    if (!confirm('Удалить все задачи?')) return;
    saveTasks([]);
    renderTasks();
    showToast('Список очищен');
  });
}

function updateNetworkStatus() {
  if (navigator.onLine) {
    statusBadge.className = 'status-badge online';
    statusLabel.textContent = 'онлайн';
  } else {
    statusBadge.className = 'status-badge offline';
    statusLabel.textContent = 'офлайн';
  }
}
window.addEventListener('online',  updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

let socket = null;

try {
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    timeout: 5000
  });

  socket.on('connect', () => console.log('[Socket.IO] Подключён, id:', socket.id));
  socket.on('disconnect', () => console.log('[Socket.IO] Отключён'));

  socket.on('taskAdded', (task) => {
    console.log('[Socket.IO] Задача от другого клиента:', task);
    const notification = document.createElement('div');
    notification.className = 'ws-notification';
    notification.textContent = `🔔 Новая задача: ${task.text}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3500);
  });

} catch (err) {
  console.warn('[Socket.IO] Не удалось подключиться:', err);
}

const VAPID_PUBLIC_KEY = 'BF3hMzWLmlPCGty0JMFwRPJqLlUmOZAjjZmFkmzecNeD6VESEFIYsdkcv2eRaOg98us4C4ghBBFSJt5OYXZJkIU';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push-уведомления не поддерживаются в этом браузере.');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch(`${SERVER_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('[Push] Подписка отправлена на сервер');
    showToast('🔔 Push-уведомления включены');
  } catch (err) {
    console.error('[Push] Ошибка подписки:', err);
    showToast('Ошибка подключения push-уведомлений');
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch(`${SERVER_URL}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
      console.log('[Push] Отписка выполнена');
      showToast('🔕 Push-уведомления отключены');
    }
  } catch (err) {
    console.error('[Push] Ошибка отписки:', err);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Зарегистрирован, scope:', reg.scope);

      const existingSubscription = await reg.pushManager.getSubscription();
      if (existingSubscription) {
        enableBtn.style.display  = 'none';
        disableBtn.style.display = 'inline-block';
      }

      enableBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
          alert('Уведомления запрещены. Разрешите их в настройках браузера.');
          return;
        }
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            alert('Необходимо разрешить уведомления.');
            return;
          }
        }
        await subscribeToPush();
        enableBtn.style.display  = 'none';
        disableBtn.style.display = 'inline-block';
      });

      disableBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        disableBtn.style.display = 'none';
        enableBtn.style.display  = 'inline-block';
      });

    } catch (err) {
      console.error('[SW] Ошибка регистрации:', err);
    }
  });
}