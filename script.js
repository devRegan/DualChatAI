// Load environment variables
const CONFIG = {
    API_KEY_1: '', // Will be loaded from settings
    API_KEY_2: '', // Will be loaded from settings
    API_URL_1: 'https://api.groq.com/openai/v1/chat/completions',
    API_URL_2: 'https://aimlapi.com/app/keys'
};

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const chatList = document.getElementById('chatList');
const newChatBtn = document.getElementById('newChatBtn');
const chatTitle = document.getElementById('chatTitle');
const renameChatBtn = document.getElementById('renameChatBtn');
const saveChatBtn = document.getElementById('saveChatBtn');
const toggleTokensBtn = document.getElementById('toggleTokensBtn');
const tokenInfo = document.getElementById('tokenInfo');
const currentChatTokensEl = document.getElementById('currentChatTokens');
const todayTokensEl = document.getElementById('todayTokens');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const apiKey1Input = document.getElementById('apiKey1');
const apiKey2Input = document.getElementById('apiKey2');
const enableModel1 = document.getElementById('enableModel1');
const enableModel2 = document.getElementById('enableModel2');

// State Management
let chats = JSON.parse(localStorage.getItem('chats')) || [];
let currentChatId = null;
let tokenUsage = JSON.parse(localStorage.getItem('tokenUsage')) || {
    today: 0,
    date: new Date().toDateString()
};
let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
let currentTheme = localStorage.getItem('theme') || 'modern';
let settings = JSON.parse(localStorage.getItem('settings')) || {
    model1Enabled: true,
    model2Enabled: true,
    apiKey1: '',
    apiKey2: ''
};

// Selected responses tracking
let selectedResponses = new Map(); // messageId -> [model1, model2] or [model]

// Conversation history for each model (separate contexts)
let model1History = []; // For Model 1 (Groq)
let model2History = []; // For Model 2 (Eden)

// Initialize
init();

function init() {
    // Reset token count if new day
    const today = new Date().toDateString();
    if (tokenUsage.date !== today) {
        tokenUsage = { today: 0, date: today };
        saveTokenUsage();
    }

    // Apply theme
    document.body.setAttribute('data-theme', currentTheme);

    // Load sidebar state
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }

    // Load settings
    CONFIG.API_KEY_1 = settings.apiKey1;
    CONFIG.API_KEY_2 = settings.apiKey2;
    apiKey1Input.value = settings.apiKey1;
    apiKey2Input.value = settings.apiKey2;
    enableModel1.checked = settings.model1Enabled;
    enableModel2.checked = settings.model2Enabled;

    // Load chats or create first one
    if (chats.length === 0) {
        createNewChat();
    } else {
        loadChat(chats[0].id);
    }
    
    renderChatList();
    updateTokenDisplay();
    setupEventListeners();
}

function setupEventListeners() {
    // Sidebar toggle
    sidebarToggleBtn.addEventListener('click', toggleSidebarCollapse);
    
    // New chat
    newChatBtn.addEventListener('click', createNewChat);
    
    // Chat actions
    renameChatBtn.addEventListener('click', renameCurrentChat);
    saveChatBtn.addEventListener('click', saveCurrentChat);
    
    // Token toggle
    toggleTokensBtn.addEventListener('click', () => {
        tokenInfo.classList.toggle('visible');
        toggleTokensBtn.classList.toggle('active');
    });
    
    // Settings
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theme = btn.getAttribute('data-theme');
            currentTheme = theme;
            document.body.setAttribute('data-theme', theme);
        });
    });
    
    // Message input
    messageInput.addEventListener('input', autoResizeTextarea);
    messageInput.addEventListener('keydown', handleKeyDown);
    sendButton.addEventListener('click', sendMessage);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
}

