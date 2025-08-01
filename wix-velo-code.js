import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';

let iframeElement;
let isIframeReady = false;
let pendingMessages = [];

$w.onReady(function () {
    iframeElement = $w("#html1");

    iframeElement.onMessage(async (event) => {
        console.log('📨 Wix received message from iframe:', event.data);
        const { type, data, id } = event.data;

        try {
            console.log('🔄 Processing message type:', type, 'with id:', id);
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
            case 'UPDATE_ORDER_STATUS':
                await handleUpdateOrderStatus(data, id);
                break;
            case 'FETCH_ORDERS':
                await handleFetchOrders(id);
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
    console.log('📤 Wix: Sending message to iframe:', message.type, message.id);
    if (!iframeElement) {
        console.warn('⚠️ Wix: No iframe element found');
        return;
    }
    if (!isIframeReady) {
        console.log('⏳ Wix: Iframe not ready, queuing message');
        return pendingMessages.push(message);
    }
    console.log('✅ Wix: Sending message to iframe');
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

        const email = await currentUser.getEmail();
        const userData = {
            id: currentUser.id,
            email,
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
        console.log('📋 Wix: Fetching orders from database...');
        const orders = await wixData.query("Orders").ascending("createdAt").find();
        console.log('📊 Wix: Found', orders.items.length, 'orders in database');

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

        console.log('✅ Wix: Sending', transformedOrders.length, 'orders to iframe');
        sendMessageToIframe({
            type: 'FETCH_ORDERS_RESPONSE',
            data: { orders: transformedOrders },
            id: messageId
        });
    } catch (error) {
        console.error('❌ Wix: Error fetching orders:', error);
        sendErrorToIframe("Failed to fetch orders", messageId);
    }
}

async function handleAdminAction(actionData, messageId) {
    const { action, data } = actionData;
    try {
        switch (action) {
        case 'UPDATE_ORDER':
            await handleUpdateOrder(data, messageId);
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

        if (!orderId || !status) {
            console.error('❌ Missing orderId or status');
            sendErrorToIframe("Missing orderId or status", messageId);
            return;
        }

        const updatedOrder = await wixData.update("Orders", {
            _id: orderId,
            status,
            _updatedDate: new Date()
        });

        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { action: 'UPDATE_ORDER', success: true, orderId },
            id: messageId
        });

        console.log('✅ Order updated via handleUpdateOrder:', updatedOrder);

    } catch (error) {
        console.error('❌ Error in handleUpdateOrder:', error);
        sendErrorToIframe("Failed to update order: " + error.message, messageId);
    }
}

async function handleUpdateOrderStatus(orderData, messageId) {
    try {
        console.log('🔄 Processing order status update:', orderData);

        const { orderId, newStatus } = orderData;

        if (!orderId || !newStatus) {
            console.error('❌ Missing required fields:', orderData);
            sendErrorToIframe("Missing orderId or newStatus", messageId);
            return;
        }

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            console.error('❌ Invalid status:', newStatus);
            sendErrorToIframe("Invalid status value. Must be one of: " + validStatuses.join(', '), messageId);
            return;
        }

        const existingOrder = await wixData.get("Orders", orderId);
        if (!existingOrder) {
            sendErrorToIframe("Order not found: " + orderId, messageId);
            return;
        }

        const updatedOrder = await wixData.update("Orders", {
            _id: orderId,
            status: newStatus,
            _updatedDate: new Date()
        });

        sendMessageToIframe({
            type: 'UPDATE_ORDER_STATUS',
            data: {
                orderId,
                newStatus,
                success: true,
                message: "Order status updated successfully",
                timestamp: new Date().toISOString()
            },
            id: messageId
        });

        console.log('✅ Order updated via handleUpdateOrderStatus:', updatedOrder);

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        sendErrorToIframe("Failed to update order status: " + error.message, messageId);
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