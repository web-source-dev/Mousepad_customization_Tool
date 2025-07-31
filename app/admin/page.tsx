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
import { Download, Search, Filter, Calendar, User, Package, DollarSign, Edit, Users, Settings, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  additionalNotes?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: 'USD' | 'SGD';
  userDetails: UserDetails;
  previewImage: string;
  notes?: string;
  trackingNumber?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date;
  joinDate: Date;
  status: 'active' | 'inactive';
}

// Mock data generator
const generateMockOrders = (): Order[] => {
  const themes = ['Gaming', 'Abstract', 'Nature', 'Space', 'Minimalist'];
  const sizes = ['Small (300x250mm)', 'Medium (400x300mm)', 'Large (500x400mm)', 'Extra Large (600x450mm)'];
  const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const names = [
    'John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson',
    'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Amanda Rodriguez'
  ];

  return Array.from({ length: 25 }, (_, i) => {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customerName = names[Math.floor(Math.random() * names.length)];
    const [firstName, lastName] = customerName.split(' ');
    
    const subtotal = Math.floor(Math.random() * 50) + 25;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return {
      id: `ORD-${String(i + 1).padStart(4, '0')}`,
      customerName,
      customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      status,
      items: [{
        id: `item-${i}`,
        name: `Custom ${theme} Mousepad`,
        image: `data:image/svg+xml;base64,${btoa(`
          <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${theme === 'Gaming' ? '#1a1a2e' : theme === 'Nature' ? '#2d5016' : theme === 'Space' ? '#0a0a23' : theme === 'Abstract' ? '#4a148c' : '#f5f5f5'}"/>
            <text x="150" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="16">${theme} Design</text>
            <text x="150" y="120" text-anchor="middle" fill="white" font-family="Arial" font-size="12">${size}</text>
          </svg>
        `)}`,
        specs: {
          size,
          thickness: '4mm',
          type: 'rgb',
          rgb: {
            mode: Math.random() > 0.5 ? 'static' : 'rainbow',
            color: theme === 'Gaming' ? '#ff6b6b' : theme === 'Nature' ? '#4ade80' : theme === 'Space' ? '#6366f1' : theme === 'Abstract' ? '#f59e0b' : '#6b7280',
            brightness: 100,
            animationSpeed: 50
          },
          text: Math.random() > 0.5 ? [
            {
              id: 1753371085549,
              text: 'Custom Text',
              type: 'text',
              font: 'Arial',
              size: 72,
              color: '#000000',
              position: { x: 50, y: 50 },
              rotation: 0,
              opacity: 100,
              shadow: {
                enabled: false,
                color: '#000000',
                x: 2,
                y: 2,
                blur: 4
              },
              outline: {
                enabled: false,
                color: '#ffffff',
                width: 1
              },
              gradient: {
                enabled: false,
                from: '#ff0000',
                to: '#0000ff',
                direction: 'horizontal'
              }
            }
          ] : [],
          overlays: Math.random() > 0.5 ? ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAo4'] : []
        },
        quantity: Math.floor(Math.random() * 3) + 1,
        price: subtotal,
        currency: 'USD' as const
      }],
      subtotal,
      shipping,
      tax,
      total,
      currency: 'USD' as const,
      userDetails: {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        address: {
          street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
          city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
          state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
          zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: 'United States'
        },
        additionalNotes: Math.random() > 0.7 ? 'Please deliver before 5 PM' : undefined
      },
      previewImage: `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${theme === 'Gaming' ? '#1a1a2e' : theme === 'Nature' ? '#2d5016' : theme === 'Space' ? '#0a0a23' : theme === 'Abstract' ? '#4a148c' : '#f5f5f5'};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${theme === 'Gaming' ? '#16213e' : theme === 'Nature' ? '#1b4332' : theme === 'Space' ? '#1e1b4b' : theme === 'Abstract' ? '#7c3aed' : '#e5e7eb'};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad1)"/>
          <circle cx="100" cy="80" r="20" fill="${theme === 'Gaming' ? '#ff6b6b' : theme === 'Nature' ? '#4ade80' : theme === 'Space' ? '#6366f1' : theme === 'Abstract' ? '#f59e0b' : '#6b7280'}" opacity="0.8"/>
          <circle cx="300" cy="120" r="15" fill="${theme === 'Gaming' ? '#4ecdc4' : theme === 'Nature' ? '#22c55e' : theme === 'Space' ? '#8b5cf6' : theme === 'Abstract' ? '#ec4899' : '#9ca3af'}" opacity="0.6"/>
          <text x="200" y="150" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">${theme} Mousepad</text>
          <text x="200" y="170" text-anchor="middle" fill="white" font-family="Arial" font-size="14">${size}</text>
          <text x="200" y="190" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Custom Design</text>
          ${Math.random() > 0.5 ? `<rect x="50" y="220" width="300" height="2" fill="${theme === 'Gaming' ? '#ff6b6b' : theme === 'Nature' ? '#4ade80' : theme === 'Space' ? '#6366f1' : theme === 'Abstract' ? '#f59e0b' : '#6b7280'}" opacity="0.5"/>` : ''}
        </svg>
      `)}`,
      notes: Math.random() > 0.7 ? 'Customer requested expedited shipping' : undefined,
      trackingNumber: status === 'shipped' || status === 'delivered' ? `TRK${Math.floor(Math.random() * 900000) + 100000}` : undefined
    };
  });
};

const generateMockUsers = (): User[] => {
  const names = [
    'John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson',
    'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Amanda Rodriguez',
    'Christopher Lee', 'Jessica White', 'Daniel Clark', 'Ashley Hall', 'Matthew Lewis'
  ];

  return names.map((name, i) => {
    const [firstName, lastName] = name.split(' ');
    const totalOrders = Math.floor(Math.random() * 10) + 1;
    const totalSpent = totalOrders * (Math.floor(Math.random() * 100) + 25);
    const lastOrderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const joinDate = new Date(lastOrderDate.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);

    return {
      id: `USER-${String(i + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        country: 'United States'
      },
      totalOrders,
      totalSpent,
      lastOrderDate,
      joinDate,
      status: Math.random() > 0.2 ? 'active' : 'inactive'
    };
  });
};

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
  console.log('🎯 AdminPanel component rendering...');
  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    trackingNumber: ''
  });
  
  // Wix communication state
  const [wixConnected, setWixConnected] = useState(false);
  const [wixUserData, setWixUserData] = useState<any>(null);

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
      loadData();
      
      // Cleanup on unmount
      return () => {
        console.log('🧹 Cleaning up admin panel...');
        window.removeEventListener('message', handleWixMessage);
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
      if (wixConnected) {
        console.log('🔗 Wix connected, requesting data...');
        // Request orders and users from Wix
        requestDataFromWix();
      } else {
        console.log('🔌 Wix not connected yet');
      }
    } catch (error) {
      console.error('❌ Error requesting data from Wix:', error);
    }
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
        
        // Send ready signal to parent
        sendMessageToWix({
          type: 'IFRAME_READY',
          data: {
            adminPanel: true,
            version: '1.0.0'
          }
        });
        
        // Request user data from Wix
        requestUserDataFromWix();
      } else {
        console.log('⚠️ Not running in iframe, using mock data');
      }
    } catch (error) {
      console.error('❌ Error initializing Wix communication:', error);
      throw error;
    }
  };

  // Handle messages from Wix parent
  const handleWixMessage = (event: MessageEvent) => {
    try {
      console.log('📨 Received message from Wix:', event.origin, event.data);
      
      // Verify origin (you should add your Wix domain here)
      const allowedOrigins = [
        'https://your-wix-site.wixsite.com',
        'https://your-wix-site.com',
        'https://www.evogearstudio.com' // Add your actual Wix domain
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('⚠️ Message from unauthorized origin:', event.origin);
        console.log('📋 Message data:', event.data);
        // Don't return here to allow development testing
      }
      
      const { type, data } = event.data;
      console.log('📬 Processing message type:', type);
      
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
        case 'FETCH_ORDERS_RESPONSE':
          console.log('📋 Fetch orders response:', data);
          handleFetchOrdersResponse(data);
          break;
        case 'FETCH_USERS_RESPONSE':
          console.log('👥 Fetch users response:', data);
          handleFetchUsersResponse(data);
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
    }
  };

  // Send message to Wix parent
  const sendMessageToWix = (message: any) => {
    try {
      console.log('📤 Sending message to Wix:', message);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
        console.log('✅ Message sent to Wix parent');
      } else {
        console.warn('⚠️ Cannot send message - not in iframe');
      }
    } catch (error) {
      console.error('❌ Error sending message to Wix:', error);
    }
  };

  // Request user data from Wix
  const requestUserDataFromWix = () => {
    try {
      console.log('👤 Requesting user data from Wix...');
      sendMessageToWix({
        type: 'USER_DATA_REQUEST',
        data: {}
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

  // Handle fetch orders response from Wix
  const handleFetchOrdersResponse = (data: any) => {
    try {
      console.log('📋 Fetch orders response from Wix:', data);
      
      if (data.orders) {
        console.log('🔄 Transforming orders data...');
        // Transform Wix orders to match our interface
        const transformedOrders: Order[] = data.orders.map((wixOrder: any) => {
          console.log('📦 Processing order:', wixOrder.id, wixOrder.customerEmail);
          return {
            id: wixOrder.id,
            customerName: wixOrder.customerName,
            customerEmail: wixOrder.customerEmail,
            orderDate: new Date(wixOrder.orderDate),
            status: wixOrder.status,
            items: wixOrder.items,
            subtotal: wixOrder.subtotal,
            shipping: wixOrder.shipping,
            tax: wixOrder.tax,
            total: wixOrder.total,
            currency: 'USD',
            userDetails: {
              firstName: '',
              lastName: '',
              email: wixOrder.customerEmail,
              phone: '',
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
              }
            },
            previewImage: wixOrder.items?.[0]?.image || '',
            notes: wixOrder.notes,
            trackingNumber: wixOrder.trackingNumber
          };
        });
        
        console.log('✅ Transformed orders:', transformedOrders.length);
        setOrders(transformedOrders);
        setFilteredOrders(transformedOrders);
      } else {
        console.warn('⚠️ No orders data received from Wix');
      }
    } catch (error) {
      console.error('❌ Error handling fetch orders response:', error);
    }
  };

  // Handle fetch users response from Wix
  const handleFetchUsersResponse = (data: any) => {
    try {
      console.log('👥 Fetch users response from Wix:', data);
      
      if (data.users) {
        console.log('🔄 Transforming users data...');
        // Transform Wix users to match our interface
        const transformedUsers: User[] = data.users.map((wixUser: any) => {
          console.log('👤 Processing user:', wixUser.id, wixUser.email);
          return {
            id: wixUser.id,
            firstName: wixUser.firstName,
            lastName: wixUser.lastName,
            email: wixUser.email,
            phone: '',
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            },
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: new Date(wixUser.lastLoginDate),
            joinDate: new Date(wixUser.createdDate),
            status: wixUser.isActive ? 'active' : 'inactive'
          };
        });
        
        console.log('✅ Transformed users:', transformedUsers.length);
        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
      } else {
        console.warn('⚠️ No users data received from Wix');
      }
    } catch (error) {
      console.error('❌ Error handling fetch users response:', error);
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
        
        // Request users
        sendMessageToWix({
          type: 'FETCH_USERS',
          data: {},
          id: (Date.now() + 1).toString()
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
        status: updateForm.status as Order['status'],
        notes: updateForm.notes,
        trackingNumber: updateForm.trackingNumber
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
          status: updateForm.status,
          notes: updateForm.notes,
          trackingNumber: updateForm.trackingNumber
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Order updated successfully');
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id ? updatedOrder : order
        ));
        
        // Send update to Wix
        console.log('📤 Sending update to Wix...');
        sendMessageToWix({
          type: 'ADMIN_ACTION',
          data: {
            action: 'UPDATE_ORDER',
            orderId: selectedOrder.id,
            updates: {
              status: updateForm.status,
              notes: updateForm.notes,
              trackingNumber: updateForm.trackingNumber
            }
          }
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

  // Enhanced user view with Wix integration
  const handleViewUser = (user: User) => {
    try {
      console.log('👁️ Viewing user details:', user.id, user.email);
      setSelectedUser(user);
      setIsUserDialogOpen(true);
      
      // Send user view action to Wix
      console.log('📤 Sending user view action to Wix...');
      sendMessageToWix({
        type: 'ADMIN_ACTION',
        data: {
          action: 'VIEW_USER',
          userId: user.id,
          userData: user
        }
      });
    } catch (error) {
      console.error('❌ Error viewing user:', error);
    }
  };

  // Send email to user via Wix
  const handleSendEmail = (user: User) => {
    try {
      console.log('📧 Sending email to user:', user.id, user.email);
      sendMessageToWix({
        type: 'ADMIN_ACTION',
        data: {
          action: 'SEND_EMAIL',
          userId: user.id,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`
        }
      });
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Loading data...');
      setLoading(true);
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
      } else {
        console.error('❌ Failed to load orders:', result.error);
        // Fallback to mock data if API fails
        console.log('🔄 Falling back to mock orders...');
        const mockOrders = generateMockOrders();
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      }

      // Generate mock users
      console.log('👥 Loading mock users...');
      const mockUsers = generateMockUsers();
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      // Fallback to mock data if API fails
      console.log('🔄 Falling back to mock data...');
      const mockOrders = generateMockOrders();
      const mockUsers = generateMockUsers();
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } finally {
      setLoading(false);
      console.log('✅ Data loading completed');
    }
  };

  useEffect(() => {
    try {
      console.log('🔍 Filtering orders...', { searchTerm, statusFilter, ordersCount: orders.length });
      let filtered = orders;

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(order =>
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      console.log('✅ Orders filtered:', filtered.length);
      setFilteredOrders(filtered);
    } catch (error) {
      console.error('❌ Error filtering orders:', error);
    }
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    try {
      console.log('🔍 Filtering users...', { userSearchTerm, usersCount: users.length });
      let filtered = users;

      // Apply user search filter
      if (userSearchTerm) {
        filtered = filtered.filter(user =>
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
      }

      console.log('✅ Users filtered:', filtered.length);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('❌ Error filtering users:', error);
    }
  }, [users, userSearchTerm]);

  const handleDownloadImage = (order: Order) => {
    try {
      console.log('📥 Downloading image for order:', order.id);
      const link = document.createElement('a');
      link.href = order.previewImage;
      link.download = `mousepad-${order.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Image download initiated');
    } catch (error) {
      console.error('❌ Error downloading image:', error);
    }
  };

  const handleUpdateOrder = (order: Order) => {
    try {
      console.log('✏️ Opening update dialog for order:', order.id);
      setSelectedOrder(order);
      setUpdateForm({
        status: order.status,
        notes: order.notes || '',
        trackingNumber: order.trackingNumber || ''
      });
      setIsUpdateDialogOpen(true);
    } catch (error) {
      console.error('❌ Error opening update dialog:', error);
    }
  };

  const getOrderStats = () => {
    try {
      const total = orders.length;
      const pending = orders.filter(o => o.status === 'pending').length;
      const processing = orders.filter(o => o.status === 'processing').length;
      const shipped = orders.filter(o => o.status === 'shipped').length;
      const delivered = orders.filter(o => o.status === 'delivered').length;
      const cancelled = orders.filter(o => o.status === 'cancelled').length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

      return { total, pending, processing, shipped, delivered, cancelled, totalRevenue };
    } catch (error) {
      console.error('❌ Error calculating order stats:', error);
      return { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, totalRevenue: 0 };
    }
  };

  const getUserStats = () => {
    try {
      const total = users.length;
      const active = users.filter(u => u.status === 'active').length;
      const inactive = users.filter(u => u.status === 'inactive').length;
      const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0);

      return { total, active, inactive, totalRevenue };
    } catch (error) {
      console.error('❌ Error calculating user stats:', error);
      return { total: 0, active: 0, inactive: 0, totalRevenue: 0 };
    }
  };

  const stats = getOrderStats();
  const userStats = getUserStats();

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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
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
            <p className="text-gray-600 mt-2">
              Manage orders and customers
              {wixConnected && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  Connected to Wix
                </span>
              )}
            </p>
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
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
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

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders Management
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
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
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Order Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                                                     <Badge variant="outline" className={statusColors[order.status]}>
                             {statusIcons[order.status]}
                             {order.status}
                           </Badge>
                        </div>
                        <p className="text-gray-600">{order.customerEmail}</p>
                        <p className="text-sm text-gray-500">
                          {format(order.orderDate, 'MMM dd, yyyy')}
                        </p>
                        <p className="font-semibold text-lg">${order.total.toFixed(2)}</p>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Order Details</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            <div>Item: {item.name}</div>
                            <div>Size: {item.specs.size}</div>
                            <div>Thickness: {item.specs.thickness}</div>
                            <div>Type: {item.specs.type}</div>
                            {item.specs.rgb && (
                              <div>RGB: {item.specs.rgb.mode} ({item.specs.rgb.color})</div>
                            )}
                            {item.specs.text && Array.isArray(item.specs.text) && item.specs.text.length > 0 && (
                              <div>Text: {item.specs.text.map(t => t.text).join(', ')}</div>
                            )}
                            {item.specs.overlays && item.specs.overlays.length > 0 && (
                              <div>Overlays: {item.specs.overlays.length}</div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleUpdateOrder(order)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDownloadImage(order)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">${userStats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* User Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Joined: {format(user.joinDate, 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Orders: {user.totalOrders} | Spent: ${user.totalSpent.toFixed(2)}
                        </p>
                      </div>

                      {/* User Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Contact Info</h4>
                        <div className="text-sm text-gray-600">
                          <div>Email: {user.email}</div>
                          <div>Phone: {user.phone || 'N/A'}</div>
                          <div>Address: {user.address.street}, {user.address.city}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleViewUser(user)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleSendEmail(user)}
                          size="sm"
                          variant="outline"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

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
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add order notes..."
                />
              </div>
              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={updateForm.trackingNumber}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  placeholder="Enter tracking number..."
                />
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

        {/* User Details Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <p className="text-sm text-gray-600">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <p className="text-sm text-gray-600">{selectedUser.lastName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-gray-600">{selectedUser.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <p className="text-sm text-gray-600">
                    {selectedUser.address.street}, {selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Orders</Label>
                    <p className="text-sm text-gray-600">{selectedUser.totalOrders}</p>
                  </div>
                  <div>
                    <Label>Total Spent</Label>
                    <p className="text-sm text-gray-600">${selectedUser.totalSpent.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Join Date</Label>
                    <p className="text-sm text-gray-600">{format(selectedUser.joinDate, 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label>Last Order</Label>
                    <p className="text-sm text-gray-600">{format(selectedUser.lastOrderDate, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsUserDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={() => handleSendEmail(selectedUser)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 