function toggleSidebarCollapse() {
    sidebar.classList.toggle('collapsed');
    sidebarCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentChatId) return;

    // Check if at least one model is enabled and has API key
    const model1Ready = settings.model1Enabled && CONFIG.API_KEY_1;
    const model2Ready = settings.model2Enabled && CONFIG.API_KEY_2;

    if (!model1Ready && !model2Ready) {
        alert('Please enable at least one model and configure API keys in Settings.');
        return;
    }

    // Remove empty state if exists
    const emptyState = chatContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    // Add user message
    addUserMessage(message);
    
    const currentChat = chats.find(c => c.id === currentChatId);
    currentChat.messages.push({ role: 'user', content: message });
    
    // Add to model histories
    model1History.push({ role: 'user', content: message });
    model2History.push({ role: 'user', content: message });
    
    // Update chat title if first message
    if (currentChat.messages.filter(m => m.role === 'user').length === 1) {
        currentChat.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        chatTitle.textContent = currentChat.title;
        renderChatList();
    }
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Disable send button
    sendButton.disabled = true;

    // Create dual response container
    const messageId = Date.now().toString();
    const bothModelsEnabled = model1Ready && model2Ready;
    
    if (bothModelsEnabled) {
        createDualResponseContainer(messageId);
        
        // Send to both models simultaneously
        Promise.all([
            model1Ready ? sendToModel1(message, messageId) : Promise.resolve(null),
            model2Ready ? sendToModel2(message, messageId) : Promise.resolve(null)
        ]).then(([response1, response2]) => {
            if (response1) {
                currentChat.messages.push({ role: 'assistant', content: response1, model: 'model1' });
                model1History.push({ role: 'assistant', content: response1 });
            }
            if (response2) {
                currentChat.messages.push({ role: 'assistant', content: response2, model: 'model2' });
                model2History.push({ role: 'assistant', content: response2 });
            }
            
            currentChat.updatedAt = Date.now();
            saveChats();
            renderChatList();
            
            sendButton.disabled = false;
            messageInput.focus();
        });
    } else {
        // Single model mode
        createSingleResponseContainer(messageId, model1Ready ? 'model1' : 'model2');
        
        if (model1Ready) {
            sendToModel1(message, messageId).then(response => {
                if (response) {
                    currentChat.messages.push({ role: 'assistant', content: response, model: 'model1' });
                    model1History.push({ role: 'assistant', content: response });
                    currentChat.updatedAt = Date.now();
                    saveChats();
                    renderChatList();
                }
                sendButton.disabled = false;
                messageInput.focus();
            });
        } else {
            sendToModel2(message, messageId).then(response => {
                if (response) {
                    currentChat.messages.push({ role: 'assistant', content: response, model: 'model2' });
                    model2History.push({ role: 'assistant', content: response });
                    currentChat.updatedAt = Date.now();
                    saveChats();
                    renderChatList();
                }
                sendButton.disabled = false;
                messageInput.focus();
            });
        }
    }
}

