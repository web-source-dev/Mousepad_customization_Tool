"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, Search, Filter, Calendar, User, Package, DollarSign, Edit, Users, Settings, Eye, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';

// Order data structure based on actual Wix database
interface OrderItem {
    id: string;
    name: string;
    image: string;
    specs: {
        size: string;
        thickness: string;
        type: string;
        rgb?: {
            mode: string;
            color: string;
            brightness: number;
            animationSpeed: number;
        };
        text?: Array<{
            id: number;
            text: string;
            type: string;
            color: string;
            font: string;
            size: number;
            position: { x: number; y: number };
            rotation: number;
            opacity: number;
            shadow: {
                enabled: boolean;
                color: string;
                blur: number;
                x: number;
                y: number;
            };
            outline: {
                enabled: boolean;
                color: string;
                width: number;
            };
            gradient: {
                enabled: boolean;
                direction: string;
                from: string;
                to: string;
            };
        }>;
        overlays?: string[];
        [key: string]: any;
    };
    quantity: number;
    price: number;
}

interface UserDetails {
    email: string;
}

interface Order {
    id: string;
    customerEmail: string;
    orderDate: Date;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    currency: 'USD';
    userDetails: UserDetails;
    previewImages: string[];
}







const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
};

const statusIcons = {
    pending: '⏳',
    processing: '⚙️',
    shipped: '📦',
    delivered: '✅',
    cancelled: '❌'
};

