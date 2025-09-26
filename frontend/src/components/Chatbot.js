import apiService from '../../services/api.js';

class ChatbotComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messageHistory = [];
        this.isTyping = false;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Chatbot container not found');
            return;
        }

        this.render();
        this.setupEventListeners();
        this.loadWelcomeMessage();
    }

    render() {
        this.container.innerHTML = `
            <div class="chatbot-container h-full flex flex-col bg-white rounded-lg shadow-lg">
                <!-- Chat Header -->
                <div class="chat-header bg-indigo-600 text-white p-4 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <i class="fas fa-robot text-white text-lg"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold">AI Data Assistant</h3>
                                <p class="text-sm text-indigo-200">Ask anything about your dataset</p>
                            </div>
                        </div>
                        <button id="clear-chat" class="text-indigo-200 hover:text-white transition-colors">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div id="chat-messages" class="chat-messages flex-1 p-4 overflow-y-auto space-y-4 max-h-96">
                    <!-- Messages will be populated here -->
                </div>

                <!-- Typing Indicator -->
                <div id="typing-indicator" class="hidden px-4 py-2">
                    <div class="flex items-center space-x-2 text-gray-500">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                        </div>
                        <span class="text-sm">AI is typing...</span>
                    </div>
                </div>

                <!-- Quick Questions -->
                <div class="px-4 py-2 border-t border-gray-200">
                    <div class="flex flex-wrap gap-2 mb-2">
                        <button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="Describe my dataset">
                            📊 Describe dataset
                        </button>
                        <button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="Any missing values?">
                            ❓ Missing values?
                        </button>
                        <button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="Show me correlations">
                            🔗 Correlations
                        </button>
                        <button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="Find outliers">
                            ⚠️ Find outliers
                        </button>
                        <button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="Data quality report">
                            📋 Quality report
                        </button>
                        <button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="Help">
                            💡 Help
                        </button>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="chat-input-container border-t border-gray-200 p-4">
                    <div class="flex space-x-3">
                        <input 
                            type="text" 
                            id="chat-input" 
                            placeholder="Ask me anything about your dataset..." 
                            class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            maxlength="500"
                        >
                        <button 
                            id="send-message" 
                            class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[44px]"
                        >
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        Press Enter to send • <span id="char-count">0</span>/500 characters
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const chatInput = this.container.querySelector('#chat-input');
        const sendButton = this.container.querySelector('#send-message');
        const clearButton = this.container.querySelector('#clear-chat');
        const quickQuestionBtns = this.container.querySelectorAll('.quick-question-btn');
        const charCount = this.container.querySelector('#char-count');

        // Send message on Enter key
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send message on button click
        sendButton?.addEventListener('click', () => this.sendMessage());

        // Clear chat history
        clearButton?.addEventListener('click', () => this.clearChat());

        // Quick questions
        quickQuestionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.getAttribute('data-question');
                this.sendMessage(question);
            });
        });

        // Character count
        chatInput?.addEventListener('input', (e) => {
            if (charCount) {
                charCount.textContent = e.target.value.length;
            }
        });

        // Auto-resize input (optional)
        chatInput?.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });
    }

    loadWelcomeMessage() {
        this.addMessage({
            content: `Hello! 👋 I'm your AI Data Assistant. I'm here to help you analyze and understand your dataset.

**What I can help you with:**
• Dataset overview and statistics
• Missing values analysis  
• Correlation insights
• Data quality assessment
• Column-specific analysis
• Recommendations for improvement

Upload a dataset and start asking questions! You can use the quick buttons below or type your own questions.`,
            sender: 'ai',
            timestamp: new Date().toISOString()
        });
    }

    async sendMessage(messageText = null) {
        const chatInput = this.container.querySelector('#chat-input');
        const sendButton = this.container.querySelector('#send-message');
        
        const message = messageText || chatInput?.value.trim();
        if (!message || this.isTyping) return;

        // Clear input if not using quick question
        if (!messageText && chatInput) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
            this.container.querySelector('#char-count').textContent = '0';
        }

        // Add user message
        this.addMessage({
            content: message,
            sender: 'user',
            timestamp: new Date().toISOString()
        });

        // Show typing indicator and disable input
        this.showTypingIndicator();
        this.setInputDisabled(true);

        try {
            // Send to API
            const response = await apiService.sendChatMessage(message);
            
            // Add AI response
            this.addMessage({
                content: response.response,
                sender: 'ai',
                timestamp: response.timestamp,
                type: response.type
            });

        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage({
                content: "I'm sorry, I encountered an error processing your request. Please make sure you have uploaded and processed a dataset first, then try again.",
                sender: 'ai',
                timestamp: new Date().toISOString(),
                isError: true
            });
        } finally {
            this.hideTypingIndicator();
            this.setInputDisabled(false);
            chatInput?.focus();
        }
    }

    addMessage(message) {
        const messagesContainer = this.container.querySelector('#chat-messages');
        if (!messagesContainer) return;

        this.messageHistory.push(message);

        const messageElement = this.createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add animation
        requestAnimationFrame(() => {
            messageElement.classList.add('opacity-100', 'translate-y-0');
        });
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message opacity-0 translate-y-2 transition-all duration-300 ${
            message.sender === 'user' ? 'ml-auto' : 'mr-auto'
        }`;

        const isUser = message.sender === 'user';
        const maxWidth = 'max-w-[80%]';
        const alignment = isUser ? 'ml-auto' : 'mr-auto';
        
        const bgColor = isUser 
            ? 'bg-indigo-600 text-white' 
            : message.isError 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-gray-100';
        
        const textColor = isUser 
            ? 'text-white' 
            : message.isError 
                ? 'text-red-800' 
                : 'text-gray-800';

        const iconColor = isUser 
            ? 'text-indigo-200' 
            : message.isError 
                ? 'text-red-500' 
                : 'text-indigo-600';

        const nameColor = isUser 
            ? 'text-indigo-100' 
            : message.isError 
                ? 'text-red-700' 
                : 'text-gray-900';

        messageDiv.innerHTML = `
            <div class="${maxWidth} ${alignment} ${bgColor} rounded-lg p-4 shadow-sm">
                <div class="flex items-center mb-2">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center mr-2">
                        <i class="fas fa-${isUser ? 'user' : message.isError ? 'exclamation-triangle' : 'robot'} ${iconColor} text-sm"></i>
                    </div>
                    <span class="text-sm font-medium ${nameColor}">
                        ${isUser ? 'You' : 'AI Assistant'}
                    </span>
                    <span class="text-xs ${isUser ? 'text-indigo-200' : 'text-gray-500'} ml-auto">
                        ${this.formatTimestamp(message.timestamp)}
                    </span>
                </div>
                <div class="${textColor} text-sm leading-relaxed">
                    ${this.formatMessageContent(message.content)}
                </div>
                ${message.type && !isUser ? this.renderMessageType(message.type) : ''}
            </div>
        `;

        return messageDiv;
    }

    formatMessageContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-xs">$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.+)$/gm, '• $1')
            .replace(/(\d+\.?\d*%)/g, '<span class="font-semibold">$1</span>')
            .replace(/(🎉|📊|❓|🔗|⚠️|📋|💡)/g, '<span class="text-lg">$1</span>');
    }

    renderMessageType(type) {
        const typeLabels = {
            'overview': '📊 Dataset Overview',
            'statistics': '📈 Statistics',
            'missing': '❓ Missing Values',
            'correlation': '🔗 Correlations',
            'outliers': '⚠️ Outliers',
            'quality': '📋 Data Quality',
            'column_analysis': '📄 Column Analysis',
            'help': '💡 Help'
        };

        const label = typeLabels[type];
        if (!label) return '';

        return `
            <div class="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                ${label}
            </div>
        `;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showTypingIndicator() {
        const indicator = this.container.querySelector('#typing-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const indicator = this.container.querySelector('#typing-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
        this.isTyping = false;
    }

    setInputDisabled(disabled) {
        const chatInput = this.container.querySelector('#chat-input');
        const sendButton = this.container.querySelector('#send-message');
        
        if (chatInput) chatInput.disabled = disabled;
        if (sendButton) sendButton.disabled = disabled;
    }

    async clearChat() {
        const messagesContainer = this.container.querySelector('#chat-messages');
        if (!messagesContainer) return;

        try {
            await apiService.clearConversationHistory();
            messagesContainer.innerHTML = '';
            this.messageHistory = [];
            this.loadWelcomeMessage();
            
            // Show success message
            this.showNotification('Chat history cleared', 'success');
            
        } catch (error) {
            console.error('Failed to clear chat:', error);
            this.showNotification('Failed to clear chat history', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('chat-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'chat-notification';
            notification.className = 'fixed top-4 right-4 z-50 max-w-sm transform translate-x-full transition-transform duration-300';
            document.body.appendChild(notification);
        }

        const colors = {
            'success': 'bg-green-50 border-green-200 text-green-800',
            'error': 'bg-red-50 border-red-200 text-red-800',
            'warning': 'bg-yellow-50 border-yellow-200 text-yellow-800',
            'info': 'bg-blue-50 border-blue-200 text-blue-800'
        };

        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="${colors[type]} border rounded-lg p-4 shadow-lg">
                <div class="flex items-center">
                    <i class="${icons[type]} mr-3"></i>
                    <span class="text-sm font-medium">${message}</span>
                    <button class="ml-auto focus:outline-none" onclick="this.parentElement.parentElement.parentElement.classList.add('translate-x-full')">
                        <i class="fas fa-times text-gray-400 hover:text-gray-600"></i>
                    </button>
                </div>
            </div>
        `;

        // Show notification
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
        });

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
        }, 3000);
    }

    async loadConversationHistory() {
        try {
            const response = await apiService.getConversationHistory();
            if (response.history && response.history.length > 0) {
                const messagesContainer = this.container.querySelector('#chat-messages');
                messagesContainer.innerHTML = '';
                
                response.history.forEach(item => {
                    this.addMessage({
                        content: item.query,
                        sender: 'user',
                        timestamp: item.timestamp
                    });
                    this.addMessage({
                        content: item.response,
                        sender: 'ai',
                        timestamp: item.timestamp
                    });
                });
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    // Public methods for external use
    setDatasetContext(dataset, insights = null) {
        // This could be used to notify the chatbot when new data is loaded
        this.showNotification('Dataset loaded! You can now ask questions about your data.', 'success');
    }

    disable() {
        this.setInputDisabled(true);
        const quickBtns = this.container.querySelectorAll('.quick-question-btn');
        quickBtns.forEach(btn => btn.disabled = true);
    }

    enable() {
        this.setInputDisabled(false);
        const quickBtns = this.container.querySelectorAll('.quick-question-btn');
        quickBtns.forEach(btn => btn.disabled = false);
    }

    // Utility method to suggest questions based on data characteristics
    updateQuickQuestions(dataCharacteristics) {
        if (!dataCharacteristics) return;

        const quickQuestionsContainer = this.container.querySelector('.px-4.py-2.border-t');
        if (!quickQuestionsContainer) return;

        let suggestions = [
            { text: '📊 Describe dataset', question: 'Describe my dataset' },
            { text: '💡 Help', question: 'Help' }
        ];

        if (dataCharacteristics.hasMissingValues) {
            suggestions.splice(1, 0, { text: '❓ Missing values?', question: 'Any missing values?' });
        }

        if (dataCharacteristics.hasNumericColumns) {
            suggestions.splice(-1, 0, 
                { text: '🔗 Correlations', question: 'Show me correlations' },
                { text: '⚠️ Find outliers', question: 'Find outliers' }
            );
        }

        if (dataCharacteristics.hasQualityIssues) {
            suggestions.splice(-1, 0, { text: '📋 Quality report', question: 'Data quality report' });
        }

        // Update the buttons
        const buttonsHtml = suggestions.map(s => 
            `<button class="quick-question-btn text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors" data-question="${s.question}">
                ${s.text}
            </button>`
        ).join('');

        quickQuestionsContainer.innerHTML = `
            <div class="flex flex-wrap gap-2 mb-2">
                ${buttonsHtml}
            </div>
        `;

        // Re-attach event listeners
        this.container.querySelectorAll('.quick-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.getAttribute('data-question');
                this.sendMessage(question);
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotComponent;
} else if (typeof window !== 'undefined') {
    window.ChatbotComponent = ChatbotComponent;
}

export default ChatbotComponent;