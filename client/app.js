console.log('ChirpTalks client loaded');

// --- Basic Auth UI and Logic ---
const apiBase = 'http://localhost:5000/api';

document.body.innerHTML += `
  <div id="auth">
    <h2>Register</h2>
    <form id="registerForm">
      <input type="text" id="regUsername" placeholder="Username" required><br>
      <input type="email" id="regEmail" placeholder="Email" required><br>
      <input type="password" id="regPassword" placeholder="Password" required><br>
      <button type="submit">Register</button>
    </form>
    <h2>Login</h2>
    <form id="loginForm">
      <input type="email" id="loginEmail" placeholder="Email" required><br>
      <input type="password" id="loginPassword" placeholder="Password" required><br>
      <button type="submit">Login</button>
    </form>
    <div id="authMsg"></div>
  </div>
  <div id="protected" style="display:none;">
    <h2>Protected Message</h2>
    <button id="getMsg">Get Message</button>
    <div id="msgResult"></div>
  </div>
`;

// --- Message Posting and Feed ---
const messageSection = document.createElement('div');
messageSection.id = 'messages';
document.body.appendChild(messageSection);

function renderMessageForm() {
  if (!localStorage.getItem('jwt')) return;
  messageSection.innerHTML = `
    <h2>Post a Message</h2>
    <form id="msgForm">
      <textarea id="msgContent" maxlength="250" placeholder="What's on your mind? (max 250 chars)" required></textarea><br>
      <button type="submit">Post</button>
    </form>
    <div id="msgPostMsg"></div>
    <h2>Messages</h2>
    <div id="msgFeed"></div>
  `;
  document.getElementById('msgForm').onsubmit = async (e) => {
    e.preventDefault();
    const content = document.getElementById('msgContent').value;
    const token = localStorage.getItem('jwt');
    const res = await fetch(`${apiBase}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    document.getElementById('msgPostMsg').innerText = data.message || 'Posted!';
    if (res.ok) {
      document.getElementById('msgContent').value = '';
      fetchMessages();
    }
  };
}

// Helper: get current user from JWT
function getCurrentUserId() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

function renderMessageFeed(messages) {
  const feed = document.getElementById('msgFeed') || messageSection;
  if (!messages.length) {
    feed.innerHTML = '<p>No messages yet.</p>';
    return;
  }
  const userId = getCurrentUserId();
  feed.innerHTML = messages.map(msg => {
    const liked = userId && msg.likes && msg.likes.includes(userId);
    const likeIcon = liked ? '❤️' : '🤍';
    const likeBtn = userId ? `<button class="likeBtn" data-id="${msg._id}">${likeIcon} ${msg.likes.length}</button>` : `<span>${likeIcon} ${msg.likes.length}</span>`;
    const commentsHtml = (msg.comments || []).map(c => `<div class="comment"><b>${c.userId?.username || 'User'}:</b> ${c.text} <span style='color:gray;font-size:0.8em;'>${new Date(c.timestamp).toLocaleString()}</span></div>`).join('');
    const commentForm = userId ? `<form class="commentForm" data-id="${msg._id}"><input type="text" maxlength="200" placeholder="Add a comment..." required><button type="submit">Comment</button></form>` : '';
    let editDelete = '';
    if (userId && msg.author && msg.author._id === userId) {
      editDelete = ` <span class='editMsg' data-id='${msg._id}' style='cursor:pointer;' title='Edit'>✏️</span> <span class='deleteMsg' data-id='${msg._id}' style='cursor:pointer;' title='Delete'>🗑️</span>`;
    }
    return `
      <div class="msg" data-id="${msg._id}">
        <div><b>${msg.author?.username || 'Unknown'}</b> <span style="color:gray;font-size:0.9em;">${new Date(msg.timestamp).toLocaleString()}</span>${editDelete}</div>
        <div class="msgContent">${msg.content}</div>
        <div>${likeBtn}</div>
        <div class="comments">${commentsHtml}</div>
        ${commentForm}
      </div>
    `;
  }).join('');

  // Like button logic
  document.querySelectorAll('.likeBtn').forEach(btn => {
    btn.onclick = async (e) => {
      const id = btn.getAttribute('data-id');
      const token = localStorage.getItem('jwt');
      if (!token) return;
      const res = await fetch(`${apiBase}/messages/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) fetchMessages();
    };
  });

  // Comment form logic
  document.querySelectorAll('.commentForm').forEach(form => {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const id = form.getAttribute('data-id');
      const input = form.querySelector('input');
      const text = input.value;
      const token = localStorage.getItem('jwt');
      if (!token) return;
      const res = await fetch(`${apiBase}/messages/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        input.value = '';
        fetchMessages();
      }
    };
  });

  // Edit message logic
  document.querySelectorAll('.editMsg').forEach(icon => {
    icon.onclick = (e) => {
      const id = icon.getAttribute('data-id');
      const msgDiv = icon.closest('.msg');
      const contentDiv = msgDiv.querySelector('.msgContent');
      const oldContent = contentDiv.innerText;
      contentDiv.innerHTML = `<textarea class='editArea' maxlength='250' style='width:90%'>${oldContent}</textarea><button class='saveEditBtn'>Save</button> <button class='cancelEditBtn'>Cancel</button>`;
      msgDiv.querySelector('.saveEditBtn').onclick = async () => {
        const newContent = msgDiv.querySelector('.editArea').value;
        const token = localStorage.getItem('jwt');
        if (!token) return;
        const res = await fetch(`${apiBase}/messages/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ content: newContent })
        });
        if (res.ok) fetchMessages();
      };
      msgDiv.querySelector('.cancelEditBtn').onclick = () => {
        contentDiv.innerText = oldContent;
      };
    };
  });

  // Delete message logic
  document.querySelectorAll('.deleteMsg').forEach(icon => {
    icon.onclick = async (e) => {
      const id = icon.getAttribute('data-id');
      if (!confirm('Delete this message?')) return;
      const token = localStorage.getItem('jwt');
      if (!token) return;
      const res = await fetch(`${apiBase}/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) fetchMessages();
    };
  });
}

// --- Socket.io Real-time Integration ---
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
document.head.appendChild(script);

let socket;
function setupSocket() {
  if (socket) return;
  socket = io('http://localhost:5000');
  socket.on('newMessage', msg => {
    // Add new message to the top of the feed
    window._messages = [msg, ...(window._messages || [])];
    renderMessageFeed(window._messages);
  });
  socket.on('messageUpdated', updatedMsg => {
    // Update the specific message in the feed
    if (!window._messages) return;
    window._messages = window._messages.map(m => m._id === updatedMsg._id ? updatedMsg : m);
    renderMessageFeed(window._messages);
  });
  socket.on('messageDeleted', data => {
    if (!window._messages) return;
    window._messages = window._messages.filter(m => m._id !== data._id);
    renderMessageFeed(window._messages);
  });
}

// Patch fetchMessages to keep a local cache for real-time updates
async function fetchMessages() {
  try {
    const res = await fetch(`${apiBase}/messages`);
    const messages = await res.json();
    window._messages = messages;
    renderMessageFeed(messages);
    setupSocket();
  } catch (error) {
    console.error('Error fetching messages:', error);
    const feed = document.getElementById('msgFeed') || messageSection;
    feed.innerHTML = '<p>Error loading messages. Please try again later.</p>';
  }
}

// Show/hide message form based on login
function updateUIOnAuth() {
  if (localStorage.getItem('jwt')) {
    if (document.getElementById('auth')) document.getElementById('auth').style.display = 'none';
    if (document.getElementById('protected')) document.getElementById('protected').style.display = 'block';
    renderMessageForm();
    fetchMessages();
  } else {
    messageSection.innerHTML = '<h2>Messages</h2><div id="msgFeed"></div>';
    fetchMessages();
  }
}

// On page load
updateUIOnAuth();

// Register
const registerForm = document.getElementById('registerForm');
registerForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const res = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  document.getElementById('authMsg').innerText = data.message || 'Registered!';
  if (res.ok) {
    // Optionally auto-login after register
    // localStorage.setItem('jwt', data.token);
    // updateUIOnAuth();
  }
};

// Login
const loginForm = document.getElementById('loginForm');
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('jwt', data.token);
    updateUIOnAuth();
  } else {
    document.getElementById('authMsg').innerText = data.message || 'Login failed.';
  }
};

// Protected message
const getMsgBtn = document.getElementById('getMsg');
getMsgBtn.onclick = async () => {
  const token = localStorage.getItem('jwt');
  const res = await fetch(`${apiBase}/messages`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  document.getElementById('msgResult').innerText = data.message || data.error || 'No message.';
};

// --- Dark Mode Toggle ---
function setTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
  themeToggleBtn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  setTheme(isDark ? 'light' : 'dark');
}

const themeToggleBtn = document.createElement('button');
themeToggleBtn.id = 'themeToggle';
themeToggleBtn.onclick = toggleTheme;
document.body.appendChild(themeToggleBtn);

// On load, apply saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// Register password show/hide
document.getElementById('showRegPassword').onchange = function() {
  const pwd = document.getElementById('regPassword');
  pwd.type = this.checked ? 'text' : 'password';
};

// Login password show/hide
document.getElementById('showLoginPassword').onchange = function() {
  const pwd = document.getElementById('loginPassword');
  pwd.type = this.checked ? 'text' : 'password';
};
