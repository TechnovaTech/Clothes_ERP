import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:1112';
    const response = await fetch(`${whatsappUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.WHATSAPP_API_KEY || 'whatsapp-secret-2024'
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' });
  }
}