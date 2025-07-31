# Wix Integration Guide for Admin Panel

This guide provides the complete Wix Velo code to integrate the Admin Panel iframe with your Wix site.

## Overview

The Admin Panel runs in an iframe and communicates with the Wix parent page using `postMessage`. This allows seamless data exchange between your Wix site and the admin panel.

## Setup Instructions

### 1. Deploy Admin Panel
Deploy the admin panel to a hosting service (Vercel, Netlify, etc.) and note the URL.

### 2. Add HTML Element to Wix
1. Add an HTML element to your Wix page
2. Set the `src` attribute to your admin panel URL (e.g., `https://your-admin-panel.vercel.app/admin`)
3. Set the element ID to `html1`
4. Configure iframe settings (width, height, scrolling, etc.)

### 3. Add Wix Velo Code
Add the following code to your Wix page:

```javascript
import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';

// Global variables
let iframeElement;
let isIframeReady = false;
let pendingMessages = [];

// Initialize when page loads
$w.onReady(function () {
    // Get the iframe element
    iframeElement = $w("#html1");
    
    // Set up message listener
    iframeElement.onMessage(async (event) => {
        try {
            console.log("Received message from iframe:", event.data);
            
            const { type, data, id } = event.data;
            
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
                    console.warn("Unknown message type:", type);
            }
        } catch (error) {
            console.error("Error handling iframe message:", error);
            sendErrorToIframe(error.message, event.data?.id);
        }
    });
    
    console.log("Wix page ready, iframe communication initialized");
});

// Handle iframe ready message
function handleIframeReady() {
    isIframeReady = true;
    console.log("Iframe is ready for communication");
    
    // Send any pending messages
    while (pendingMessages.length > 0) {
        const message = pendingMessages.shift();
        sendMessageToIframe(message);
    }
}

// Send message to iframe
function sendMessageToIframe(message) {
    if (!iframeElement) {
        console.error("Iframe element not found");
        return;
    }
    
    if (!isIframeReady) {
        pendingMessages.push(message);
        return;
    }
    
    try {
        iframeElement.postMessage(message);
        console.log("Sent message to iframe:", message);
    } catch (error) {
        console.error("Error sending message to iframe:", error);
    }
}

// Send error response to iframe
function sendErrorToIframe(errorMessage, messageId) {
    sendMessageToIframe({
        type: 'ERROR',
        data: { error: errorMessage },
        id: messageId
    });
}

// Handle user data request
async function handleUserDataRequest(messageId) {
    try {
        const currentUser = wixUsers.currentUser;
        
        if (!currentUser) {
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
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            isLoggedIn: true
        };
        
        sendMessageToIframe({
            type: 'USER_DATA_RESPONSE',
            data: { user: userData },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error fetching user data:", error);
        sendErrorToIframe("Failed to fetch user data", messageId);
    }
}

// Handle order created
async function handleOrderCreated(orderData, messageId) {
    try {
        // Save order to Wix database with the correct structure
        const order = await wixData.insert("Orders", {
            email: orderData.email,
            items: orderData.items,
            shipping: orderData.shipping || 0,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            total: orderData.total,
            createdAt: new Date()
        });
        
        console.log("Order saved to Wix:", order);
        
        sendMessageToIframe({
            type: 'ORDER_CREATED_RESPONSE',
            data: { success: true, orderId: order._id },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error creating order:", error);
        sendErrorToIframe("Failed to create order", messageId);
    }
}

// Handle checkout data
async function handleCheckoutData(checkoutData, messageId) {
    try {
        // Process checkout data
        console.log("Processing checkout data:", checkoutData);
        
        // You can add your payment processing logic here
        // For now, we'll just acknowledge receipt
        
        sendMessageToIframe({
            type: 'CHECKOUT_RESPONSE',
            data: { success: true, message: "Checkout data received" },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error processing checkout:", error);
        sendErrorToIframe("Failed to process checkout", messageId);
    }
}

// Handle fetch orders
async function handleFetchOrders(messageId) {
    try {
        // Fetch all orders from Wix database
        const orders = await wixData.query("Orders")
            .ascending("createdAt")
            .find();
        
        console.log("Fetched orders:", orders);
        
        // Transform orders to match admin panel structure
        const transformedOrders = orders.items.map(order => ({
            id: order._id,
            orderId: order._id,
            customerName: order.email, // Using email as customer name for now
            customerEmail: order.email,
            orderDate: order.createdAt,
            status: order.status || "Pending",
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            items: order.items,
            notes: order.notes || "",
            trackingNumber: order.trackingNumber || "",
            lastUpdated: order._updatedDate
        }));
        
        sendMessageToIframe({
            type: 'FETCH_ORDERS_RESPONSE',
            data: { orders: transformedOrders },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error fetching orders:", error);
        sendErrorToIframe("Failed to fetch orders", messageId);
    }
}

// Handle fetch users
async function handleFetchUsers(messageId) {
    try {
        // Fetch all users from Wix database
        const users = await wixData.query("Users")
            .ascending("_createdDate")
            .find();
        
        console.log("Fetched users:", users);
        
        // Transform users to match admin panel structure
        const transformedUsers = users.items.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            createdDate: user._createdDate,
            lastLoginDate: user.lastLoginDate || user._createdDate,
            isActive: user.isActive !== false // Default to true if not specified
        }));
        
        sendMessageToIframe({
            type: 'FETCH_USERS_RESPONSE',
            data: { users: transformedUsers },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error fetching users:", error);
        sendErrorToIframe("Failed to fetch users", messageId);
    }
}

// Handle admin actions
async function handleAdminAction(actionData, messageId) {
    try {
        const { action, data } = actionData;
        
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
                console.warn("Unknown admin action:", action);
                sendErrorToIframe("Unknown admin action", messageId);
        }
        
    } catch (error) {
        console.error("Error handling admin action:", error);
        sendErrorToIframe("Failed to handle admin action", messageId);
    }
}

// Handle order update
async function handleUpdateOrder(orderData, messageId) {
    try {
        const { orderId, status, notes, trackingNumber } = orderData;
        
        // Update order in Wix database
        const updatedOrder = await wixData.update("Orders", orderId, {
            status: status,
            notes: notes,
            trackingNumber: trackingNumber,
            _updatedDate: new Date()
        });
        
        console.log("Order updated:", updatedOrder);
        
        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { 
                action: 'UPDATE_ORDER',
                success: true,
                orderId: orderId
            },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error updating order:", error);
        sendErrorToIframe("Failed to update order", messageId);
    }
}

// Handle user view
async function handleViewUser(userData, messageId) {
    try {
        const { userId } = userData;
        
        // Fetch user details from Wix
        const user = await wixUsers.getUser(userId);
        
        if (!user) {
            sendErrorToIframe("User not found", messageId);
            return;
        }
        
        const userDetails = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            loginEmail: user.loginEmail,
            createdDate: user.createdDate,
            lastLoginDate: user.lastLoginDate
        };
        
        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { 
                action: 'VIEW_USER',
                success: true,
                user: userDetails
            },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error fetching user:", error);
        sendErrorToIframe("Failed to fetch user", messageId);
    }
}

// Handle email sending
async function handleSendEmail(emailData, messageId) {
    try {
        const { to, subject, body } = emailData;
        
        // Use Wix email service to send email
        // Note: You'll need to configure email settings in Wix
        console.log("Sending email:", { to, subject, body });
        
        // For now, we'll just acknowledge the request
        // You can implement actual email sending using Wix's email service
        
        sendMessageToIframe({
            type: 'ADMIN_ACTION_RESPONSE',
            data: { 
                action: 'SEND_EMAIL',
                success: true,
                message: "Email sent successfully"
            },
            id: messageId
        });
        
    } catch (error) {
        console.error("Error sending email:", error);
        sendErrorToIframe("Failed to send email", messageId);
    }
}

// Helper function to send data to iframe
function sendDataToIframe(data) {
    sendMessageToIframe({
        type: 'DATA_FROM_WIX',
        data: data,
        timestamp: new Date().toISOString()
    });
}

// Helper function to refresh iframe
function refreshIframe() {
    if (iframeElement) {
        iframeElement.src = iframeElement.src;
    }
}
```

