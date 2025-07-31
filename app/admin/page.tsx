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

  // Initialize Wix communication
  useEffect(() => {
    initializeWixCommunication();
    loadData();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('message', handleWixMessage);
    };
  }, []);

  // Request data from Wix when connected
  useEffect(() => {
    if (wixConnected) {
      // Request orders and users from Wix
      requestDataFromWix();
    }
  }, [wixConnected]);

  // Initialize Wix iframe communication
  const initializeWixCommunication = () => {
    // Check if we're in an iframe
    if (window.parent !== window) {
      setWixConnected(true);
      
      // Set up message listener
      window.addEventListener('message', handleWixMessage);
      
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
    }
  };

  // Handle messages from Wix parent
  const handleWixMessage = (event: MessageEvent) => {
    // Verify origin (you should add your Wix domain here)
    const allowedOrigins = [
      'https://your-wix-site.wixsite.com',
      'https://your-wix-site.com'
    ];
    
    if (!allowedOrigins.includes(event.origin)) {
      console.warn('Message from unauthorized origin:', event.origin);
      return;
    }
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'USER_DATA_RESPONSE':
        setWixUserData(data);
        break;
      case 'ORDER_CREATED_RESPONSE':
        handleOrderCreatedResponse(data);
        break;
      case 'CHECKOUT_RESPONSE':
        handleCheckoutResponse(data);
        break;
      case 'ADMIN_ACTION_RESPONSE':
        handleAdminActionResponse(data);
        break;
      case 'FETCH_ORDERS_RESPONSE':
        handleFetchOrdersResponse(data);
        break;
      case 'FETCH_USERS_RESPONSE':
        handleFetchUsersResponse(data);
        break;
      case 'INIT':
        handleWixInit(data);
        break;
      default:
        console.log('Unknown message type from Wix:', type);
    }
  };

  // Send message to Wix parent
  const sendMessageToWix = (message: any) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  };

  // Request user data from Wix
  const requestUserDataFromWix = () => {
    sendMessageToWix({
      type: 'USER_DATA_REQUEST',
      data: {}
    });
  };

  // Handle Wix initialization
  const handleWixInit = (data: any) => {
    console.log('Wix initialization data:', data);
    if (data.userEmail) {
      setWixUserData({ email: data.userEmail });
    }
  };

  // Handle order creation response from Wix
  const handleOrderCreatedResponse = (data: any) => {
    if (data.success) {
      console.log('Order created successfully:', data);
      // Refresh orders list
      loadData();
    } else {
      console.error('Failed to create order:', data);
    }
  };

  // Handle checkout response from Wix
  const handleCheckoutResponse = (data: any) => {
    if (data.success) {
      console.log('Checkout successful:', data);
      // Handle successful checkout
    } else {
      console.error('Checkout failed:', data);
    }
  };

  // Handle admin action response from Wix
  const handleAdminActionResponse = (data: any) => {
    if (data.success) {
      console.log('Admin action successful:', data);
    } else {
      console.error('Admin action failed:', data);
    }
  };

  // Handle fetch orders response from Wix
  const handleFetchOrdersResponse = (data: any) => {
    console.log('Fetch orders response from Wix:', data);
    
    if (data.orders) {
      // Transform Wix orders to match our interface
      const transformedOrders: Order[] = data.orders.map((wixOrder: any) => ({
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
      }));
      
      setOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
    }
  };

  // Handle fetch users response from Wix
  const handleFetchUsersResponse = (data: any) => {
    console.log('Fetch users response from Wix:', data);
    
    if (data.users) {
      // Transform Wix users to match our interface
      const transformedUsers: User[] = data.users.map((wixUser: any) => ({
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
      }));
      
      setUsers(transformedUsers);
      setFilteredUsers(transformedUsers);
    }
  };

  // Request data from Wix
  const requestDataFromWix = () => {
    if (wixConnected) {
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
    }
  };

  // Enhanced order update with Wix integration
  const handleSaveUpdate = async () => {
    if (!selectedOrder) return;

    try {
      const updatedOrder = {
        ...selectedOrder,
        status: updateForm.status as Order['status'],
        notes: updateForm.notes,
        trackingNumber: updateForm.trackingNumber
      };

      // Make API call to update order
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
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id ? updatedOrder : order
        ));
        
        // Send update to Wix
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
        console.error('Failed to update order:', result.error);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Enhanced user view with Wix integration
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
    
    // Send user view action to Wix
    sendMessageToWix({
      type: 'ADMIN_ACTION',
      data: {
        action: 'VIEW_USER',
        userId: user.id,
        userData: user
      }
    });
  };

  // Send email to user via Wix
  const handleSendEmail = (user: User) => {
    sendMessageToWix({
      type: 'ADMIN_ACTION',
      data: {
        action: 'SEND_EMAIL',
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`
      }
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders');
      const result = await response.json();
      
      if (result.success) {
        // Convert ISO date strings back to Date objects
        const ordersWithDates = result.data.map((order: any) => ({
          ...order,
          orderDate: new Date(order.orderDate)
        }));
        setOrders(ordersWithDates);
        setFilteredOrders(ordersWithDates);
      } else {
        console.error('Failed to load orders:', result.error);
        // Fallback to mock data if API fails
        const mockOrders = generateMockOrders();
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      }

      // Generate mock users
      const mockUsers = generateMockUsers();
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data if API fails
      const mockOrders = generateMockOrders();
      const mockUsers = generateMockUsers();
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    let filtered = users;

    // Apply user search filter
    if (userSearchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }



    setFilteredUsers(filtered);
  }, [users, userSearchTerm]);

  const handleDownloadImage = (order: Order) => {
    const link = document.createElement('a');
    link.href = order.previewImage;
    link.download = `mousepad-${order.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      notes: order.notes || '',
      trackingNumber: order.trackingNumber || ''
    });
    setIsUpdateDialogOpen(true);
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue };
  };

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0);

    return { total, active, inactive, totalRevenue };
  };

  const stats = getOrderStats();
  const userStats = getUserStats();

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
        {/* Header with Wix connection status */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage orders, customers, and business operations</p>
            </div>
            {wixConnected && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${wixUserData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {wixUserData ? 'Connected to Wix' : 'Connecting to Wix...'}
                </span>
              </div>
            )}
          </div>
        </div>

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

          <TabsContent value="orders" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                    </div>
                    <User className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by customer name, email, or order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Info */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[order.status]}>
                              {statusIcons[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrder(order)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {format(order.orderDate, 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{order.customerEmail}</div>
                          {order.trackingNumber && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Tracking:</span> {order.trackingNumber}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Subtotal:</span> ${order.subtotal.toFixed(2)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Shipping:</span> ${order.shipping.toFixed(2)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Tax:</span> ${order.tax.toFixed(2)}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            Total: ${order.total.toFixed(2)} {order.currency}
                          </div>
                        </div>
                      </div>

                      {/* Mousepad Preview */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Mousepad Preview</h4>
                        <div className="relative group">
                          <img
                            src={order.previewImage}
                            alt={`Preview of ${order.items[0].name}`}
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDownloadImage(order)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Customization Details */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Customization Details</h4>
                        <div className="space-y-2 text-sm">
                          {order.items.map((item) => (
                            <div key={item.id} className="space-y-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-gray-600">
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
                                  <div>Overlays: {item.specs.overlays.length} applied</div>
                                )}
                                <div>Quantity: {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t">
                          <h5 className="font-medium text-gray-900 mb-2">Shipping Address</h5>
                          <div className="text-sm text-gray-600">
                            <div>{order.userDetails.address.street}</div>
                            <div>{order.userDetails.address.city}, {order.userDetails.address.state} {order.userDetails.address.zipCode}</div>
                            <div>{order.userDetails.address.country}</div>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="pt-2 border-t">
                            <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                            <div className="text-sm text-gray-600">{order.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No orders found matching your criteria.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
                    </div>
                    <User className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                      <p className="text-2xl font-bold text-gray-600">{userStats.inactive}</p>
                    </div>
                    <Settings className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${userStats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, email, or user ID..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* User Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{user.id}</h3>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Address</h4>
                        <div className="text-sm text-gray-600">
                          <div>{user.address.street}</div>
                          <div>{user.address.city}, {user.address.state} {user.address.zipCode}</div>
                          <div>{user.address.country}</div>
                        </div>
                      </div>

                      {/* Order Stats */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Order Statistics</h4>
                        <div className="text-sm text-gray-600">
                          <div>Total Orders: {user.totalOrders}</div>
                          <div>Total Spent: ${user.totalSpent.toFixed(2)}</div>
                          <div>Last Order: {format(user.lastOrderDate, 'MMM dd, yyyy')}</div>
                          <div>Member Since: {format(user.joinDate, 'MMM dd, yyyy')}</div>
                        </div>
                      </div>


                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No users found matching your criteria.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Update Order Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
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
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={updateForm.trackingNumber}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add order notes..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveUpdate} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced User Details Dialog with Wix integration */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>User ID</Label>
                    <p className="text-sm text-gray-600">{selectedUser.id}</p>
                  </div>
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
                    <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>{selectedUser.address.street}</div>
                    <div>{selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}</div>
                    <div>{selectedUser.address.country}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Orders</Label>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.totalOrders}</p>
                  </div>
                  <div>
                    <Label>Total Spent</Label>
                    <p className="text-lg font-semibold text-gray-900">${selectedUser.totalSpent.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Last Order</Label>
                    <p className="text-sm text-gray-600">{format(selectedUser.lastOrderDate, 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-sm text-gray-600">{format(selectedUser.joinDate, 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleSendEmail(selectedUser)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit User
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