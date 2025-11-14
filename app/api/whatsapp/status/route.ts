import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:1112';
    const response = await fetch(`${whatsappUrl}/status`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ ready: false, error: 'Service not running' });
  }
}

export async function POST() {
  try {
    const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:1112';
    const response = await fetch(`${whatsappUrl}/qr`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get QR code' });
  }
}