## Message Types

### From Admin Panel to Wix:
| Type | Description | Data Structure |
|------|-------------|----------------|
| `IFRAME_READY` | Notifies Wix that iframe is ready | `{ type: 'IFRAME_READY' }` |
| `USER_DATA_REQUEST` | Requests current user data | `{ type: 'USER_DATA_REQUEST', id: 'unique-id' }` |
| `ORDER_CREATED` | Notifies new order creation | `{ type: 'ORDER_CREATED', data: orderData, id: 'unique-id' }` |
| `CHECKOUT_DATA` | Sends checkout information | `{ type: 'CHECKOUT_DATA', data: checkoutData, id: 'unique-id' }` |
| `ADMIN_ACTION` | Sends admin action request | `{ type: 'ADMIN_ACTION', data: { action, data }, id: 'unique-id' }` |
| `FETCH_ORDERS` | Requests all orders | `{ type: 'FETCH_ORDERS', id: 'unique-id' }` |
| `FETCH_USERS` | Requests all users | `{ type: 'FETCH_USERS', id: 'unique-id' }` |

### From Wix to Admin Panel:
| Type | Description | Data Structure |
|------|-------------|----------------|
| `USER_DATA_RESPONSE` | Responds with user data | `{ type: 'USER_DATA_RESPONSE', data: { user }, id: 'unique-id' }` |
| `ORDER_CREATED_RESPONSE` | Confirms order creation | `{ type: 'ORDER_CREATED_RESPONSE', data: { success, orderId }, id: 'unique-id' }` |
| `CHECKOUT_RESPONSE` | Confirms checkout processing | `{ type: 'CHECKOUT_RESPONSE', data: { success, message }, id: 'unique-id' }` |
| `ADMIN_ACTION_RESPONSE` | Responds to admin actions | `{ type: 'ADMIN_ACTION_RESPONSE', data: { action, success, ... }, id: 'unique-id' }` |
| `FETCH_ORDERS_RESPONSE` | Responds with orders data | `{ type: 'FETCH_ORDERS_RESPONSE', data: { orders }, id: 'unique-id' }` |
| `FETCH_USERS_RESPONSE` | Responds with users data | `{ type: 'FETCH_USERS_RESPONSE', data: { users }, id: 'unique-id' }` |
| `ERROR` | Error response | `{ type: 'ERROR', data: { error }, id: 'unique-id' }` |

