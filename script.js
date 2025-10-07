class PTITChatWebSocketTest {
    constructor() {
        this.stompClient = null;
        this.isConnected = false;
        this.currentUser = null;
        this.accessToken = null;
        this.unreadCount = 0;
        this.notifications = [];
        this.users = new Map();
        this.currentTab = 'received';

        this.API_BASE = 'http://localhost:8080/api/v1';

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.log('🚀 PTIT Chat WebSocket Test initialized');
    }

    bindEvents() {
        // Login events
        document.getElementById('login-btn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Quick login buttons
        document.querySelectorAll('.quick-login-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.target.getAttribute('data-email');
                const password = e.target.getAttribute('data-password');
                this.quickLogin(email, password);
            });
        });

        // Friend request events
        document.getElementById('send-request-btn').addEventListener('click', () => {
            this.sendFriendRequest();
        });

        document.getElementById('receiver-id').addEventListener('input', () => {
            this.updateSendButton();
        });

        // Search events
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchUsers();
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });

        // Tab events
        document.getElementById('received-tab').addEventListener('click', () => {
            this.switchTab('received');
        });

        document.getElementById('sent-tab').addEventListener('click', () => {
            this.switchTab('sent');
        });

        // Action button events
        document.getElementById('load-requests-btn').addEventListener('click', () => {
            this.loadRequests();
        });

        document.getElementById('load-friends-btn').addEventListener('click', () => {
            this.loadFriends();
        });

        document.getElementById('load-notifications-btn').addEventListener('click', () => {
            this.loadNotifications();
        });

        document.getElementById('clear-notifications').addEventListener('click', () => {
            this.clearNotifications();
        });

        document.getElementById('test-connection').addEventListener('click', () => {
            this.testConnection();
        });

        document.getElementById('clear-log').addEventListener('click', () => {
            this.clearLog();
        });

        // Enter key listeners
        document.getElementById('email-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        document.getElementById('password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        document.getElementById('friend-message').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendFriendRequest();
        });
    }

    // Authentication methods
    async login() {
        const email = document.getElementById('email-input').value.trim();
        const password = document.getElementById('password-input').value.trim();

        if (!email || !password) {
            this.log('❌ Vui lòng nhập email và password');
            return;
        }

        await this.performLogin(email, password);
    }

    async quickLogin(email, password) {
        await this.performLogin(email, password);
    }

    async performLogin(email, password) {
        this.log(`Đăng nhập với: ${email}`);

        try {
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: email,
                    password: password
                })
            });

            const result = await response.json();

            if (result.statusCode === 200 && result.data) {
                this.accessToken = result.data.accessToken;
                this.currentUser = result.data;

                localStorage.setItem('jwt_token', this.accessToken);
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));

                this.log(`✅ Đăng nhập thành công: ${this.currentUser.fullName}`);
                this.updateLoginUI(true);
                this.connectWebSocket();

                // Load initial data
                await this.loadInitialData();

            } else {
                throw new Error(result.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            this.log(`❌ Lỗi đăng nhập: ${error.message}`);
            alert(`Đăng nhập thất bại: ${error.message}`);
        }
    }

    logout() {
        this.log('👋 Đăng xuất...');

        this.disconnectWebSocket();
        this.currentUser = null;
        this.accessToken = null;

        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');

        this.updateLoginUI(false);
        this.clearAllData();

        // Clear form inputs
        document.getElementById('email-input').value = '';
        document.getElementById('password-input').value = '';
    }

    // WebSocket connection methods
    connectWebSocket() {
        if (this.isConnected || !this.accessToken) {
            return;
        }

        this.log('🔗 Đang kết nối WebSocket...');

        const socket = new SockJS(`${this.API_BASE}/ws`);
        this.stompClient = Stomp.over(socket);

        // Configure debug logging
        this.stompClient.debug = (msg) => {
            if (msg.includes('ERROR') || msg.includes('CONNECT') || msg.includes('DISCONNECT')) {
                this.log(`🔧 STOMP: ${msg}`);
            }
        };

        const headers = {
            'Authorization': `Bearer ${this.accessToken}`
        };

        this.stompClient.connect(headers,
            (frame) => {
                this.onWebSocketConnected(frame);
            },
            (error) => {
                this.onWebSocketError(error);
            }
        );
    }

    onWebSocketConnected(frame) {
        this.isConnected = true;
        this.log(`✅ WebSocket connected cho user: ${this.currentUser.fullName}`);
        this.updateConnectionStatus(true);

        // Subscribe to personal notification topic
        const notificationTopic = `/topic/users/${this.currentUser.id}/notifications`;
        this.log(`📡 Subscribing to: ${notificationTopic}`);

        this.stompClient.subscribe(notificationTopic, (message) => {
            this.log(`📩 Received notification: ${message.body}`);
            this.handleIncomingNotification(JSON.parse(message.body));
        });

        this.updateUI();
    }

    onWebSocketError(error) {
        this.log(`❌ WebSocket connection error: ${error}`);
        this.isConnected = false;
        this.updateConnectionStatus(false);

        // Auto reconnect sau 5 giây
        if (this.accessToken) {
            setTimeout(() => {
                this.log('🔄 Attempting to reconnect WebSocket...');
                this.connectWebSocket();
            }, 5000);
        }
    }

    disconnectWebSocket() {
        if (this.stompClient && this.isConnected) {
            this.stompClient.disconnect(() => {
                this.log('👋 WebSocket disconnected');
            });
        }
        this.isConnected = false;
        this.updateConnectionStatus(false);
    }

    // Notification handler
    handleIncomingNotification(notification) {
        this.log(`🔔 Handling notification type: ${notification.type}`);

        switch (notification.type) {
            case 'FRIEND_REQUEST':
                this.handleFriendRequestNotification(notification);
                break;
            case 'FRIEND_REQUEST_ACCEPTED':
                this.handleFriendAcceptedNotification(notification);
                break;
            case 'FRIEND_REQUEST_REJECTED':
                this.handleFriendRejectedNotification(notification);
                break;
            default:
                this.log(`❓ Unknown notification type: ${notification.type}`);
                this.handleGenericNotification(notification);
        }
    }

    handleFriendRequestNotification(notification) {
        this.log(`🔔 Nhận lời mời kết bạn từ: ${notification.senderDisplayName}`);

        const notificationHtml = `
            <div class="notification-item friend-request new" data-request-id="${notification.requestId}">
                <div class="notification-header">
                    <span class="notification-type">📨 Lời mời kết bạn</span>
                    <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                </div>
                <div class="notification-content">
                    <strong>${notification.senderDisplayName}</strong> muốn kết bạn với bạn
                    ${notification.message ? `<br><em>"${notification.message}"</em>` : ''}
                </div>
                <div class="notification-actions">
                    <button class="accept-btn" onclick="app.acceptFriendRequest('${notification.requestId}')">
                        ✅ Chấp nhận
                    </button>
                    <button class="reject-btn" onclick="app.rejectFriendRequest('${notification.requestId}')">
                        ❌ Từ chối
                    </button>
                </div>
            </div>
        `;

        this.addNotificationToUI(notificationHtml);
        this.updateUnreadCount(1);
        this.playNotificationSound();

        // Reload received requests if on that tab
        if (this.currentTab === 'received') {
            setTimeout(() => this.loadRequests(), 1000);
        }
    }

    handleFriendAcceptedNotification(notification) {
        this.log(`✅ ${notification.acceptorDisplayName} đã chấp nhận lời mời kết bạn`);

        const notificationHtml = `
            <div class="notification-item friend-accepted new">
                <div class="notification-header">
                    <span class="notification-type">✅ Lời mời được chấp nhận</span>
                    <span class="notification-time">${this.formatTime(notification.acceptedAt)}</span>
                </div>
                <div class="notification-content">
                    <strong>${notification.acceptorDisplayName}</strong> đã chấp nhận lời mời kết bạn của bạn! 🎉
                </div>
            </div>
        `;

        this.addNotificationToUI(notificationHtml);
        this.updateUnreadCount(1);
        this.playNotificationSound();

        // Reload friends list
        this.loadFriends();
    }

    handleFriendRejectedNotification(notification) {
        this.log(`❌ ${notification.rejectorName} đã từ chối lời mời kết bạn`);

        const notificationHtml = `
            <div class="notification-item friend-rejected new">
                <div class="notification-header">
                    <span class="notification-type">❌ Lời mời bị từ chối</span>
                    <span class="notification-time">${this.formatTime(notification.rejectedAt)}</span>
                </div>
                <div class="notification-content">
                    <strong>${notification.rejectorName}</strong> đã từ chối lời mời kết bạn
                </div>
            </div>
        `;

        this.addNotificationToUI(notificationHtml);
        this.updateUnreadCount(1);
    }

    handleGenericNotification(notification) {
        const notificationHtml = `
            <div class="notification-item new">
                <div class="notification-header">
                    <span class="notification-type">🔔 ${notification.type}</span>
                    <span class="notification-time">${this.formatTime(new Date().toISOString())}</span>
                </div>
                <div class="notification-content">
                    ${JSON.stringify(notification)}
                </div>
            </div>
        `;

        this.addNotificationToUI(notificationHtml);
        this.updateUnreadCount(1);
    }

    // Friend request methods
    async sendFriendRequest() {
        const receiverId = document.getElementById('receiver-id').value.trim();
        const message = document.getElementById('friend-message').value.trim();

        if (!receiverId) {
            this.log('❌ Vui lòng nhập ID người nhận');
            return;
        }

        if (receiverId === this.currentUser?.id) {
            this.log('❌ Không thể gửi lời mời kết bạn cho chính mình');
            return;
        }

        this.log(`📨 Đang gửi lời mời kết bạn tới ID: ${receiverId}`);

        try {
            const requestBody = {
                receiverId: receiverId
            };

            if (message) {
                requestBody.message = message;
            }

            const response = await fetch(`${this.API_BASE}/friends/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                this.log('✅ Gửi lời mời kết bạn thành công');

                // Clear form
                document.getElementById('receiver-id').value = '';
                document.getElementById('friend-message').value = 'Xin chào! Kết bạn với mình nhé!';
                this.updateSendButton();

                // Reload sent requests if currently viewing
                if (this.currentTab === 'sent') {
                    this.loadRequests();
                }
            } else {
                this.log(`❌ Gửi lời mời thất bại: ${data.message}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi khi gửi lời mời: ${error.message}`);
        }
    }

    // Friend request actions
    async acceptFriendRequest(requestId) {
        this.log(`✅ Đang chấp nhận lời mời: ${requestId}`);

        try {
            const response = await fetch(`${this.API_BASE}/friends/requests/${requestId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.log('✅ Chấp nhận lời mời thành công');

                // Update notification in UI
                const notification = document.querySelector(`[data-request-id="${requestId}"]`);
                if (notification) {
                    notification.style.opacity = '0.5';
                    notification.innerHTML = '<div class="notification-content">✅ Đã chấp nhận lời mời</div>';
                }

                // Reload data
                this.loadRequests();
                this.loadFriends();
            } else {
                const errorData = await response.json();
                this.log(`❌ Chấp nhận lời mời thất bại: ${errorData.message}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi khi chấp nhận lời mời: ${error.message}`);
        }
    }

    async rejectFriendRequest(requestId) {
        this.log(`❌ Đang từ chối lời mời: ${requestId}`);

        try {
            const response = await fetch(`${this.API_BASE}/friends/requests/${requestId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.log('❌ Từ chối lời mời thành công');

                // Update notification in UI
                const notification = document.querySelector(`[data-request-id="${requestId}"]`);
                if (notification) {
                    notification.style.opacity = '0.5';
                    notification.innerHTML = '<div class="notification-content">❌ Đã từ chối lời mời</div>';
                }

                // Reload requests
                this.loadRequests();
            } else {
                const errorData = await response.json();
                this.log(`❌ Từ chối lời mời thất bại: ${errorData.message}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi khi từ chối lời mời: ${error.message}`);
        }
    }

    async cancelFriendRequest(requestId) {
        this.log(`🚫 Đang hủy lời mời: ${requestId}`);

        try {
            const response = await fetch(`${this.API_BASE}/friends/requests/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.log('🚫 Hủy lời mời thành công');
                this.loadRequests();
            } else {
                const errorData = await response.json();
                this.log(`❌ Hủy lời mời thất bại: ${errorData.message}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi khi hủy lời mời: ${error.message}`);
        }
    }

    // Data loading methods
    async loadInitialData() {
        this.loadRequests();
        this.loadFriends();
        this.loadNotifications();
        this.loadUnreadCount();
    }

    async loadRequests() {
        if (!this.accessToken) return;

        const endpoint = this.currentTab === 'received' ? 'received' : 'sent';
        this.log(`📥 Đang tải lời mời ${endpoint}...`);

        try {
            const response = await fetch(`${this.API_BASE}/friends/requests/${endpoint}?page=0&size=50`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const requests = data.data.results || [];
                this.displayRequests(requests);
                this.log(`✅ Đã tải ${requests.length} lời mời ${endpoint}`);
            } else {
                this.log(`❌ Lỗi tải lời mời: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi kết nối khi tải lời mời: ${error.message}`);
        }
    }

    async loadFriends() {
        if (!this.accessToken) return;

        this.log('👥 Đang tải danh sách bạn bè...');

        try {
            const response = await fetch(`${this.API_BASE}/friends?page=0&size=50`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const friends = data.data.results || [];
                this.displayFriends(friends);
                this.log(`✅ Đã tải ${friends.length} bạn bè`);
            } else {
                this.log(`❌ Lỗi tải bạn bè: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi kết nối khi tải bạn bè: ${error.message}`);
        }
    }

    async loadNotifications() {
        if (!this.accessToken) return;

        this.log('🔔 Đang tải danh sách thông báo...');

        try {
            const response = await fetch(`${this.API_BASE}/notifications?page=0&size=20`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const notifications = data.data.results || [];
                this.displayNotifications(notifications);
                this.log(`✅ Đã tải ${notifications.length} thông báo`);
            } else {
                this.log(`❌ Lỗi tải thông báo: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi kết nối khi tải thông báo: ${error.message}`);
        }
    }

    async loadUnreadCount() {
        if (!this.accessToken) return;

        try {
            const response = await fetch(`${this.API_BASE}/notifications/unread-count`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.unreadCount = data.data || 0;
                document.getElementById('unread-count').textContent = this.unreadCount > 0 ? this.unreadCount : '';
            }
        } catch (error) {
            this.log(`❌ Lỗi tải số lượng thông báo chưa đọc: ${error.message}`);
        }
    }

    async searchUsers() {
        const query = document.getElementById('search-input').value.trim();

        if (!this.accessToken) {
            this.log('❌ Chưa đăng nhập');
            return;
        }

        if (!query) {
            this.log('❌ Vui lòng nhập từ khóa tìm kiếm');
            return;
        }

        this.log(`🔍 Đang tìm kiếm: ${query}`);

        try {
            const response = await fetch(`${this.API_BASE}/users?search=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const users = data.data.results || data.data || [];
                this.displaySearchResults(users, query);
                this.log(`✅ Tìm thấy ${users.length} người dùng`);
            } else {
                this.log(`❌ Lỗi tìm kiếm: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi kết nối khi tìm kiếm: ${error.message}`);
        }
    }

    // Display methods
    displayRequests(requests) {
        const container = document.getElementById('requests-container');

        if (!requests || requests.length === 0) {
            container.innerHTML = '<div class="no-requests">Không có lời mời nào</div>';
            return;
        }

        const requestsHtml = requests.map(request => {
            const isReceived = this.currentTab === 'received';
            const displayName = isReceived ? request.senderDisplayName : request.receiverDisplayName;

            return `
                <div class="request-item">
                    <div class="request-header">
                        <div class="user-info">
                            <div class="user-avatar">${displayName.charAt(0).toUpperCase()}</div>
                            <div>
                                <div><strong>${displayName}</strong></div>
                                <div class="notification-time">${this.formatTime(request.createdAt)}</div>
                            </div>
                        </div>
                        <div class="status-badge status-${request.status.toLowerCase()}">${request.status}</div>
                    </div>
                    <div class="request-content">
                        ${request.message ? `"${request.message}"` : 'Không có tin nhắn'}
                    </div>
                    <div class="request-actions">
                        ${this.getRequestActions(request, isReceived)}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = requestsHtml;
    }

    getRequestActions(request, isReceived) {
        if (request.status === 'PENDING') {
            if (isReceived) {
                return `
                    <button class="accept-btn" onclick="app.acceptFriendRequest('${request.id}')">✅ Chấp nhận</button>
                    <button class="reject-btn" onclick="app.rejectFriendRequest('${request.id}')">❌ Từ chối</button>
                `;
            } else {
                return `<button class="cancel-btn" onclick="app.cancelFriendRequest('${request.id}')">🚫 Hủy</button>`;
            }
        }
        return `<span class="status-text">Đã xử lý</span>`;
    }

    displayFriends(friends) {
        const container = document.getElementById('friends-container');

        if (!friends || friends.length === 0) {
            container.innerHTML = '<div class="no-friends">Chưa có bạn bè nào</div>';
            return;
        }

        const friendsHtml = friends.map(friend => `
            <div class="friend-item">
                <div class="friend-header">
                    <div class="user-info">
                        <div class="user-avatar">${friend.displayName.charAt(0).toUpperCase()}</div>
                        <div>
                            <div><strong>${friend.displayName}</strong></div>
                            <div class="notification-time">Bạn bè từ ${this.formatTime(friend.becameFriendsAt)}</div>
                        </div>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="remove-friend-btn" onclick="app.removeFriend('${friend.userId}')">❌ Xóa bạn</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = friendsHtml;
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notifications-container');

        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<div class="no-notifications">Chưa có thông báo nào</div>';
            return;
        }

        const notificationsHtml = notifications.map(notification => `
            <div class="notification-item ${notification.isSeen ? 'seen' : 'unseen'}" data-id="${notification.id}">
                <div class="notification-header">
                    <span class="notification-type">${this.getNotificationTypeIcon(notification.type)} ${notification.title}</span>
                    <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                </div>
                <div class="notification-content">
                    ${notification.content}
                </div>
                <div class="notification-actions">
                    ${!notification.isSeen ? `<button class="mark-read-btn" onclick="app.markNotificationAsRead('${notification.id}')">✅ Đánh dấu đã đọc</button>` : ''}
                    <button class="delete-notification-btn" onclick="app.deleteNotification('${notification.id}')">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = notificationsHtml;
    }

    displaySearchResults(users, query) {
        const container = document.getElementById('search-results');

        // Filter users based on search query
        const filteredUsers = users.filter(user =>
            user.id !== this.currentUser?.id &&
            (user.fullName.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase()))
        );

        if (!filteredUsers || filteredUsers.length === 0) {
            container.innerHTML = '<div class="no-results">Không tìm thấy người dùng nào</div>';
            return;
        }

        const resultsHtml = filteredUsers.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-avatar">${user.fullName.charAt(0).toUpperCase()}</div>
                    <div>
                        <div><strong>${user.fullName}</strong></div>
                        <div style="font-size: 12px; color: #666;">${user.email}</div>
                        <div style="font-size: 11px; color: #999;">ID: ${user.id}</div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="add-friend-btn" onclick="app.quickSendRequest('${user.id}')">➕ Kết bạn</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = resultsHtml;
    }

    // Helper methods
    async quickSendRequest(userId) {
        document.getElementById('receiver-id').value = userId;
        this.updateSendButton();
        this.log(`📝 Đã điền ID: ${userId} vào form gửi lời mời`);
    }

    async removeFriend(friendId) {
        if (!confirm('Bạn có chắc muốn xóa bạn bè này?')) return;

        this.log(`❌ Đang xóa bạn bè: ${friendId}`);

        try {
            const response = await fetch(`${this.API_BASE}/friends/${friendId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.log('✅ Xóa bạn bè thành công');
                this.loadFriends();
            } else {
                const errorData = await response.json();
                this.log(`❌ Xóa bạn bè thất bại: ${errorData.message}`);
            }
        } catch (error) {
            this.log(`❌ Lỗi khi xóa bạn bè: ${error.message}`);
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`${this.API_BASE}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.log(`✅ Đã đánh dấu thông báo ${notificationId} là đã đọc`);
                this.loadNotifications();
                this.loadUnreadCount();
            }
        } catch (error) {
            this.log(`❌ Lỗi đánh dấu đã đọc: ${error.message}`);
        }
    }

    async deleteNotification(notificationId) {
        if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;

        try {
            const response = await fetch(`${this.API_BASE}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.log(`✅ Đã xóa thông báo ${notificationId}`);
                this.loadNotifications();
                this.loadUnreadCount();
            }
        } catch (error) {
            this.log(`❌ Lỗi xóa thông báo: ${error.message}`);
        }
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');

        // Load data for selected tab
        this.loadRequests();
    }

    // UI methods
    updateLoginUI(isLoggedIn) {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const currentUserDisplay = document.getElementById('current-user-display');

        if (isLoggedIn) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            currentUserDisplay.textContent = this.currentUser.fullName;
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            currentUserDisplay.textContent = 'Chưa đăng nhập';
        }

        this.updateUI();
    }

    updateConnectionStatus(isOnline) {
        const statusElement = document.getElementById('connection-status');
        statusElement.textContent = isOnline ? 'Online' : 'Offline';
        statusElement.className = `status ${isOnline ? 'online' : 'offline'}`;
    }

    updateUI() {
        this.updateSendButton();
    }

    updateSendButton() {
        const sendBtn = document.getElementById('send-request-btn');
        const receiverId = document.getElementById('receiver-id').value.trim();

        const canSend = this.accessToken && receiverId && receiverId !== this.currentUser?.id;
        sendBtn.disabled = !canSend;
    }

    addNotificationToUI(notificationHtml) {
        const container = document.getElementById('notifications-container');
        const noNotifications = container.querySelector('.no-notifications');

        if (noNotifications) {
            noNotifications.remove();
        }

        container.insertAdjacentHTML('afterbegin', notificationHtml);

        // Remove animation class after animation completes
        setTimeout(() => {
            const newNotification = container.querySelector('.notification-item.new');
            if (newNotification) {
                newNotification.classList.remove('new');
            }
        }, 500);
    }

    clearNotifications() {
        const container = document.getElementById('notifications-container');
        container.innerHTML = '<div class="no-notifications">Chưa có thông báo nào</div>';
        this.unreadCount = 0;
        document.getElementById('unread-count').textContent = '';
        this.log('🗑️ Đã xóa tất cả thông báo trong UI');
    }

    clearAllData() {
        // Clear all containers
        document.getElementById('notifications-container').innerHTML = '<div class="no-notifications">Chưa có thông báo nào</div>';
        document.getElementById('requests-container').innerHTML = '<div class="no-requests">Không có lời mời nào</div>';
        document.getElementById('friends-container').innerHTML = '<div class="no-friends">Chưa có bạn bè nào</div>';
        document.getElementById('search-results').innerHTML = '';

        this.unreadCount = 0;
        document.getElementById('unread-count').textContent = '';
    }

    updateUnreadCount(increment = 0) {
        this.unreadCount += increment;
        if (this.unreadCount < 0) this.unreadCount = 0;

        document.getElementById('unread-count').textContent = this.unreadCount > 0 ? this.unreadCount : '';
    }

    testConnection() {
        if (this.isConnected) {
            this.log('✅ WebSocket connection is active');
            this.log(`📊 Connected as: ${this.currentUser.fullName}`);
            this.log(`🎫 Token valid: ${this.accessToken ? 'Yes' : 'No'}`);
        } else {
            this.log('❌ WebSocket is not connected');
            if (this.accessToken) {
                this.connectWebSocket();
            } else {
                this.log('❌ No access token available');
            }
        }
    }

    getNotificationTypeIcon(type) {
        switch (type) {
            case 'FRIEND_REQUEST':
                return '📨';
            case 'FRIEND_REQUEST_ACCEPTED':
                return '✅';
            case 'FRIEND_REQUEST_REJECTED':
                return '❌';
            case 'NEW_MESSAGE':
                return '💬';
            default:
                return '🔔';
        }
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            this.log('🔊 Notification sound played');
        }
    }

    formatTime(isoString) {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('vi-VN');
    }

    log(message) {
        const debugLog = document.getElementById('debug-log');
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}\n`;

        debugLog.textContent += logMessage;
        debugLog.scrollTop = debugLog.scrollHeight;

        console.log(message);
    }

    clearLog() {
        document.getElementById('debug-log').textContent = '';
        this.log('🧹 Debug log cleared');
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PTITChatWebSocketTest();
});

// Make app globally accessible for HTML onclick handlers
window.app = app;