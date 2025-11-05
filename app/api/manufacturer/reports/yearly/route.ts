import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("erp_system")

    const currentYear = new Date().getFullYear()
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear]
    
    const yearlyData = []

    for (const year of years) {
      // Get orders data for revenue calculation
      const orders = await db.collection("manufacturer_orders")
        .find({ 
          tenantId: session.user.tenantId,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        })
        .toArray()

      // Get expenses data
      const expenses = await db.collection("manufacturer_expenses")
        .find({ 
          tenantId: session.user.tenantId,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        })
        .toArray()

      const revenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      const expenseAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

      yearlyData.push({
        period: year.toString(),
        revenue,
        expenses: expenseAmount,
        profit: revenue - expenseAmount,
        orders: orders.length
      })
    }

    return NextResponse.json(yearlyData)
  } catch (error) {
    console.error('Error fetching yearly report data:', error)
    return NextResponse.json({ error: "Failed to fetch yearly report data" }, { status: 500 })
  }
}