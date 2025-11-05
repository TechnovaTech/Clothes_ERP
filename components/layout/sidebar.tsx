"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFeatureAccess } from "@/hooks/use-feature-access"
import { FeatureKey } from "@/lib/feature-permissions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Gift,
  Settings,
  HelpCircle,
  ShoppingCart,
  Package,
  UserCheck,
  Receipt,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Calculator,
} from "lucide-react"

interface SidebarProps {
  userType?: "super-admin" | "retail" | "manufacturer" | "distributor" | "factory"
}

const superAdminNavItems = [
  { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { title: "Tenants", href: "/super-admin/tenants", icon: Building2 },
  { title: "Plan Management", href: "/super-admin/plans", icon: CreditCard },
  { title: "Plan Requests", href: "/super-admin/plan-requests", icon: HelpCircle },
  { title: "Feature Matrix", href: "/super-admin/feature-matrix", icon: Settings },
  { title: "Video Tutorials", href: "/super-admin/tutorials", icon: HelpCircle },
  { title: "Referral System", href: "/super-admin/referrals", icon: Gift },
  { title: "Admin Users", href: "/super-admin/users", icon: Users },
]

const retailNavItems = [
  { title: "Dashboard", href: "/tenant", icon: LayoutDashboard, feature: "dashboard" as FeatureKey },
  { title: "Inventory", href: "/tenant/inventory", icon: Package, feature: "inventory" as FeatureKey },
  { title: "Fashion POS", href: "/tenant/pos", icon: ShoppingCart, feature: "pos" as FeatureKey },
  { title: "Customers", href: "/tenant/customers", icon: UserCheck, feature: "customers" as FeatureKey },
  { title: "Purchases", href: "/tenant/purchases", icon: Package, feature: "purchases" as FeatureKey },
  { title: "HR & Staff", href: "/tenant/hr", icon: Users, feature: "hr" as FeatureKey },
  { title: "Commission", href: "/tenant/commission", icon: Calculator, feature: "hr" as FeatureKey },
  { title: "Leaves", href: "/tenant/leaves", icon: Calendar, feature: "leaves" as FeatureKey },
  { title: "Salary", href: "/tenant/salary", icon: Calculator, feature: "salary" as FeatureKey },
  { title: "Bills", href: "/tenant/bills", icon: Receipt, feature: "bills" as FeatureKey },
  { title: "Analytics & Reports", href: "/tenant/reports", icon: BarChart3, feature: "reports" as FeatureKey },
  { title: "Expenses", href: "/tenant/expenses", icon: Receipt, feature: "expenses" as FeatureKey },
  { title: "Dropdown Settings", href: "/tenant/dropdown-settings", icon: Settings, feature: "dropdownSettings" as FeatureKey },
  { title: "Help & Tutorials", href: "/tenant/help", icon: HelpCircle, feature: "dashboard" as FeatureKey },
  { title: "Settings", href: "/tenant/settings", icon: Settings, feature: "settings" as FeatureKey },
  { title: "Upgrade Plan", href: "/tenant/upgrade-plan", icon: CreditCard, feature: "dashboard" as FeatureKey },
]

const manufacturerNavItems = [
  { title: "Dashboard", href: "/manufacturer", icon: LayoutDashboard },
  { title: "My Factories", href: "/manufacturer/factories", icon: Building2 },
  { title: "Factory Expenses", href: "/manufacturer/expenses", icon: Receipt },
  { title: "Factory Reports", href: "/manufacturer/reports", icon: BarChart3 },
  { title: "Settings", href: "/manufacturer/settings", icon: Settings },
]

const factoryNavItems = [
  { title: "Dashboard", href: "/factory", icon: LayoutDashboard },
  { title: "Products", href: "/factory/products", icon: Package },
  { title: "Production Planning", href: "/factory/production", icon: Package },
  { title: "Raw Materials", href: "/factory/materials", icon: Package },
  { title: "Vendor Management", href: "/factory/vendors", icon: Building2 },
  { title: "Quality Control", href: "/factory/quality", icon: Settings },
  { title: "Inventory", href: "/factory/inventory", icon: Package },
  { title: "Sales & Orders", href: "/factory/orders", icon: ShoppingCart },
  { title: "Shipment", href: "/factory/shipment", icon: Package },
  { title: "Warehouse", href: "/factory/warehouse", icon: Building2 },
  { title: "Distributors", href: "/factory/distributors", icon: Users },
  { title: "Returns & Defects", href: "/factory/returns", icon: Package },
  { title: "Accounting", href: "/factory/accounting", icon: Calculator },
  { title: "Billing & Payment", href: "/factory/billing", icon: Receipt },
  { title: "HR & Staff", href: "/factory/hr", icon: Users },
  { title: "Expenses", href: "/factory/expenses", icon: Receipt },
  { title: "Reports", href: "/factory/reports", icon: BarChart3 },
  { title: "Settings", href: "/factory/settings", icon: Settings },
]

const distributorNavItems = [
  { title: "Dashboard", href: "/distributor", icon: LayoutDashboard },
  { title: "Inventory", href: "/distributor/inventory", icon: Package },
  { title: "Manufacturers", href: "/distributor/manufacturers", icon: Building2 },
  { title: "Retail Partners", href: "/distributor/retailers", icon: Users },
  { title: "Orders", href: "/distributor/orders", icon: ShoppingCart },
  { title: "Logistics", href: "/distributor/logistics", icon: Package },
  { title: "Reports", href: "/distributor/reports", icon: BarChart3 },
  { title: "Settings", href: "/distributor/settings", icon: Settings },
]

export function Sidebar({ userType = "retail" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { hasFeature, loading, allowedFeatures } = useFeatureAccess()

  const getNavItems = () => {
    switch (userType) {
      case "super-admin":
        return superAdminNavItems
      case "manufacturer":
        return manufacturerNavItems
      case "distributor":
        return distributorNavItems
      case "factory":
        return factoryNavItems
      case "retail":
      default:
        return retailNavItems.filter(item => {
          if (loading) return true
          if (item.feature === 'dashboard') return true
          return hasFeature(item.feature)
        })
    }
  }

  const navItems = getNavItems()

  if (userType === "retail" && loading) {
    return (
      <div className="w-64 border-r bg-card">
        <div className="flex h-16 items-center justify-center border-b">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("relative flex flex-col h-screen border-r bg-card transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex h-16 items-center justify-between px-4 py-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Fashion ERP</h2>
              <p className="text-xs text-muted-foreground">
                {userType === "super-admin" ? "Super Admin" : 
                 userType === "manufacturer" ? "Manufacturer" :
                 userType === "distributor" ? "Distributor" :
                 userType === "factory" ? "Factory Manager" : "Retail Store"}
              </p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Scrollable Menu Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3 py-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      collapsed && "px-2",
                      isActive && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", !collapsed && "mr-3")} />
                    {!collapsed && item.title}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
      </div>
      
      {/* Fixed Footer */}
      {!collapsed && (
        <div className="flex-shrink-0 p-3 border-t">
          <div className="text-center text-xs text-muted-foreground">
            Product of{" "}
            <a 
              href="https://www.technovatechnologies.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black hover:text-black "
            >
              Technova Technologies
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