function createDualResponseContainer(messageId) {
    const container = document.createElement('div');
    container.className = 'dual-response-container';
    container.id = `response-${messageId}`;
    
    // Model 1 Panel
    const panel1 = document.createElement('div');
    panel1.className = 'response-panel';
    panel1.id = `panel1-${messageId}`;
    panel1.innerHTML = `
        <div class="response-header">
            <div class="model-name">
                <span class="model-badge">Model 1</span>
                Groq (Llama 3.1)
            </div>
            <div class="response-actions">
                <button class="response-action-btn" onclick="selectResponse('${messageId}', 'model1')">
                    ✓ Choose
                </button>
            </div>
        </div>
        <div class="response-body">
            <div class="message assistant">
                <div class="avatar">
                    <img src="icons/AI.png" alt="AI">
                </div>
                <div class="message-content" id="content1-${messageId}">Thinking...</div>
            </div>
        </div>
    `;
    
    // Model 2 Panel
    const panel2 = document.createElement('div');
    panel2.className = 'response-panel';
    panel2.id = `panel2-${messageId}`;
    panel2.innerHTML = `
        <div class="response-header">
            <div class="model-name">
                <span class="model-badge">Model 2</span>
                Eden Pro
            </div>
            <div class="response-actions">
                <button class="response-action-btn" onclick="selectResponse('${messageId}', 'model2')">
                    ✓ Choose
                </button>
            </div>
        </div>
        <div class="response-body">
            <div class="message assistant">
                <div class="avatar">
                    <img src="icons/AI.png" alt="AI">
                </div>
                <div class="message-content" id="content2-${messageId}">Thinking...</div>
            </div>
        </div>
    `;
    
    container.appendChild(panel1);
    container.appendChild(panel2);
    chatContainer.appendChild(container);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function createSingleResponseContainer(messageId, model) {
    const container = document.createElement('div');
    container.className = 'dual-response-container single-model';
    container.id = `response-${messageId}`;
    
    const modelName = model === 'model1' ? 'Groq (Llama 3.1)' : 'Eden Pro';
    const modelLabel = model === 'model1' ? 'Model 1' : 'Model 2';
    
    const panel = document.createElement('div');
    panel.className = 'response-panel';
    panel.innerHTML = `
        <div class="response-header">
            <div class="model-name">
                <span class="model-badge">${modelLabel}</span>
                ${modelName}
            </div>
        </div>
        <div class="response-body">
            <div class="message assistant">
                <div class="avatar">
                    <img src="icons/AI.png" alt="AI">
                </div>
                <div class="message-content" id="content-${messageId}">Thinking...</div>
            </div>
        </div>
    `;
    
    container.appendChild(panel);
    chatContainer.appendChild(container);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendToModel1(message, messageId) {
    try {
        console.log('Sending to Model 1 with history:', model1History);
        
        const response = await fetch(CONFIG.API_URL_1, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.API_KEY_1}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: model1History,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        console.log('Model 1 Response:', data);
        
        if (response.ok && data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content.trim();
            const contentEl = document.getElementById(`content1-${messageId}`) || document.getElementById(`content-${messageId}`);
            if (contentEl) {
                contentEl.textContent = aiResponse;
            }
            
            // Update token usage
            if (data.usage) {
                const tokensUsed = data.usage.total_tokens || 0;
                updateTokenUsage(tokensUsed);
            }
            
            return aiResponse;
        } else if (data.error) {
            const errorMsg = `Error: ${data.error.message}`;
            const contentEl = document.getElementById(`content1-${messageId}`) || document.getElementById(`content-${messageId}`);
            if (contentEl) {
                contentEl.textContent = errorMsg;
            }
            console.error('Model 1 Error:', data.error.message);
            return null;
        }
    } catch (error) {
        const errorMsg = 'Connection error with Model 1';
        const contentEl = document.getElementById(`content1-${messageId}`) || document.getElementById(`content-${messageId}`);
        if (contentEl) {
            contentEl.textContent = errorMsg;
        }
        console.error('Model 1 Network Error:', error);
        return null;
    }
}

async function sendToModel2(message, messageId) {
    try {
        console.log('Sending to Model 2 with history:', model2History);
        
        // Format for Eden API
        const contents = model2History.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const response = await fetch(`${CONFIG.API_URL_2}?key=${CONFIG.API_KEY_2}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });

        const data = await response.json();
        console.log('Model 2 Response:', data);
        
        if (response.ok && data.candidates && data.candidates[0]) {
            const aiResponse = data.candidates[0].content.parts[0].text.trim();
            const contentEl = document.getElementById(`content2-${messageId}`) || document.getElementById(`content-${messageId}`);
            if (contentEl) {
                contentEl.textContent = aiResponse;
            }
            
            // Update token usage (approximate for Eden)
            const tokensUsed = Math.ceil(aiResponse.length / 4);
            updateTokenUsage(tokensUsed);
            
            return aiResponse;
        } else if (data.error) {
            const errorMsg = `Error: ${data.error.message}`;
            const contentEl = document.getElementById(`content2-${messageId}`) || document.getElementById(`content-${messageId}`);
            if (contentEl) {
                contentEl.textContent = errorMsg;
            }
            console.error('Model 2 Error:', data.error.message);
            return null;
        }
    } catch (error) {
        const errorMsg = 'Connection error with Model 2';
        const contentEl = document.getElementById(`content2-${messageId}`) || document.getElementById(`content-${messageId}`);
        if (contentEl) {
            contentEl.textContent = errorMsg;
        }
        console.error('Model 2 Network Error:', error);
        return null;
    }
}

function selectResponse(messageId, model) {
    const container = document.getElementById(`response-${messageId}`);
    if (!container) return;
    
    const panel1 = document.getElementById(`panel1-${messageId}`);
    const panel2 = document.getElementById(`panel2-${messageId}`);
    
    if (model === 'model1') {
        if (panel2) panel2.classList.add('hidden');
        selectedResponses.set(messageId, ['model1']);
        
        // Remove Model 2's last response from its history
        if (model2History.length > 0 && model2History[model2History.length - 1].role === 'assistant') {
            model2History.pop();
        }
    } else if (model === 'model2') {
        if (panel1) panel1.classList.add('hidden');
        selectedResponses.set(messageId, ['model2']);
        
        // Remove Model 1's last response from its history
        if (model1History.length > 0 && model1History[model1History.length - 1].role === 'assistant') {
            model1History.pop();
        }
    }
    
    // Update button states
    const buttons = container.querySelectorAll('.response-action-btn');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
        if ((model === 'model1' && btn.textContent.includes('Choose') && btn.closest('#panel1-' + messageId)) ||
            (model === 'model2' && btn.textContent.includes('Choose') && btn.closest('#panel2-' + messageId))) {
            btn.classList.add('selected');
            btn.textContent = '✓ Selected';
        }
    });
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    
    const avatarImg = document.createElement('img');
    avatarImg.src = 'icons/User.png';
    avatarImg.alt = 'User';
    avatar.appendChild(avatarImg);
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatContainer.appendChild(messageDiv);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function createNewChat() {
    const newChat = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    chats.unshift(newChat);
    saveChats();
    loadChat(newChat.id);
    renderChatList();
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    // Reset conversation histories for new chat
    model1History = [];
    model2History = [];
    
    // Update title
    chatTitle.textContent = chat.title;
    
    // Clear chat container
    chatContainer.innerHTML = '';
    
    // Load messages
    if (chat.messages.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
            <h2>Start a Conversation</h2>
            <p>Ask me anything or start typing below</p>
        `;
        chatContainer.appendChild(emptyState);
    } else {
        let i = 0;
        while (i < chat.messages.length) {
            const msg = chat.messages[i];
            
            if (msg.role === 'user') {
                addUserMessage(msg.content);
                
                // Add to both histories
                model1History.push({ role: 'user', content: msg.content });
                model2History.push({ role: 'user', content: msg.content });
                
                i++;
                
                // Check if next messages are assistant responses
                if (i < chat.messages.length && chat.messages[i].role === 'assistant') {
                    const nextMsg = chat.messages[i];
                    
                    // Check if there's a second model response
                    if (i + 1 < chat.messages.length && 
                        chat.messages[i + 1].role === 'assistant' &&
                        nextMsg.model !== chat.messages[i + 1].model) {
                        
                        // Dual response
                        const messageId = `loaded-${Date.now()}-${i}`;
                        const content1 = nextMsg.model === 'model1' ? nextMsg.content : chat.messages[i + 1].content;
                        const content2 = nextMsg.model === 'model2' ? nextMsg.content : chat.messages[i + 1].content;
                        
                        recreateDualResponse(messageId, content1, content2);
                        
                        // Add to histories
                        model1History.push({ role: 'assistant', content: content1 });
                        model2History.push({ role: 'assistant', content: content2 });
                        
                        i += 2;
                    } else {
                        // Single response
                        const messageId = `loaded-${Date.now()}-${i}`;
                        recreateSingleResponse(messageId, nextMsg.content, nextMsg.model);
                        
                        // Add to appropriate history
                        if (nextMsg.model === 'model1') {
                            model1History.push({ role: 'assistant', content: nextMsg.content });
                        } else {
                            model2History.push({ role: 'assistant', content: nextMsg.content });
                        }
                        
                        i++;
                    }
                }
            } else {
                i++;
            }
        }
    }
    
    console.log('Loaded chat. Model 1 history:', model1History);
    console.log('Loaded chat. Model 2 history:', model2History);
    
    updateTokenDisplay();
    messageInput.focus();
}

function recreateDualResponse(messageId, content1, content2) {
    const container = document.createElement('div');
    container.className = 'dual-response-container';
    container.id = `response-${messageId}`;
    
    const panel1 = document.createElement('div');
    panel1.className = 'response-panel';
    panel1.innerHTML = `
        <div class="response-header">
            <div class="model-name">
                <span class="model-badge">Model 1</span>
                Groq (Llama 3.1)
            </div>
        </div>
        <div class="response-body">
            <div class="message assistant">
                <div class="avatar">
                    <img src="icons/AI.png" alt="AI">
                </div>
                <div class="message-content">${content1}</div>
            </div>
        </div>
    `;
    
    const panel2 = document.createElement('div');
    panel2.className = 'response-panel';
    panel2.innerHTML = `
        <div class="response-header">
            <div class="model-name">
                <span class="model-badge">Model 2</span>
                Eden Pro
            </div>
        </div>
        <div class="response-body">
            <div class="message assistant">
                <div class="avatar">
                    <img src="icons/AI.png" alt="AI">
                </div>
                <div class="message-content">${content2}</div>
            </div>
        </div>
    `;
    
    container.appendChild(panel1);
    container.appendChild(panel2);
    chatContainer.appendChild(container);
}

function recreateSingleResponse(messageId, content, model) {
    const modelName = model === 'model1' ? 'Groq (Llama 3.1)' : 'Eden Pro';
    const modelLabel = model === 'model1' ? 'Model 1' : 'Model 2';
    
    const container = document.createElement('div');
    container.className = 'dual-response-container single-model';
    
    const panel = document.createElement('div');
    panel.className = 'response-panel';
    panel.innerHTML = `
        <div class="response-header">
            <div class="model-name">
                <span class="model-badge">${modelLabel}</span>
                ${modelName}
            </div>
        </div>
        <div class="response-body">
            <div class="message assistant">
                <div class="avatar">
                    <img src="icons/AI.png" alt="AI">
                </div>
                <div class="message-content">${content}</div>
            </div>
        </div>
    `;
    
    container.appendChild(panel);
    chatContainer.appendChild(container);
}

function renameCurrentChat() {
    if (!currentChatId) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    const newTitle = prompt('Enter new chat name:', chat.title);
    
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        chatTitle.textContent = chat.title;
        saveChats();
        renderChatList();
    }
}

function saveCurrentChat() {
    if (!currentChatId) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    const dataStr = JSON.stringify(chat, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chat.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function renderChatList() {
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        
        const lastMessage = chat.messages.length > 0 
            ? chat.messages[chat.messages.length - 1].content.substring(0, 40) + '...'
            : 'No messages yet';
        
        chatItem.innerHTML = `
            <div class="chat-item-content">
                <div class="chat-item-title">${chat.title}</div>
                <div class="chat-item-preview">${lastMessage}</div>
            </div>
            <div class="chat-item-actions">
                <button class="chat-item-action" onclick="deleteChatById('${chat.id}')" title="Delete">🗑️</button>
            </div>
        `;
        
        chatItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('chat-item-action')) {
                loadChat(chat.id);
                renderChatList();
            }
        });
        
        chatList.appendChild(chatItem);
    });
}

