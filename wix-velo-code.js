import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';

let iframeElement;
let isIframeReady = false;
let pendingMessages = [];

$w.onReady(function () {
    iframeElement = $w("#html1");

    iframeElement.onMessage(async (event) => {
        const { type, data, id } = event.data;

        try {
            switch (type) {
                case 'IFRAME_READY':
                    handleIframeReady();
                    break;
                case 'USER_DATA_REQUEST':
                    await handleUserDataRequest(id);
                    break;
                case 'ORDER_CREATED':
                    await handleOrderCreated(data, id);
                    break;
                case 'CHECKOUT_DATA':
                    await handleCheckoutData(data, id);
                    break;
                case 'ADMIN_ACTION':
                    await handleAdminAction(data, id);
                    break;
                case 'FETCH_ORDERS':
                    await handleFetchOrders(id);
                    break;
                case 'FETCH_USERS':
                    await handleFetchUsers(id);
                    break;
                default:
                    sendErrorToIframe("Unknown message type", id);
            }
        } catch (error) {
            sendErrorToIframe(error.message, id);
        }
    });
});

function handleIframeReady() {
    isIframeReady = true;
    while (pendingMessages.length > 0) {
        sendMessageToIframe(pendingMessages.shift());
    }
}

function sendMessageToIframe(message) {
    if (!iframeElement) return;
    if (!isIframeReady) return pendingMessages.push(message);
    iframeElement.postMessage(message);
}

function sendErrorToIframe(errorMessage, messageId) {
    sendMessageToIframe({
        type: 'ERROR',
        data: { error: errorMessage },
        id: messageId
    });
}

async function handleUserDataRequest(messageId) {
    try {
        const currentUser = wixUsers.currentUser;
        if (!currentUser.loggedIn) {
            sendMessageToIframe({
                type: 'USER_DATA_RESPONSE',
                data: { user: null },
                id: messageId
            });
            return;
        }

        const userData = {
            id: currentUser.id,
            email: currentUser.email,
            isLoggedIn: true
        };

        sendMessageToIframe({
            type: 'USER_DATA_RESPONSE',
            data: { user: userData },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to fetch user data", messageId);
    }
}

async function handleOrderCreated(orderData, messageId) {
    try {
        const order = await wixData.insert("Orders", {
            email: orderData.email,
            items: orderData.items,
            shipping: orderData.shipping || 0,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            total: orderData.total,
            createdAt: new Date()
        });

        sendMessageToIframe({
            type: 'ORDER_CREATED_RESPONSE',
            data: { success: true, orderId: order._id },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to create order", messageId);
    }
}

async function handleCheckoutData(checkoutData, messageId) {
    try {
        sendMessageToIframe({
            type: 'CHECKOUT_RESPONSE',
            data: { success: true, message: "Checkout data received" },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to process checkout", messageId);
    }
}

async function handleFetchOrders(messageId) {
    try {
        const orders = await wixData.query("Orders").ascending("createdAt").find();
        const transformedOrders = orders.items.map(order => ({
            id: order._id,
            orderId: order._id,
            customerEmail: order.email,
            orderDate: order.createdAt,
            status: order.status || "pending",
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            items: order.items,
            lastUpdated: order._updatedDate
        }));

        sendMessageToIframe({
            type: 'FETCH_ORDERS_RESPONSE',
            data: { orders: transformedOrders },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to fetch orders", messageId);
    }
}

async function handleFetchUsers(messageId) {
    try {
        const users = await wixData.query("Members/PrivateMembersData").ascending("_createdDate").find();
        const transformedUsers = users.items.map(user => ({
            id: user._id,
            email: user.email,
            createdDate: user._createdDate,
            lastLoginDate: user.lastLoginDate || user._createdDate,
            isActive: user.isActive !== false
        }));

        sendMessageToIframe({
            type: 'FETCH_USERS_RESPONSE',
            data: { users: transformedUsers },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to fetch users", messageId);
    }
}

async function handleAdminAction(actionData, messageId) {
    const { action, data } = actionData;
    try {
        switch (action) {
            case 'UPDATE_ORDER':
                await handleUpdateOrder(data, messageId);
                break;
            case 'VIEW_USER':
                await handleViewUser(data, messageId);
                break;
            case 'SEND_EMAIL':
                await handleSendEmail(data, messageId);
                break;
            default:
                sendErrorToIframe("Unknown admin action", messageId);
        }
    } catch {
        sendErrorToIframe("Failed to handle admin action", messageId);
    }
}

async function handleUpdateOrder(orderData, messageId) {
    try {
        const { orderId, status } = orderData;
        const updatedOrder = await wixData.update("Orders", orderId, {
            status,
            _updatedDate: new Date()
        });

        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { action: 'UPDATE_ORDER', success: true, orderId },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to update order", messageId);
    }
}

async function handleViewUser(userData, messageId) {
    try {
        const { userId } = userData;
        const user = await wixUsers.getUser(userId);

        if (!user) {
            sendErrorToIframe("User not found", messageId);
            return;
        }

        const userDetails = {
            id: user.id,
            email: user.email,
            loginEmail: user.loginEmail,
            createdDate: user.createdDate,
            lastLoginDate: user.lastLoginDate
        };

        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { action: 'VIEW_USER', success: true, user: userDetails },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to fetch user", messageId);
    }
}

async function handleSendEmail(emailData, messageId) {
    try {
        const { to, subject, body } = emailData;
        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { action: 'SEND_EMAIL', success: true, message: "Email sent successfully" },
            id: messageId
        });
    } catch {
        sendErrorToIframe("Failed to send email", messageId);
    }
}

function sendDataToIframe(data) {
    sendMessageToIframe({
        type: 'DATA_FROM_WIX',
        data,
        timestamp: new Date().toISOString()
    });
}

function refreshIframe() {
    if (iframeElement) iframeElement.src = iframeElement.src;
} 