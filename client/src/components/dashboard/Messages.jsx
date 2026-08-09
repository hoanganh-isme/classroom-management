import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Send, Search, Loader2, CheckCheck, Check } from 'lucide-react';
import { connectSocket } from '../../socket/socketClient';
import { getStudents } from '../../api/instructorApi';

export default function Messages({ role = 'instructor', onUnreadCountUpdate }) {
  const isInstructor = role === 'instructor';

  const [conversations, setConversations] = useState([]);
  const [instructorStudents, setInstructorStudents] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const activeConvRef = useRef(activeConversation);
  activeConvRef.current = activeConversation;

  const onUnreadRef = useRef(onUnreadCountUpdate);
  useEffect(() => {
    onUnreadRef.current = onUnreadCountUpdate;
  }, [onUnreadCountUpdate]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Recalculate total unread count and report to parent using ref
  const notifyUnreadTotal = useCallback((convsList) => {
    if (!onUnreadRef.current) return;
    const total = convsList.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    onUnreadRef.current(total);
  }, []);

  // Load instructor students for contact list
  const loadInstructorStudents = useCallback(async () => {
    if (!isInstructor) return;
    try {
      const res = await getStudents();
      if (res.success && Array.isArray(res.data?.students)) {
        setInstructorStudents(res.data.students);
      }
    } catch (err) {
      console.warn('Failed to load instructor student list:', err);
    }
  }, [isInstructor]);

  // Socket initialization & real-time message/read event handling (runs ONLY on mount or role change)
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) {
      setError('Failed to establish real-time chat connection. Please log in again.');
      setIsLoadingConversations(false);
      return;
    }

    loadInstructorStudents();

    // 1. New Message Event Handler
    const handleNewMessage = (newMsg) => {
      if (!newMsg || !newMsg.conversationId) return;

      const isCurrentActive =
        activeConvRef.current && activeConvRef.current.id === newMsg.conversationId;

      if (isCurrentActive) {
        // Append to active conversation window
        setMessages((prevMsgs) => {
          if (prevMsgs.some((m) => m.id === newMsg.id)) return prevMsgs;
          return [...prevMsgs, newMsg];
        });

        // Automatically mark active conversation as read
        socket.emit('chat:read', { conversationId: newMsg.conversationId });
      }

      // Update conversations list (last message & unread count)
      setConversations((prevConvs) => {
        const updated = prevConvs.map((conv) => {
          if (conv.id === newMsg.conversationId) {
            const isUnreadForMe = !isCurrentActive && newMsg.senderRole !== role;
            return {
              ...conv,
              lastMessage: newMsg.text,
              lastMessageAt: newMsg.createdAt,
              unreadCount: isUnreadForMe ? (conv.unreadCount || 0) + 1 : 0,
            };
          }
          return conv;
        });
        notifyUnreadTotal(updated);
        return updated;
      });
    };

    // 2. Read Status Event Handler (Read Receipts)
    const handleReadStatus = (readEvent) => {
      if (!readEvent || !readEvent.conversationId) return;

      // Update active messages read status if current conversation
      if (activeConvRef.current && activeConvRef.current.id === readEvent.conversationId) {
        setMessages((prevMsgs) =>
          prevMsgs.map((msg) => ({
            ...msg,
            isRead: true,
            readAt: msg.readAt || readEvent.readAt,
          }))
        );
      }
    };

    const handleConnectError = (err) => {
      console.error('Socket connect error:', err);
      setError(err.message || 'Connection error.');
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:read_status', handleReadStatus);
    socket.on('connect_error', handleConnectError);

    // Fetch conversation list
    setIsLoadingConversations(true);
    socket.emit('chat:list', (res) => {
      setIsLoadingConversations(false);
      if (res && res.success && Array.isArray(res.data?.conversations)) {
        const fetchedConvs = res.data.conversations;
        setConversations(fetchedConvs);
        notifyUnreadTotal(fetchedConvs);

        if (!isInstructor) {
          if (fetchedConvs.length > 0) {
            selectAndJoinConversation(socket, fetchedConvs[0]);
          } else {
            socket.emit('chat:start', {}, (startRes) => {
              if (startRes && startRes.success && startRes.data?.conversation) {
                const newConv = startRes.data.conversation;
                setConversations([newConv]);
                selectAndJoinConversation(socket, newConv);
              } else {
                setError(startRes?.message || 'No assigned instructor found.');
              }
            });
          }
        } else if (fetchedConvs.length > 0) {
          selectAndJoinConversation(socket, fetchedConvs[0]);
        }
      } else if (res && !res.success) {
        setError(res.message || 'Failed to load conversations.');
      }
    });

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:read_status', handleReadStatus);
      socket.off('connect_error', handleConnectError);
    };

    // Stable dependencies: only depends on static role flags!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, role]);

  // Join room and mark conversation as read
  const selectAndJoinConversation = (socket, conv) => {
    if (!socket || !conv || !conv.id) return;

    setActiveConversation(conv);
    setIsLoadingMessages(true);
    setError('');

    // Clear local unread count for this conversation
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      notifyUnreadTotal(updated);
      return updated;
    });

    socket.emit('chat:join', { conversationId: conv.id }, (joinRes) => {
      setIsLoadingMessages(false);
      if (joinRes && joinRes.success && Array.isArray(joinRes.data?.messages)) {
        setMessages(joinRes.data.messages);
      } else {
        setError(joinRes?.message || 'Failed to load message history.');
      }
    });
  };

  // Instructor selecting a student/contact or conversation card
  const handleSelectStudentOrConv = (item) => {
    const socket = connectSocket();
    if (!socket) return;

    setError('');

    if (item.instructorId && item.studentId) {
      selectAndJoinConversation(socket, item);
      return;
    }

    if (item.id) {
      const studentId = item.id;
      const existing = conversations.find((c) => c.studentId === studentId);
      if (existing) {
        selectAndJoinConversation(socket, existing);
        return;
      }

      setIsLoadingMessages(true);
      socket.emit('chat:start', { studentId }, (startRes) => {
        if (startRes && startRes.success && startRes.data?.conversation) {
          const newConv = {
            ...startRes.data.conversation,
            otherUser: {
              id: item.id,
              name: item.name || 'Student',
              role: 'student',
            },
          };
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
          selectAndJoinConversation(socket, newConv);
        } else {
          setIsLoadingMessages(false);
          setError(startRes?.message || 'Unable to start chat with student.');
        }
      });
    }
  };

  // Send message submit handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation || isSending) return;

    const socket = connectSocket();
    if (!socket) {
      setError('Socket connection is disconnected. Please refresh.');
      return;
    }

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setError('');

    socket.emit(
      'chat:send',
      {
        conversationId: activeConversation.id,
        text: messageText,
      },
      (res) => {
        setIsSending(false);
        if (res && res.success && res.data?.message) {
          const savedMsg = res.data.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === savedMsg.id)) return prev;
            return [...prev, savedMsg];
          });
        } else if (res && !res.success) {
          setError(res.message || 'Failed to send message.');
        }
      }
    );
  };

  // Combine & filter left sidebar contacts
  const getSidebarDisplayItems = () => {
    if (!isInstructor) {
      return conversations;
    }

    const combined = [...conversations];

    instructorStudents.forEach((st) => {
      const existsInConvs = combined.some((c) => c.studentId === st.id);
      if (!existsInConvs) {
        combined.push({
          id: st.id,
          isContactOnly: true,
          otherUser: {
            id: st.id,
            name: st.name || 'Student',
            role: 'student',
          },
          lastMessage: 'Click to start conversation',
          lastMessageAt: null,
          unreadCount: 0,
        });
      }
    });

    if (!searchTerm.trim()) {
      return combined;
    }

    const term = searchTerm.trim().toLowerCase();
    return combined.filter(
      (item) =>
        item.otherUser?.name?.toLowerCase().includes(term) ||
        item.lastMessage?.toLowerCase().includes(term)
    );
  };

  const displayItems = getSidebarDisplayItems();

  const isMyMessage = (msg) => {
    if (!msg) return false;
    return msg.senderRole === role;
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="messages-container">
      {/* Left Conversation / Contact List Panel */}
      <div className="chat-sidebar-panel">
        <div className="all-messages-card">
          <h2 className="all-messages-title">
            {isInstructor ? 'All Messages' : 'Instructor Contact'}
          </h2>
          {isInstructor && (
            <div style={{ position: 'relative', marginTop: '10px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                className="chat-search-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="chat-list">
          {isLoadingConversations ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86909c' }}>
              <Loader2 size={20} className="spin-icon" style={{ marginBottom: '6px' }} />
              <div>Loading chats...</div>
            </div>
          ) : displayItems.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#86909c', fontSize: '13px' }}>
              {isInstructor ? 'No students or conversations found.' : 'No assigned instructor found.'}
            </div>
          ) : (
            displayItems.map((item) => {
              const isSelected = activeConversation && activeConversation.id === item.id;
              const hasUnread = item.unreadCount > 0;
              const displayName = item.otherUser?.name || (isInstructor ? 'Student' : 'Instructor');

              return (
                <div
                  key={item.id}
                  className={`chat-user-card ${isSelected ? 'active' : ''} ${hasUnread ? 'unread' : ''}`}
                  onClick={() => handleSelectStudentOrConv(item)}
                >
                  <div className="chat-user-avatar">
                    <User size={22} />
                  </div>
                  <div className="chat-user-info" style={{ flex: 1 }}>
                    <div
                      className="chat-user-name"
                      style={{ fontWeight: hasUnread ? 700 : 600 }}
                    >
                      {displayName}
                    </div>
                    <div
                      className="chat-user-preview"
                      style={{
                        fontWeight: hasUnread ? 600 : 400,
                        color: hasUnread ? '#1e293b' : '#86909c',
                      }}
                    >
                      {item.lastMessage || 'No messages yet'}
                    </div>
                  </div>
                  {hasUnread && (
                    <span className="chat-unread-badge">
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Panel */}
      <div className="chat-main-panel">
        {error && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontSize: '13px',
              borderBottom: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        {!activeConversation ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#86909c',
              fontSize: '14px',
            }}
          >
            Select a contact on the left to start live chat.
          </div>
        ) : (
          <>
            {/* Header displaying active chat partner name */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 600,
                color: '#1e293b',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#e6f4ff',
                  color: '#1677ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={18} />
              </div>
              <span>{activeConversation.otherUser?.name || (isInstructor ? 'Student' : 'Instructor')}</span>
            </div>

            {/* Messages Area */}
            <div className="chat-messages-area" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {isLoadingMessages ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#86909c' }}>
                  <Loader2 size={20} className="spin-icon" style={{ marginBottom: '6px' }} />
                  <div>Loading message history...</div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#86909c', fontSize: '13px' }}>
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = isMyMessage(msg);
                  const timeStr = formatMessageTime(msg.createdAt);

                  return (
                    <div
                      key={msg.id || msg.createdAt || Math.random()}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: mine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div className={`message-bubble ${mine ? 'outgoing' : 'incoming'}`}>
                        {msg.text}
                      </div>

                      {/* Message Footer: Timestamp & Read Status */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#94a3b8',
                          marginTop: '2px',
                          padding: '0 4px',
                        }}
                      >
                        {timeStr && <span>{timeStr}</span>}
                        {mine && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: msg.isRead ? '#1677ff' : '#94a3b8',
                              fontWeight: msg.isRead ? 600 : 400,
                            }}
                          >
                            {msg.isRead ? (
                              <>
                                <CheckCheck size={14} />
                                <span>Đã đọc</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>Đã gửi</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply message bar */}
            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-reply-input"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isSending}
              />
              <button type="submit" className="chat-send-btn" title="Send message" disabled={isSending || !inputMessage.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
