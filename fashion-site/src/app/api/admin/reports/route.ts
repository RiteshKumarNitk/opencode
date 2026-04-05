import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as adminService from '@/modules/admin/service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    let data;
    if (type === 'sales') data = await adminService.getSalesReport(startDate, endDate);
    else if (type === 'products') data = await adminService.getProductPerformanceReport(startDate, endDate);
    else if (type === 'customers') data = await adminService.getCustomerReport(startDate, endDate);
    else return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}