export default function AdminPanel() {
    const { toast } = useToast();
    console.log('🎯 AdminPanel component rendering...');

    // Add error boundary state
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        status: ''
    });

    // Wix communication state
    const [wixConnected, setWixConnected] = useState(false);
    const [wixUserData, setWixUserData] = useState<any>(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [ordersLoaded, setOrdersLoaded] = useState(false);
    const [processedOrders, setProcessedOrders] = useState<Set<string>>(new Set());
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Error boundary effect
    useEffect(() => {
        const handleError = (error: ErrorEvent) => {
            console.error('🚨 Global error caught:', error);
            setHasError(true);
            setErrorMessage(error.message || 'An unexpected error occurred');
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            setHasError(true);
            setErrorMessage(event.reason?.message || 'An unexpected error occurred');
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Initialize Wix communication
    useEffect(() => {
        try {
            console.log('🚀 Admin Panel initializing...');
            initializeWixCommunication();

            // Expose updateOrderStatus function globally for iframe communication
            (window as any).updateOrderStatus = (orderId: string, newStatus: string) => {
                console.log('🔄 updateOrderStatus called from iframe:', orderId, newStatus);
                try {
                    // Validate inputs
                    if (!orderId || !newStatus) {
                        console.error('❌ Invalid parameters for updateOrderStatus:', { orderId, newStatus });
                        toast && toast({
                            title: "Invalid Parameters",
                            description: "Order ID and status are required",
                            variant: "destructive"
                        });
                        return false;
                    }

                    // Send update request to Wix
                    sendMessageToWix({
                        type: 'UPDATE_ORDER_STATUS',
                        data: {
                            orderId: String(orderId),
                            newStatus: String(newStatus),
                            timestamp: new Date().toISOString()
                        },
                        id: Date.now().toString()
                    });

                    console.log('✅ updateOrderStatus request sent successfully');
                    toast && toast({
                        title: "Update Request Sent",
                        description: `Requesting status change to ${newStatus}`,
                        variant: "default"
                    });
                    return true;
                } catch (error) {
                    console.error('❌ Error in updateOrderStatus:', error);
                    toast && toast({
                        title: "Update Failed",
                        description: `Failed to send update request: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        variant: "destructive"
                    });
                    return false;
                }
            };

            // Cleanup on unmount
            return () => {
                console.log('🧹 Cleaning up admin panel...');
                window.removeEventListener('message', handleWixMessage);
                // Remove global function
                delete (window as any).updateOrderStatus;
            };
        } catch (error) {
            console.error('❌ Error during initialization:', error);
            setHasError(true);
            setErrorMessage(error instanceof Error ? error.message : 'Initialization failed');
        }
    }, []);

    // Request data from Wix when connected
    useEffect(() => {
        try {
            // If Wix is connected, always request real data
            if (wixConnected) {
                console.log('🔗 Wix connected, requesting real data...');
                // Reset loading states to allow real data to load
                setOrdersLoaded(false);
                setDataLoaded(false);
                
                // Request orders from Wix
                requestDataFromWix();

                // Set a timeout to handle Wix not responding
                timeoutRef.current = setTimeout(() => {
                    // Handle timeout if we haven't received real data yet
                    if (!ordersLoaded) {
                        console.warn('⏰ Wix data request timeout');
                        console.log('📊 Current state at timeout:', { ordersLoaded, dataLoaded });
                        setLoading(false);
                        loadData(); // Load data from API
                    } else {
                        console.log('⏰ Timeout occurred but real data already loaded');
                        console.log('📊 Current state at timeout:', { ordersLoaded, dataLoaded });
                        setLoading(false);
                    }
                }, 5000); // 5 second timeout
            } else {
                console.log('🔌 Wix not connected, loading data from API...');
                setLoading(false);
                loadData(); // Load data from API
            }
        } catch (error) {
            console.error('❌ Error requesting data from Wix:', error);
            setLoading(false);
            loadData(); // Load data from API
        }

        // Cleanup timeout if component unmounts or data is loaded
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [wixConnected]);

    // Initialize Wix iframe communication
    const initializeWixCommunication = () => {
        try {
            console.log('🔄 Initializing Wix communication...');

            // Check if we're in an iframe
            if (window.parent !== window) {
                console.log('✅ Running in iframe, setting up Wix communication');
                setWixConnected(true);

                // Set up message listener
                window.addEventListener('message', handleWixMessage);
                console.log('📡 Message listener attached');

                // Send ready signal to parent with simple data
                setTimeout(() => {
                    try {
                        sendMessageToWix({
                            type: 'IFRAME_READY',
                            data: {
                                adminPanel: true,
                                version: '1.0.0'
                            },
                            id: Date.now().toString()
                        });

                        // Request user data from Wix
                        requestUserDataFromWix();
                    } catch (error) {
                        console.error('❌ Error sending initial messages:', error);
                    }
                }, 200); // Increased delay to ensure everything is ready
            } else {
                console.log('⚠️ Not running in iframe, loading data from API');
            }
        } catch (error) {
            console.error('❌ Error initializing Wix communication:', error);
            // Don't throw error, just log it and continue with API data
            console.log('🔄 Falling back to API data mode');
        }
    };

    // Handle messages from Wix parent
    const handleWixMessage = (event: MessageEvent) => {
        try {
            console.log('📨 Received message from Wix:', event.origin, event.data);

            // Verify origin (you should add your Wix domain here)
            const allowedOrigins = [
                'https://www.evogearstudio.com/admin?rc=test-site',
                'https://www.evogearstudio.com/admin',
                'https://www.evogearstudio.com' // Add your actual Wix domain
            ];

            if (!allowedOrigins.includes(event.origin)) {
                console.warn('⚠️ Message from unauthorized origin:', event.origin);
                console.log('📋 Message data:', event.data);
                // Don't return here to allow development testing
            }

            const { type, data, id } = event.data;
            console.log('📬 Processing message type:', type, 'with id:', id);

            switch (type) {
                case 'USER_DATA_RESPONSE':
                    console.log('👤 User data received:', data);
                    setWixUserData(data);
                    break;
                case 'ORDER_CREATED_RESPONSE':
                    console.log('📦 Order created response:', data);
                    handleOrderCreatedResponse(data);
                    break;
                case 'CHECKOUT_RESPONSE':
                    console.log('💳 Checkout response:', data);
                    handleCheckoutResponse(data);
                    break;
                case 'ADMIN_ACTION_RESPONSE':
                    console.log('⚙️ Admin action response:', data);
                    handleAdminActionResponse(data);
                    break;
                case 'UPDATE_ORDER_STATUS':
                    console.log('🔄 Update order status received:', data);
                    handleUpdateOrderStatus(data);
                    break;
                case 'FETCH_ORDERS_RESPONSE':
                    console.log('📋 Fetch orders response:', data);
                    handleFetchOrdersResponse(data);
                    break;

                case 'INIT':
                    console.log('🚀 Wix init:', data);
                    handleWixInit(data);
                    break;
                default:
                    console.log('❓ Unknown message type from Wix:', type, data);
            }
        } catch (error) {
            console.error('❌ Error handling Wix message:', error);
            // Show error toast to user
            console.error('🚨 Critical error in message handling:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    // Send message to Wix parent
    const sendMessageToWix = (message: any) => {
        try {
            console.log('📤 Sending message to Wix:', message.type, message.id);
            console.log('📋 Message details:', {
                type: message.type,
                id: message.id,
                dataKeys: message.data ? Object.keys(message.data) : 'no data'
            });
            
            if (window.parent && window.parent !== window) {
                // Ensure message is serializable by creating a clean copy
                const cleanMessage = JSON.parse(JSON.stringify(message));
                window.parent.postMessage(cleanMessage, '*');
                console.log('✅ Message sent to Wix parent');
            } else {
                console.warn('⚠️ Cannot send message - not in iframe');
            }
        } catch (error) {
            console.error('❌ Error sending message to Wix:', error);
            // Fallback: try sending a simplified message
            try {
                const simplifiedMessage = {
                    type: message.type,
                    data: typeof message.data === 'object' ? { ...message.data } : message.data,
                    id: message.id,
                    timestamp: new Date().toISOString()
                };
                window.parent.postMessage(simplifiedMessage, '*');
                console.log('✅ Simplified message sent to Wix parent');
            } catch (fallbackError) {
                console.error('❌ Failed to send even simplified message:', fallbackError);
            }
        }
    };

    // Request user data from Wix
    const requestUserDataFromWix = () => {
        try {
            console.log('👤 Requesting user data from Wix...');
            sendMessageToWix({
                type: 'USER_DATA_REQUEST',
                data: {},
                id: Date.now().toString()
            });
        } catch (error) {
            console.error('❌ Error requesting user data:', error);
        }
    };

    // Handle Wix initialization
    const handleWixInit = (data: any) => {
        try {
            console.log('🚀 Wix initialization data:', data);
            if (data.userEmail) {
                console.log('📧 Setting user email from Wix:', data.userEmail);
                setWixUserData({ email: data.userEmail });
            }
        } catch (error) {
            console.error('❌ Error handling Wix init:', error);
        }
    };

    // Handle order creation response from Wix
    const handleOrderCreatedResponse = (data: any) => {
        try {
            if (data.success) {
                console.log('✅ Order created successfully:', data);
                // Refresh orders list
                loadData();
            } else {
                console.error('❌ Failed to create order:', data);
            }
        } catch (error) {
            console.error('❌ Error handling order created response:', error);
        }
    };

    // Handle checkout response from Wix
    const handleCheckoutResponse = (data: any) => {
        try {
            if (data.success) {
                console.log('✅ Checkout successful:', data);
                // Handle successful checkout
            } else {
                console.error('❌ Checkout failed:', data);
            }
        } catch (error) {
            console.error('❌ Error handling checkout response:', error);
        }
    };

    // Handle admin action response from Wix
    const handleAdminActionResponse = (data: any) => {
        try {
            if (data.success) {
                console.log('✅ Admin action successful:', data);
            } else {
                console.error('❌ Admin action failed:', data);
            }
        } catch (error) {
            console.error('❌ Error handling admin action response:', error);
        }
    };

    // Handle order status updates from Wix
    const handleUpdateOrderStatus = (data: any) => {
        try {
            console.log('🔄 Processing order status update:', data);

            // Deep log the payload to check for missing keys
            console.log('📊 Update payload details:', {
                orderId: data.orderId,
                newStatus: data.newStatus,
                success: data.success,
                message: data.message,
                timestamp: data.timestamp
            });

            if (!data.orderId || !data.newStatus) {
                console.error('❌ Missing required fields in update payload:', data);
                return;
            }

            // Check if this orderId has already been processed
            const processedKey = `${data.orderId}-${data.newStatus}-${data.timestamp}`;
            if (processedOrders.has(processedKey)) {
                console.warn('⚠️ Duplicate order update detected, skipping:', processedKey);
                return;
            }

            // Update local state
            setOrders(prev => {
                const updated = prev.map(order => {
                    if (order.id === data.orderId) {
                        console.log('✅ Updating order status:', order.id, 'from', order.status, 'to', data.newStatus);
                        return {
                            ...order,
                            status: data.newStatus as Order['status']
                        };
                    }
                    return order;
                });

                // Check if order was actually updated
                const orderUpdated = updated.some(order => order.id === data.orderId);
                if (!orderUpdated) {
                    console.warn('⚠️ Order not found for update:', data.orderId);
                }

                return updated;
            });

            // Mark as processed
            setProcessedOrders(prev => new Set([...prev, processedKey]));

            // Show success feedback
            console.log('✅ Order status updated successfully:', data.orderId, '->', data.newStatus);

            // Show success toast
            toast && toast({
                title: "Order Status Updated",
                description: `Order ${data.orderId} status changed to ${data.newStatus}`,
                variant: "default"
            });

            // Send confirmation back to Wix
            sendMessageToWix({
                type: 'UPDATE_ORDER_STATUS_CONFIRMED',
                data: {
                    orderId: data.orderId,
                    newStatus: data.newStatus,
                    success: true,
                    timestamp: new Date().toISOString()
                },
                id: data.id || Date.now().toString()
            });

        } catch (error) {
            console.error('❌ Error handling order status update:', error);

            // Show error toast
            toast && toast({
                title: "Update Failed",
                description: `Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive"
            });

            // Send error back to Wix
            sendMessageToWix({
                type: 'UPDATE_ORDER_STATUS_ERROR',
                data: {
                    orderId: data.orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                },
                id: data.id || Date.now().toString()
            });
        }
    };

    // Handle fetch orders response from Wix
    const generateImagesForOrders = async (orders: Order[]) => {
        try {
            console.log('🎨 Starting image generation for', orders.length, 'orders');
            
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                try {
                    console.log(`🎨 Generating images for order ${i + 1}/${orders.length}:`, order.id);
                    const generatedImages = await generateMousepadImage(order);
                    
                    // Update the order with generated images
                    setOrders(prevOrders => 
                        prevOrders.map(o => 
                            o.id === order.id 
                                ? { ...o, previewImages: generatedImages }
                                : o
                        )
                    );
                    
                    setFilteredOrders(prevFiltered => 
                        prevFiltered.map(o => 
                            o.id === order.id 
                                ? { ...o, previewImages: generatedImages }
                                : o
                        )
                    );
                    
                    console.log(`✅ Generated ${generatedImages.length} images for order ${order.id}`);
                } catch (error) {
                    console.error(`❌ Error generating images for order ${order.id}:`, error);
                }
            }
            
            console.log('🎨 Completed image generation for all orders');
        } catch (error) {
            console.error('❌ Error in generateImagesForOrders:', error);
        }
    };

    const handleFetchOrdersResponse = (data: any) => {
        try {
            console.log('📋 Fetch orders response from Wix:', data);

            if (data.orders && Array.isArray(data.orders)) {
                console.log('🔄 Transforming orders data...');
                // Transform Wix orders to match our interface
                const transformedOrders: Order[] = data.orders.map((wixOrder: any) => {
                    try {
                        console.log('📦 Processing order:', wixOrder.id, wixOrder.customerEmail);

                        // Ensure all data is serializable
                        const cleanItems = Array.isArray(wixOrder.items) ? wixOrder.items.map((item: any) => ({
                            id: String(item.id || ''),
                            name: String(item.name || ''),
                            image: String(item.image || ''),
                            specs: {
                                size: String(item.specs?.size || '400x800'),
                                thickness: String(item.specs?.thickness || '4mm'),
                                type: String(item.specs?.type || 'standard'),
                                rgb: item.specs?.rgb ? {
                                    mode: String(item.specs.rgb.mode || 'static'),
                                    color: String(item.specs.rgb.color || '#ffffff'),
                                    brightness: Number(item.specs.rgb.brightness || 100),
                                    animationSpeed: Number(item.specs.rgb.animationSpeed || 50)
                                } : undefined,
                                text: Array.isArray(item.specs?.text) ? item.specs.text.map((t: any) => ({
                                    id: Number(t.id || 0),
                                    text: String(t.text || ''),
                                    type: String(t.type || 'text'),
                                    color: String(t.color || '#000000'),
                                    font: String(t.font || 'Arial'),
                                    size: Number(t.size || 72),
                                    position: {
                                        x: Number(t.position?.x || 50),
                                        y: Number(t.position?.y || 50)
                                    },
                                    rotation: Number(t.rotation || 0),
                                    opacity: Number(t.opacity || 100),
                                    shadow: {
                                        enabled: Boolean(t.shadow?.enabled || false),
                                        color: String(t.shadow?.color || '#000000'),
                                        blur: Number(t.shadow?.blur || 4),
                                        x: Number(t.shadow?.x || 2),
                                        y: Number(t.shadow?.y || 2)
                                    },
                                    outline: {
                                        enabled: Boolean(t.outline?.enabled || false),
                                        color: String(t.outline?.color || '#ffffff'),
                                        width: Number(t.outline?.width || 1)
                                    },
                                    gradient: {
                                        enabled: Boolean(t.gradient?.enabled || false),
                                        direction: String(t.gradient?.direction || 'horizontal'),
                                        from: String(t.gradient?.from || '#ff0000'),
                                        to: String(t.gradient?.to || '#0000ff')
                                    }
                                })) : [],
                                overlays: Array.isArray(item.specs?.overlays) ? item.specs.overlays.map((o: any) => String(o)) : []
                            },
                            quantity: Number(item.quantity || 1),
                            price: Number(item.price || 0)
                        })) : [];

                        return {
                            id: String(wixOrder.id || ''),
                            customerEmail: String(wixOrder.customerEmail || ''),
                            orderDate: new Date(wixOrder.orderDate || Date.now()),
                            status: wixOrder.status || 'pending',
                            items: cleanItems,
                            subtotal: Number(wixOrder.subtotal || 0),
                            shipping: Number(wixOrder.shipping || 0),
                            tax: Number(wixOrder.tax || 0),
                            total: Number(wixOrder.total || 0),
                            currency: 'USD',
                            userDetails: {
                                email: String(wixOrder.customerEmail || '')
                            },
                            previewImages: ['/placeholder.svg'] // Will be generated after order is created
                        };
                    } catch (itemError) {
                        console.error('❌ Error processing order item:', itemError);
                        return null;
                    }
                }).filter(Boolean) as Order[];

                console.log('✅ Transformed orders:', transformedOrders.length);
                console.log('🎯 Setting real orders data from Wix:', transformedOrders.length, 'orders');
                setOrders(transformedOrders);
                setFilteredOrders(transformedOrders);
                setOrdersLoaded(true);

                // Generate images for all orders
                generateImagesForOrders(transformedOrders);

                // Set data as loaded since we only have orders now
                setDataLoaded(true);
                setLoading(false);
                console.log('🎉 Orders data loaded successfully!');

                // Clear timeout since data was successfully loaded
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                    console.log('⏰ Cleared timeout - orders data loaded successfully');
                }
            } else {
                console.warn('⚠️ No orders data received from Wix or invalid format');
            }
        } catch (error) {
            console.error('❌ Error handling fetch orders response:', error);
        }
    };



    // Request data from Wix
    const requestDataFromWix = () => {
        try {
            console.log('📡 Requesting data from Wix...');
            if (wixConnected) {
                console.log('✅ Wix connected, sending requests...');
                // Request orders
                sendMessageToWix({
                    type: 'FETCH_ORDERS',
                    data: {},
                    id: Date.now().toString()
                });
            } else {
                console.warn('⚠️ Wix not connected, cannot request data');
            }
        } catch (error) {
            console.error('❌ Error requesting data from Wix:', error);
        }
    };

    // Enhanced order update with Wix integration
    const handleSaveUpdate = async () => {
        if (!selectedOrder) {
            console.warn('⚠️ No order selected for update');
            return;
        }

        try {
            console.log('💾 Saving order update:', selectedOrder.id, updateForm);
            const updatedOrder = {
                ...selectedOrder,
                status: updateForm.status as Order['status']
            };

            // Make API call to update order
            console.log('📡 Making API call to update order...');
            const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    status: updateForm.status
                }),
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Order updated successfully');
                // Update local state
                setOrders(prev => prev.map(order =>
                    order.id === selectedOrder.id ? updatedOrder : order
                ));

                // Send update to Wix with clean data
                console.log('📤 Sending update to Wix...');
                sendMessageToWix({
                    type: 'ADMIN_ACTION',
                    data: {
                        action: 'UPDATE_ORDER',
                        orderId: String(selectedOrder.id),
                        status: String(updateForm.status)
                    },
                    id: Date.now().toString()
                });

                setIsUpdateDialogOpen(false);
                setSelectedOrder(null);
            } else {
                console.error('❌ Failed to update order:', result.error);
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
        }
    };



    const reloadData = () => {
        console.log('🔄 Reloading data...');
        setDataLoaded(false);
        setOrdersLoaded(false);
        setLoading(true);

        // Reset timeout and try again
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Try to connect to Wix again
        if (window.parent !== window) {
            setWixConnected(true);
            requestDataFromWix();

            // Set timeout again
            timeoutRef.current = setTimeout(() => {
                console.warn('⏰ Wix data request timeout on reload');
                setLoading(false);
                loadData(); // Load data from API
            }, 5000);
        } else {
            // Not in iframe, load data from API
            loadData();
        }
    };

    const loadData = async () => {
        try {
            console.log('🔄 Loading data from Wix...');
            setLoading(true);

            // Try to fetch from API
            try {
                const response = await fetch('/api/orders');
                const result = await response.json();

                if (result.success) {
                    console.log('✅ Orders loaded successfully:', result.data.length);
                    // Convert ISO date strings back to Date objects
                    const ordersWithDates = result.data.map((order: any) => ({
                        ...order,
                        orderDate: new Date(order.orderDate)
                    }));
                    setOrders(ordersWithDates);
                    setFilteredOrders(ordersWithDates);
                    setOrdersLoaded(true);
                    setDataLoaded(true);
                } else {
                    console.warn('⚠️ API returned error');
                    setOrders([]);
                    setFilteredOrders([]);
                    setOrdersLoaded(true);
                    setDataLoaded(true);
                }
            } catch (apiError) {
                console.warn('⚠️ API call failed:', apiError);
                setOrders([]);
                setFilteredOrders([]);
                setOrdersLoaded(true);
                setDataLoaded(true);
            }
        } catch (error) {
            console.error('❌ Error loading data:', error);
            setOrders([]);
            setFilteredOrders([]);
            setOrdersLoaded(true);
            setDataLoaded(true);
        } finally {
            setLoading(false);
            console.log('✅ Data loading completed');
        }
    };

    // Monitor orders state changes
    useEffect(() => {
        console.log('📊 Orders state updated:', {
            ordersCount: orders.length,
            ordersLoaded,
            dataLoaded,
            loading
        });
    }, [orders, ordersLoaded, dataLoaded, loading]);

    // Monitor Wix connection state
    useEffect(() => {
        console.log('🔗 Wix connection state changed:', {
            wixConnected,
            ordersLoaded,
            dataLoaded,
            loading
        });
    }, [wixConnected, ordersLoaded, dataLoaded, loading]);

    // Ensure filteredOrders is set when orders are loaded and no filtering is applied
    useEffect(() => {
        if (ordersLoaded && !loading && orders.length > 0 && !searchTerm && statusFilter === 'all') {
            console.log('🎯 Setting filteredOrders to all orders (no filters applied)');
            setFilteredOrders(orders);
        }
    }, [orders, ordersLoaded, loading, searchTerm, statusFilter]);

    useEffect(() => {
        try {
            console.log('🔍 Filtering orders...', {
                searchTerm,
                statusFilter,
                ordersCount: orders.length,
                ordersLoaded,
                dataLoaded,
                loading
            });

            // Don't filter if orders are not loaded yet
            if (!ordersLoaded || loading) {
                console.log('⏳ Skipping filtering - orders not ready yet');
                return;
            }

            let filtered = orders;

            // Apply search filter
            if (searchTerm) {
                filtered = filtered.filter(order =>
                    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.id.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Apply status filter
            if (statusFilter !== 'all') {
                filtered = filtered.filter(order => order.status === statusFilter);
            }

            console.log('✅ Orders filtered:', filtered.length, 'from', orders.length, 'total orders');
            setFilteredOrders(filtered);
        } catch (error) {
            console.error('❌ Error filtering orders:', error);
        }
    }, [orders, searchTerm, statusFilter, ordersLoaded, loading]);

    // Ensure dataLoaded is set when orders are loaded
    useEffect(() => {
        try {
            if (ordersLoaded && !dataLoaded) {
                console.log('🎉 Orders loaded, setting dataLoaded to true');
                setDataLoaded(true);
                setLoading(false);

                // Clear timeout since data was successfully loaded
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                    console.log('⏰ Cleared timeout - data loaded successfully');
                }
            }
        } catch (error) {
            console.error('❌ Error in dataLoaded effect:', error);
        }
    }, [ordersLoaded, dataLoaded]);

    // Ensure filteredOrders is set when orders are loaded and no filters are applied
    useEffect(() => {
        try {
            if (ordersLoaded && !loading && orders.length > 0 && !searchTerm && statusFilter === 'all') {
                console.log('🎯 Setting filteredOrders to all orders (no filters applied)');
                setFilteredOrders(orders);
            }
        } catch (error) {
            console.error('❌ Error setting filteredOrders:', error);
        }
    }, [orders, ordersLoaded, loading, searchTerm, statusFilter]);

    // Debug: Monitor orders state changes
    useEffect(() => {
        console.log('📊 Orders state changed:', {
            ordersCount: orders.length,
            ordersLoaded,
            dataLoaded,
            loading,
            filteredOrdersCount: filteredOrders.length
        });
    }, [orders, ordersLoaded, dataLoaded, loading, filteredOrders]);

    const generateMousepadImage = async (order: Order): Promise<string[]> => {
        try {
            console.log('🎨 Generating mousepad images for order:', order.id);

            const generatedImages: string[] = [];

            // Generate image for each item in the order
            for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
                const item = order.items[itemIndex];
                console.log(`📦 Generating image for item ${itemIndex + 1}/${order.items.length}:`, item.id);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Canvas context not available');
                }

                const size = item.specs.size;
                
                // Set canvas size based on mousepad size - parse dimensions correctly
                // Rule: Bigger number is always the horizontal width
                const sizeMap: { [key: string]: { width: number; height: number } } = {
                    '400x800': { width: 800, height: 400 }, // 800 is bigger, so it's width
                    '400x900': { width: 900, height: 400 }, // 900 is bigger, so it's width
                    '500x800': { width: 800, height: 500 }, // 800 is bigger, so it's width
                    '500x1000': { width: 1000, height: 500 }, // 1000 is bigger, so it's width
                    '600x800': { width: 800, height: 600 }, // 800 is bigger, so it's width
                    '600x1000': { width: 1000, height: 600 }, // 1000 is bigger, so it's width
                    '800x800': { width: 800, height: 800 }, // Equal, keep as is
                    '900x400': { width: 900, height: 400 }, // 900 is bigger, so it's width
                    '1000x500': { width: 1000, height: 500 }, // 1000 is bigger, so it's width
                    '1000x400': { width: 1000, height: 400 }, // 1000 is bigger, so it's width
                    '350x600': { width: 600, height: 350 }, // 600 is bigger, so it's width
                    '600x350': { width: 600, height: 350 }  // 600 is bigger, so it's width
                };

                // Parse size dynamically if not in map
                let dimensions;
                if (sizeMap[size]) {
                    dimensions = sizeMap[size];
                } else {
                    // Parse size like "350x600" - bigger number becomes width
                    const sizeParts = size.split('x');
                    if (sizeParts.length === 2) {
                        const num1 = parseInt(sizeParts[0]);
                        const num2 = parseInt(sizeParts[1]);
                        if (!isNaN(num1) && !isNaN(num2)) {
                            // Bigger number is always the horizontal width
                            if (num1 >= num2) {
                                dimensions = { width: num1, height: num2 };
                            } else {
                                dimensions = { width: num2, height: num1 };
                            }
                        }
                    }
                }
                
                // Fallback if parsing fails
                if (!dimensions) {
                    dimensions = { width: 400, height: 800 };
                }


                canvas.width = dimensions.width;
                canvas.height = dimensions.height;

                // Fill background based on type
                if (item.specs.type === 'rgb') {
                    
                    // Create RGB border effect - draw a thicker border with RGB colors
                    const borderWidth = 20; // RGB border thickness
                    
                    if (item.specs.rgb?.mode === 'rainbow') {
                        // Create rainbow border
                        const borderGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                        borderGradient.addColorStop(0, '#ff0000');
                        borderGradient.addColorStop(0.17, '#ff8000');
                        borderGradient.addColorStop(0.33, '#ffff00');
                        borderGradient.addColorStop(0.5, '#00ff00');
                        borderGradient.addColorStop(0.67, '#0080ff');
                        borderGradient.addColorStop(0.83, '#8000ff');
                        borderGradient.addColorStop(1, '#ff0080');
                        
                        // Fill entire canvas with rainbow border
                        ctx.fillStyle = borderGradient;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Create white inner background (slightly smaller to show border)
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(borderWidth, borderWidth, canvas.width - (borderWidth * 2), canvas.height - (borderWidth * 2));
                    } else {
                        // Single color RGB
                        const color = item.specs.rgb?.color || '#ffffff';
                        
                        // Fill entire canvas with color border
                        ctx.fillStyle = color;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Create white inner background
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(borderWidth, borderWidth, canvas.width - (borderWidth * 2), canvas.height - (borderWidth * 2));
                    }
                } else {
                    // Solid color background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw text elements
                if (item.specs.text && Array.isArray(item.specs.text) && item.specs.text.length > 0) {
                    item.specs.text.forEach((textElement, textIndex) => {
                        try {
                            
                            // Calculate position based on percentage
                            const x = (textElement.position.x / 100) * canvas.width;
                            const y = (textElement.position.y / 100) * canvas.height;

                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate((textElement.rotation * Math.PI) / 180);

                            // Set font - use actual size from specs
                            const fontSize = Math.max(12, Math.min(100, textElement.size || 24));
                            ctx.font = `${fontSize}px ${textElement.font || 'Arial'}`;

                            // Apply opacity
                            ctx.globalAlpha = (textElement.opacity || 100) / 100;

                            // Draw shadow if enabled
                            if (textElement.shadow?.enabled) {
                                ctx.shadowColor = textElement.shadow.color || '#000000';
                                ctx.shadowBlur = textElement.shadow.blur || 4;
                                ctx.shadowOffsetX = textElement.shadow.x || 2;
                                ctx.shadowOffsetY = textElement.shadow.y || 2;
                            }

                            // Draw outline if enabled
                            if (textElement.outline?.enabled) {
                                ctx.strokeStyle = textElement.outline.color || '#ffffff';
                                ctx.lineWidth = textElement.outline.width || 1;
                                ctx.strokeText(textElement.text, 0, 0);
                            }

                            // Draw main text
                            ctx.fillStyle = textElement.color || '#000000';
                            ctx.fillText(textElement.text, 0, 0);

                            ctx.restore();
                        } catch (error) {
                            console.warn('⚠️ Error drawing text element:', error);
                        }
                    });
                }

                // Draw overlays if available - handle base64 properly
                if (item.specs.overlays && item.specs.overlays.length > 0) {
                    for (let overlayIndex = 0; overlayIndex < item.specs.overlays.length; overlayIndex++) {
                        const overlayData = item.specs.overlays[overlayIndex];
                        try {
                            
                            const img = new Image();
                            img.crossOrigin = 'anonymous';

                            await new Promise((resolve, reject) => {
                                img.onload = () => {
                                    resolve(null);
                                };
                                img.onerror = (error) => {
                                    console.warn(`❌ Failed to load overlay ${overlayIndex + 1}:`, error);
                                    reject(error);
                                };
                                
                                // Handle base64 data properly - try multiple formats
                                let imageSrc = overlayData;
                                
                                if (!overlayData.startsWith('data:')) {
                                    // If it's raw base64, add the data URL prefix
                                    imageSrc = `data:image/png;base64,${overlayData}`;
                                } else if (overlayData.startsWith('data:image/png;base64,')) {
                                    // Already properly formatted
                                    imageSrc = overlayData;
                                } else if (overlayData.startsWith('data:image/')) {
                                    // Other image format, try to convert
                                    imageSrc = overlayData;
                                }
                                
                                img.src = imageSrc;
                            });

                            // Draw overlay in center with proper scaling
                            const maxOverlayWidth = canvas.width * 0.7; // 70% of canvas width
                            const maxOverlayHeight = canvas.height * 0.7; // 70% of canvas height
                            
                            let overlayWidth = img.width;
                            let overlayHeight = img.height;
                            
                            // Scale down if too large
                            if (overlayWidth > maxOverlayWidth || overlayHeight > maxOverlayHeight) {
                                const scale = Math.min(maxOverlayWidth / overlayWidth, maxOverlayHeight / overlayHeight);
                                overlayWidth = img.width * scale;
                                overlayHeight = img.height * scale;
                            }
                            
                            const overlayX = (canvas.width - overlayWidth) / 2;
                            const overlayY = (canvas.height - overlayHeight) / 2;

                            ctx.drawImage(img, overlayX, overlayY, overlayWidth, overlayHeight);
                        } catch (error) {
                            console.warn('⚠️ Failed to load overlay:', error);
                        }
                    }
                }

                const imageDataUrl = canvas.toDataURL('image/png', 1.0);
                generatedImages.push(imageDataUrl);
            }

            console.log(`✅ Generated ${generatedImages.length} images for order ${order.id}`);
            return generatedImages;
        } catch (error) {
            console.error('❌ Error generating mousepad images:', error);
            return ['/placeholder.svg'];
        }
    };

    const handleDownloadImage = async (order: Order) => {
        try {
            console.log('📥 Downloading images for order:', order.id);

            // Generate the mousepad images from order data
            const imageDataUrls = await generateMousepadImage(order);

            // Download each image
            imageDataUrls.forEach((imageDataUrl, index) => {
                const link = document.createElement('a');
                link.href = imageDataUrl;
                link.download = `mousepad-${order.id}-item-${index + 1}-${order.items[index]?.specs.size || 'custom'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            console.log('✅ Image downloads initiated');
            toast({
                title: "Download Started",
                description: `Downloading ${imageDataUrls.length} image(s) for order ${order.id}`,
            });
        } catch (error) {
            console.error('❌ Error downloading images:', error);
            toast({
                title: "Download Failed",
                description: "Failed to download images. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateOrder = (order: Order) => {
        try {
            console.log('✏️ Opening update dialog for order:', order.id);
            setSelectedOrder(order);
            setUpdateForm({
                status: order.status
            });
            setIsUpdateDialogOpen(true);
        } catch (error) {
            console.error('❌ Error opening update dialog:', error);
        }
    };

    const toggleExpandedOrder = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    // Test function to verify image generation


    const getOrderStats = () => {
        try {
            console.log('📊 Calculating order stats for', orders.length, 'orders');
            const total = orders.length;
            const pending = orders.filter(o => o.status === 'pending').length;
            const processing = orders.filter(o => o.status === 'processing').length;
            const shipped = orders.filter(o => o.status === 'shipped').length;
            const delivered = orders.filter(o => o.status === 'delivered').length;
            const cancelled = orders.filter(o => o.status === 'cancelled').length;
            const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

            console.log('📈 Order stats:', { total, pending, processing, shipped, delivered, cancelled, totalRevenue });

            // Log status breakdown for debugging
            const statusBreakdown = orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            console.log('🔍 Status breakdown:', statusBreakdown);

            return { total, pending, processing, shipped, delivered, cancelled, totalRevenue };
        } catch (error) {
            console.error('❌ Error calculating order stats:', error);
            return { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, totalRevenue: 0 };
        }
    };

    const stats = getOrderStats();

    // Error boundary UI
    if (hasError) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-red-800 mb-4">Something went wrong</h2>
                        <p className="text-red-700 mb-4">{errorMessage}</p>
                        <button
                            onClick={() => {
                                setHasError(false);
                                setErrorMessage('');
                                window.location.reload();
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
                            <div className="mb-6">
                                <div className="h-16 w-16 text-blue-600 mx-auto mb-4 flex items-center justify-center text-4xl animate-spin">⚙️</div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Admin Dashboard</h2>
                                <p className="text-gray-600 mb-4">
                                    Connecting to Wix and loading order data...
                                </p>
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-2">Manage orders and customers</p>
                        {/* Debug info */}
                        <div className="text-xs text-gray-500 mt-1">
                            Debug: Orders: {orders.length} | FilteredOrders: {filteredOrders.length} |
                            OrdersLoaded: {ordersLoaded ? '✅' : '❌'} |
                            DataLoaded: {dataLoaded ? '✅' : '❌'} |
                            Loading: {loading ? '✅' : '❌'} |
                            WixConnected: {wixConnected ? '✅' : '❌'}
                        </div>
                    </div>

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <DollarSign className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Calendar className="h-8 w-8 text-orange-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Orders Management */}
                <div className="space-y-6">


                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-500">
                                        {orders.length === 0 ? (
                                            <div>
                                                <p className="text-lg font-medium mb-2">No orders found</p>
                                                <p className="text-sm">Orders will appear here once customers place orders through the mousepad customizer.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-lg font-medium mb-2">No orders match your filters</p>
                                                <p className="text-sm">Try adjusting your search or status filter.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <Card key={order.id} className="hover:shadow-lg transition-shadow duration-200">
                                        <CardContent className="p-6">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">Order #{order.id}</h3>
                                                        <p className="text-sm text-gray-500">{format(order.orderDate, 'MMM dd, yyyy HH:mm')}</p>
                                                    </div>
                                                    <Badge variant="outline" className={statusColors[order.status]}>
                                                        {statusIcons[order.status]}
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Subtotal: ${order.subtotal.toFixed(2)} | Tax: ${order.tax.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium text-sm">Customer Email</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{order.customerEmail}</p>
                                            </div>

                                            {/* Expand Button */}
                                            <div className="flex justify-center pt-2">
                                                <Button
                                                    onClick={() => toggleExpandedOrder(order.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {expandedOrders.has(order.id) ? 'Hide Details' : 'Show Details'}
                                                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`} />
                                                </Button>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedOrders.has(order.id) && (
                                                <div className="space-y-6 border-t border-gray-200 pt-4">
                                                    {/* Order Items with Images */}
                                                    {order.items.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-semibold text-md text-gray-900">
                                                                    {item.name} - Item {itemIndex + 1}
                                                                </h4>
                                                                <div className="text-sm text-gray-600">
                                                                    Qty: {item.quantity} | ${item.price.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Item Details */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                                <div>Size: {item.specs.size}</div>
                                                                <div>Thickness: {item.specs.thickness}</div>
                                                                <div>Type: {item.specs.type}</div>
                                                                {item.specs.rgb && (
                                                                    <div>RGB: {item.specs.rgb.mode}</div>
                                                                )}
                                                            </div>
                                                            
                                                            {item.specs.text && Array.isArray(item.specs.text) && item.specs.text.length > 0 && (
                                                                <div className="text-sm text-gray-600">
                                                                    <span className="font-medium">Text:</span> {item.specs.text.map(t => t.text).join(', ')}
                                                                </div>
                                                            )}
                                                            
                                                            {item.specs.overlays && item.specs.overlays.length > 0 && (
                                                                <div className="text-sm text-gray-600">
                                                                    <span className="font-medium">Overlays:</span> {item.specs.overlays.length} applied
                                                                </div>
                                                            )}

                                                            {/* Images Section */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Generated Custom Image */}
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Eye className="h-4 w-4 text-gray-500" />
                                                                        <span className="font-medium text-sm">Generated Design</span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        {order.previewImages && order.previewImages[itemIndex] ? (
                                                                            <div className="relative group">
                                                                                <img
                                                                                    src={order.previewImages[itemIndex]}
                                                                                    alt={`Generated mousepad design for item ${itemIndex + 1}`}
                                                                                    className="w-full h-48 object-contain border border-gray-200 rounded-lg shadow-sm"
                                                                                    onError={(e) => {
                                                                                        console.warn('⚠️ Failed to load generated image for order:', order.id, 'item:', itemIndex);
                                                                                        e.currentTarget.src = '/placeholder.svg';
                                                                                    }}
                                                                                />
                                                                                <Button
                                                                                    onClick={() => handleDownloadImage(order)}
                                                                                    size="sm"
                                                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                                >
                                                                                    <Download className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full h-48 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center bg-gray-50">
                                                                                <span className="text-gray-500 text-sm">No generated image available</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Original Uploaded Image */}
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Package className="h-4 w-4 text-gray-500" />
                                                                        <span className="font-medium text-sm">Original Upload</span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <div className="relative group">
                                                                            <img
                                                                                src={item.image}
                                                                                alt={`Original uploaded image for item ${itemIndex + 1}`}
                                                                                className="w-full h-48 object-contain border border-gray-200 rounded-lg shadow-sm"
                                                                                onError={(e) => {
                                                                                    console.warn('⚠️ Failed to load original image for order:', order.id, 'item:', itemIndex, 'URL:', item.image);
                                                                                    e.currentTarget.src = '/placeholder.svg';
                                                                                }}
                                                                                onLoad={() => {
                                                                                    console.log('✅ Original image loaded successfully for order:', order.id, 'item:', itemIndex);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                onClick={() => {
                                                                                    try {
                                                                                        const link = document.createElement('a');
                                                                                        link.href = item.image;
                                                                                        link.download = `original-${order.id}-item-${itemIndex + 1}.png`;
                                                                                        document.body.appendChild(link);
                                                                                        link.click();
                                                                                        document.body.removeChild(link);
                                                                                        console.log('✅ Original image download initiated');
                                                                                    } catch (error) {
                                                                                        console.error('❌ Failed to download original image:', error);
                                                                                        toast({
                                                                                            title: "Download Failed",
                                                                                            description: "Failed to download original image",
                                                                                            variant: "destructive",
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                size="sm"
                                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                            >
                                                                                <Download className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Actions */}
                                                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                                                        <Button
                                                            onClick={() => handleUpdateOrder(order)}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit Order
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDownloadImage(order)}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <Download className="h-3 w-3 mr-1" />
                                                            Download All Images
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                </div>

                {/* Update Order Dialog */}
                <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Order</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={updateForm.status}
                                    onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsUpdateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveUpdate}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>



                {/* Toast Notifications */}
                <Toaster />
            </div>
        </div>
    );
} 