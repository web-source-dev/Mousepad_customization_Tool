// frontend page code
import wixWindow from 'wix-window';
import wixPay from 'wix-pay';
import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { createCustomPayment } from 'backend/payments.jsw';
import { uploadBase64Image } from 'backend/mediaUpload.jsw';
import { sendEmail } from 'backend/email.jsw';

$w.onReady(async function () {
    // Send user info to the iframe as soon as possible
    const user = wixUsers.currentUser;
    const userEmail = await user.getEmail();
    const userId = user.id;

    console.log("sending data")
    let userData = {
        type: "userInfo",
        email: userEmail,
        id: userId
    }
    // Send user info to the iframe
    $w("#html1").postMessage(userData)
    console.log("userData sent", userData)

    // Listen for messages from the iframe (checkout, etc.)
    $w("#html1").onMessage(async (event) => {
        const data = event.data;
        console.log("receiving data", data)
        
        if (data?.type === "requestUserInfo") {
            // Handle user info request
            console.log("Sending user info in response to request");
            $w("#html1").postMessage({
                type: "userInfo",
                email: userEmail,
                id: userId
            });
        }
        
        if (data?.type === "initiatePayment") {
            const checkoutData = data.payload;
            console.log("Received payment initiation data:", checkoutData);
            await startPaymentFlow(checkoutData);
        }
    });
});

async function startPaymentFlow(data) {
    try {
        // Round total to 2 decimal places
        const total = parseFloat(parseFloat(data.total).toFixed(2));
        if (isNaN(total)) {
            throw new Error("Invalid total value from checkout data.");
        }

        console.log("Starting payment flow with total:", total);
        const paymentId = await createCustomPayment(total);
        const result = await wixPay.startPayment(paymentId);

        const user = wixUsers.currentUser;
        const userEmail = await user.getEmail();

        if (result.status === 'Successful') {
            console.log("Payment successful, saving order to database");
            await saveOrderToDatabase(userEmail, data);
            
            // Send success message to iframe
            $w("#html1").postMessage({ 
                type: "paymentSuccess",
                orderId: data.orderId,
                paymentId: paymentId
            });
            
        } else {
            console.log("Payment was not successful, status:", result.status);
            
            // Send failure message to iframe
            $w("#html1").postMessage({ 
                type: "paymentFailed",
                reason: result.status || "Payment was not completed"
            });
        }
    } catch (err) {
        console.error("Error in payment flow:", err);
        
        // Send failure message to iframe
        $w("#html1").postMessage({ 
            type: "paymentFailed",
            reason: err.message || "Payment processing error"
        });
    }
}

async function saveOrderToDatabase(email, data) {
    try {
        console.log("Starting to process order items for database save...");
        
        // Process items and upload images first
        const processedItems = await Promise.all(data.items.map(async (item, index) => {
            console.log(`Processing item ${index + 1}/${data.items.length}: ${item.name}`);
            
            let imageUrl = "";
            let finalImageUrl = "";
            
            // Upload base image if it's base64
            if (item.image && item.image.startsWith('data:image')) {
                try {
                    console.log(`Uploading base image for item ${index + 1}...`);
                    const uploaded = await uploadBase64Image(item.image, `${data.orderId}_item${index}_base`);
                    imageUrl = uploaded?.fileUrl || "";
                    console.log(`Base image uploaded successfully: ${imageUrl}`);
                } catch (error) {
                    console.error(`Base image upload failed for item ${index + 1}:`, error);
                    imageUrl = "";
                }
            } else {
                imageUrl = item.image || "";
            }

            // Upload final image if it's base64
            if (item.finalImage && item.finalImage.startsWith('data:image')) {
                try {
                    console.log(`Uploading final image for item ${index + 1}...`);
                    const uploaded = await uploadBase64Image(item.finalImage, `${data.orderId}_item${index}_final`);
                    finalImageUrl = uploaded?.fileUrl || "";
                    console.log(`Final image uploaded successfully: ${finalImageUrl}`);
                } catch (error) {
                    console.error(`Final image upload failed for item ${index + 1}:`, error);
                    finalImageUrl = "";
                }
            } else {
                finalImageUrl = item.finalImage || "";
            }

            // Create a minimal item object with only essential data
            const minimalItem = {
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity),
                currency: item.currency || "USD",
                image: imageUrl,
                finalImage: finalImageUrl,
                // Only include essential specs and configuration
                specs: {
                    type: item.specs?.type || item.configuration?.mousepadType || "standard",
                    size: item.specs?.size || item.configuration?.mousepadSize || "",
                    thickness: item.specs?.thickness || item.configuration?.thickness || "",
                    rgb: item.specs?.rgb || (item.configuration?.rgb ? true : false)
                },
                // Minimal configuration - only essential data
                configuration: {
                    mousepadType: item.configuration?.mousepadType || "standard",
                    mousepadSize: item.configuration?.mousepadSize || "400x900",
                    thickness: item.configuration?.thickness || "5mm",
                    rgb: item.configuration?.rgb ? {
                        mode: item.configuration.rgb.mode,
                        color: item.configuration.rgb.color,
                        brightness: item.configuration.rgb.brightness
                    } : null,
                    // Only count of elements, not full data
                    textElementsCount: item.configuration?.textElements?.length || 0,
                    appliedOverlaysCount: item.configuration?.appliedOverlays?.length || 0,
                    hasCustomImage: !!(item.configuration?.imageSettings?.uploadedImage || item.configuration?.imageSettings?.editedImage)
                }
            };

            console.log(`Item ${index + 1} processed successfully`);
            return minimalItem;
        }));

        console.log("All items processed, creating order object...");

        // Create minimal order object
        const order = {
            orderId: data.orderId,
            email: email,
            customerInfo: {
                firstName: data.customerInfo?.firstName || "",
                lastName: data.customerInfo?.lastName || "",
                email: data.customerInfo?.email || email,
                phone: data.customerInfo?.phone || "",
                address: {
                    street: data.customerInfo?.address?.street || "",
                    city: data.customerInfo?.address?.city || "",
                    state: data.customerInfo?.address?.state || "",
                    zipCode: data.customerInfo?.address?.zipCode || "",
                    country: data.customerInfo?.address?.country || ""
                },
                additionalNotes: data.customerInfo?.additionalNotes || ""
            },
            items: processedItems,
            subtotal: Number(data.subtotal),
            tax: Number(data.tax),
            shipping: Number(data.shipping),
            total: Number(data.total),
            currency: data.currency || "USD",
            orderDate: data.orderDate,
            createdAt: new Date(),
            status: 'paid'
        };

        console.log("Saving order to database...");
        await wixData.insert("Orders", order);
        console.log("Order saved successfully to database");
        
        // Send confirmation email
        console.log("Sending confirmation email...");
        let body = generateOrderEmailBody({
            ...data,
            items: processedItems // Use processed items with URLs instead of base64
        });
        let to = email;
        let subject = `Order Confirmation - ${data.orderId}`;
        
        try {
            const result = await sendEmail(to, subject, body);
            console.log("Confirmation email sent successfully", result);
        } catch (e) {
            console.error("Email sending failed:", e);
        }

    } catch (err) {
        console.error("Failed to save order to database:", err);
        throw err; // Re-throw to trigger payment failure message
    }
}