function deleteChatById(chatId) {
    if (!confirm('Delete this chat?')) return;
    
    chats = chats.filter(c => c.id !== chatId);
    saveChats();
    
    if (chatId === currentChatId) {
        if (chats.length === 0) {
            createNewChat();
        } else {
            loadChat(chats[0].id);
        }
    }
    
    renderChatList();
}

function updateTokenUsage(tokens) {
    tokenUsage.today += tokens;
    saveTokenUsage();
    updateTokenDisplay();
}

function updateTokenDisplay() {
    const currentChat = chats.find(c => c.id === currentChatId);
    let currentChatTokens = 0;
    
    if (currentChat) {
        currentChatTokens = Math.ceil(
            currentChat.messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4
        );
    }
    
    currentChatTokensEl.textContent = currentChatTokens.toLocaleString();
    todayTokensEl.textContent = tokenUsage.today.toLocaleString();
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function saveTokenUsage() {
    localStorage.setItem('tokenUsage', JSON.stringify(tokenUsage));
}

function openSettings() {
    settingsModal.classList.add('active');
    
    // Set current theme as active
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === currentTheme) {
            btn.classList.add('active');
        }
    });
}

function closeSettings() {
    settingsModal.classList.remove('active');
}

function saveSettings() {
    // Save API keys
    settings.apiKey1 = apiKey1Input.value.trim();
    settings.apiKey2 = apiKey2Input.value.trim();
    CONFIG.API_KEY_1 = settings.apiKey1;
    CONFIG.API_KEY_2 = settings.apiKey2;
    
    // Save model enabled states
    settings.model1Enabled = enableModel1.checked;
    settings.model2Enabled = enableModel2.checked;
    
    // Save theme
    localStorage.setItem('theme', currentTheme);
    
    // Save all settings
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Show success message
    const originalText = saveSettingsBtn.textContent;
    saveSettingsBtn.textContent = '✓ Saved!';
    saveSettingsBtn.style.background = 'var(--success-color)';
    
    setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        saveSettingsBtn.style.background = '';
        closeSettings();
    }, 1000);
}

// Global function for response selection (called from onclick)
window.selectResponse = selectResponse;

// Global function for chat deletion (called from onclick)
window.deleteChatById = deleteChatById;