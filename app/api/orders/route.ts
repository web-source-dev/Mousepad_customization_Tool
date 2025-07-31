import { NextResponse } from 'next/server';

// Mock order data structure
interface OrderItem {
  id: string;
  name: string;
  image: string;
  specs: {
    size: string;
    theme?: string;
    text?: string;
    color?: string;
    icons?: string[];
    rgbMode?: string;
    rgbColor?: string;
    [key: string]: any;
  };
  quantity: number;
  price: number;
  currency: 'USD' | 'SGD';
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
  orderDate: string; // ISO string for API
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: 'USD' | 'SGD';
  userDetails: UserDetails;
  previewImage: string;
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
      orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
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
          theme,
          text: Math.random() > 0.5 ? 'Custom Text' : undefined,
          color: theme === 'Gaming' ? '#ff6b6b' : theme === 'Nature' ? '#4ade80' : theme === 'Space' ? '#6366f1' : theme === 'Abstract' ? '#f59e0b' : '#6b7280',
          rgbMode: Math.random() > 0.5 ? 'static' : 'off',
          rgbColor: '#ff6b6b'
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
      `)}`
    };
  });
};

export async function GET() {
  try {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const orders = generateMockOrders();
    
    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Here you would typically save the order to your database
    // For now, we'll just return a success response
    console.log('New order received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId: `ORD-${Date.now()}`
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Here you would typically update the order in your database
    console.log('Order update received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      orderId: body.orderId
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update order' 
      },
      { status: 500 }
    );
  }
} 