function generateOrderEmailBody(order) {
    return `
<!DOCTYPE html>
<html>
    <body style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 20px;">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:30px;">
        <h2 style="color:#007bff;">Order Confirmation</h2>
        <p>Thank you for your order, <b>${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}</b>!</p>
        <h3>Order #${order.orderId || ''}</h3>
        <hr>
        <h4>Order Items</h4>
        ${order.items.map(item => `
          <div style="display:flex;align-items:center;margin-bottom:15px;">
            <img src="${item.finalImage || item.image}" alt="${item.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-right:15px;">
            <div>
              <div><b>${item.name}</b></div>
              <div style="font-size:12px;color:#666;">
                ${item.configuration?.mousepadType === 'rgb' ? 'RGB Gaming' : 'Standard'} • 
                ${item.configuration?.mousepadSize} • ${item.configuration?.thickness}
                ${item.configuration?.textElementsCount > 0 ? ` • ${item.configuration.textElementsCount} text element${item.configuration.textElementsCount !== 1 ? 's' : ''}` : ''}
                ${item.configuration?.appliedOverlaysCount > 0 ? ` • ${item.configuration.appliedOverlaysCount} overlay${item.configuration.appliedOverlaysCount !== 1 ? 's' : ''}` : ''}
                ${item.configuration?.rgb ? ` • RGB ${item.configuration.rgb.mode} mode` : ''}
              </div>
              <div>Quantity: ${item.quantity}× $${item.price} = <b>$${(item.price * item.quantity).toFixed(2)}</b></div>
            </div>
          </div>
        `).join('')}
        <hr>
        <h4>Order Summary</h4>
        <div>Subtotal: <b>$${order.subtotal}</b></div>
        <div>Shipping: <b>${order.shipping === 0 ? 'Free' : `$${order.shipping}`}</b></div>
        <div>Tax: <b>$${order.tax}</b></div>
        <div style="font-size:18px;margin-top:10px;">Total: <b style="color:#007bff;">$${order.total}</b></div>
        <hr>
        <h4>Shipping Information</h4>
        <div>Name: <b>${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}</b></div>
        <div>Email: <b>${order.customerInfo?.email || ''}</b></div>
        <div>Phone: <b>${order.customerInfo?.phone || ''}</b></div>
        <div>Address: <b>
          ${order.customerInfo?.address?.street || ''}<br>
          ${order.customerInfo?.address?.city || ''}, ${order.customerInfo?.address?.state || ''} ${order.customerInfo?.address?.zipCode || ''}<br>
          ${order.customerInfo?.address?.country || ''}
        </b></div>
        ${order.customerInfo?.additionalNotes ? `
        <hr>
        <h4>Additional Notes</h4>
        <div>${order.customerInfo.additionalNotes}</div>
        ` : ''}
        <hr>
        <div style="font-size:13px;color:#888;margin-top:20px;">
          If you have any questions, contact us at support@custommousepad.com
        </div>
      </div>
    </body>
  </html>
  `;
} 