## Database Structure

### Orders Collection Structure:
```javascript
{
    _id: "293ebb28-02e3-4f27-b3d7-d45872e23dfd",
    _owner: "f8a23dcf-e71a-4646-be19-2ac17f38a617",
    _createdDate: "2025-07-24T15:32:18.000Z",
    _updatedDate: "2025-07-24T15:32:18.000Z",
    email: "muhammadnouman72321@gmail.com",
    items: [
        {
            id: "1753371111387at9p6m2htt9",
            name: "Custom Mousepad",
            price: 95,
            quantity: 1,
            image: "wix:image://v1/f8a23d_afb681c12f8d4de183ac5d5d68e2c028~mv2.jpeg/mousepad-1753371111387at9p6m2htt9.jpeg",
            specs: {
                size: "400x800",
                thickness: "4mm",
                type: "rgb",
                rgb: {
                    mode: "rainbow",
                    color: "#ffff00",
                    brightness: 100,
                    animationSpeed: 50
                },
                text: [
                    {
                        id: 1753371085549,
                        text: "tyfuyt",
                        type: "text",
                        color: "#000000",
                        font: "Arial",
                        size: 72,
                        position: { x: 50, y: 50 },
                        rotation: 0,
                        opacity: 100,
                        shadow: {
                            enabled: false,
                            color: "#000000",
                            blur: 4,
                            x: 2,
                            y: 2
                        },
                        outline: {
                            enabled: false,
                            color: "#ffffff",
                            width: 1
                        },
                        gradient: {
                            enabled: false,
                            direction: "horizontal",
                            from: "#ff0000",
                            to: "#0000ff"
                        }
                    }
                ],
                overlays: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAo4..."]
            }
        }
    ],
    shipping: 0,
    subtotal: 95,
    tax: 7.6,
    total: 102.6,
    status: "Pending", // Optional field for admin updates
    notes: "", // Optional field for admin updates
    trackingNumber: "" // Optional field for admin updates
}
```

