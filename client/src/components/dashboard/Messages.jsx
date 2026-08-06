import React, { useState } from 'react';
import { User, Send } from 'lucide-react';

export default function Messages({ role = 'instructor' }) {
  // Demo conversation state
  const isInstructor = role === 'instructor';

  const [conversations, setConversations] = useState(
    isInstructor
      ? [
          { id: 1, name: 'Student 1', lastMessage: 'Hello', active: true },
        ]
      : [
          { id: 1, name: 'Instructor', lastMessage: 'Hello', active: true },
        ]
  );

  const [activeChatId, setActiveChatId] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    { id: 1, text: 'Hello', sender: 'them', time: '10:00 AM' },
  ]);

  const activeUser = conversations.find((c) => c.id === activeChatId) || conversations[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatLog((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: inputMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputMessage('');
  };

  return (
    <div className="messages-container">
      {/* Left Conversation List Panel */}
      <div className="chat-sidebar-panel">
        {isInstructor && (
          <div className="all-messages-card">
            <h2 className="all-messages-title">All Message</h2>
            <input
              type="text"
              className="chat-search-input"
              placeholder=""
            />
          </div>
        )}

        <div className="chat-list">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className={`chat-user-card ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="chat-user-avatar">
                <User size={22} />
              </div>
              <div className="chat-user-info">
                <div className="chat-user-name">{chat.name}</div>
                <div className="chat-user-preview">{chat.lastMessage}</div>
              </div>
            </div>
          ))}

          {/* Skeleton/Placeholder cards as shown in Figma Frame 12 */}
          {isInstructor && (
            <>
              <div className="chat-placeholder-card"></div>
              <div className="chat-placeholder-card"></div>
              <div className="chat-placeholder-card"></div>
            </>
          )}
        </div>
      </div>

      {/* Right Chat Panel */}
      <div className="chat-main-panel">
        <div className="chat-messages-area">
          {chatLog.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${msg.sender === 'me' ? 'outgoing' : 'incoming'}`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Reply message bar at bottom */}
        <form className="chat-input-bar" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-reply-input"
            placeholder="Reply message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" title="Send message">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
