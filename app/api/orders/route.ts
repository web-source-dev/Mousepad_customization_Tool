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



export async function GET() {
  try {
    // Return empty orders array - real data will come from Wix
    return NextResponse.json({
      success: true,
      data: [],
      total: 0
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