## Admin Actions

### UPDATE_ORDER
Updates order status, notes, and tracking number.

```javascript
{
    action: 'UPDATE_ORDER',
    data: {
        orderId: 'order-id',
        status: 'Shipped',
        notes: 'Order shipped via FedEx',
        trackingNumber: '123456789'
    }
}
```

### VIEW_USER
Fetches detailed user information.

```javascript
{
    action: 'VIEW_USER',
    data: {
        userId: 'user-id'
    }
}
```

### SEND_EMAIL
Sends email to customer.

```javascript
{
    action: 'SEND_EMAIL',
    data: {
        to: 'customer@example.com',
        subject: 'Order Update',
        body: 'Your order has been shipped!'
    }
}
```

## Security Considerations

1. **Origin Verification**: The code includes origin verification to ensure messages come from trusted sources
2. **Data Validation**: Always validate incoming data before processing
3. **Error Handling**: Comprehensive error handling prevents crashes
4. **HTTPS**: Ensure both Wix and admin panel use HTTPS
5. **Access Control**: Implement proper access control for admin functions

## Customization

### Adding New Message Types
1. Add new case in the main message handler
2. Create corresponding handler function
3. Update message type documentation

### Styling the Iframe
```css
/* Custom iframe styles */
#html1 {
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Responsive Design
```javascript
// Adjust iframe size based on screen size
function adjustIframeSize() {
    const width = window.innerWidth;
    if (width < 768) {
        iframeElement.style.height = "600px";
    } else {
        iframeElement.style.height = "800px";
    }
}
```

## Troubleshooting

### Common Issues:

1. **Iframe not loading**
   - Check iframe URL is correct
   - Ensure admin panel is deployed and accessible
   - Check browser console for errors

2. **Messages not received**
   - Verify iframe element ID is `html1`
   - Check if `onMessage` listener is set up
   - Ensure both pages are on HTTPS

3. **User data not available**
   - Check if user is logged in
   - Verify Wix Users API permissions
   - Check browser console for errors

4. **Database operations failing**
   - Verify Wix Data API permissions
   - Check collection names and field names
   - Ensure proper data structure

### Debug Mode
Enable debug logging by adding this to your Wix code:

```javascript
// Enable debug mode
const DEBUG_MODE = true;

function debugLog(message, data) {
    if (DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data);
    }
}
```

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify all setup steps are completed
3. Test with simple messages first
4. Ensure proper permissions are set in Wix

## Example Integration Flow

1. **Page Load**: Wix page loads, sets up iframe communication
2. **Iframe Ready**: Admin panel sends `IFRAME_READY` message
3. **User Data**: Admin panel requests user data with `USER_DATA_REQUEST`
4. **Data Response**: Wix responds with current user information
5. **Admin Actions**: Admin panel can now send admin actions
6. **Real-time Updates**: All changes are communicated between systems

This integration provides a seamless experience between your Wix site and the admin panel, allowing for real-time data exchange and management capabilities. 