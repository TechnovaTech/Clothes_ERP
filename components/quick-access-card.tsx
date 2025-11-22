"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  Plus,
  BarChart3,
  UserPlus,
  Zap
} from "lucide-react"
import Link from "next/link"

export function QuickAccessCard() {
  const { t, language } = useLanguage()

  const quickActions = [
    {
      title: language === 'en' ? 'New Sale' : language === 'gu' ? 'નવી વેચાણ' : 'नई बिक्री',
      icon: ShoppingCart,
      href: "/tenant/pos",
      gradient: "from-violet-50 to-violet-100",
      border: "border-violet-200",
      iconColor: "text-violet-600",
      textColor: "text-violet-800"
    },
    {
      title: language === 'en' ? 'Add Product' : language === 'gu' ? 'પ્રોડક્ટ ઉમેરો' : 'उत्पाद जोड़ें',
      icon: Plus,
      href: "/tenant/inventory",
      gradient: "from-sky-50 to-sky-100",
      border: "border-sky-200",
      iconColor: "text-sky-600",
      textColor: "text-sky-800"
    },
    {
      title: language === 'en' ? 'Add Customer' : language === 'gu' ? 'ગ્રાહક ઉમેરો' : 'ग्राहक जोड़ें',
      icon: UserPlus,
      href: "/tenant/customers",
      gradient: "from-emerald-50 to-emerald-100",
      border: "border-emerald-200",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-800"
      
    },
    {
      title: language === 'en' ? 'Purchase' : language === 'gu' ? 'ખરીદી' : 'खरीदारी',
      icon: Package,
      href: "/tenant/purchases",
      gradient: "from-amber-50 to-amber-100",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      textColor: "text-amber-800"
    },
    {
      title: language === 'en' ? 'Reports' : language === 'gu' ? 'રિપોર્ટ્સ' : 'रिपोर्ट',
      icon: BarChart3,
      href: "/tenant/reports",
      gradient: "from-rose-50 to-rose-100",
      border: "border-rose-200",
      iconColor: "text-rose-600",
      textColor: "text-rose-800"
    },
    {
      title: language === 'en' ? 'Settings' : language === 'gu' ? 'સેટિંગ્સ' : 'सेटिंग्स',
      icon: Settings,
      href: "/tenant/settings",
      gradient: "from-slate-50 to-slate-100",
      border: "border-slate-200",
      iconColor: "text-slate-600",
      textColor: "text-slate-800"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <span>{language === 'en' ? 'Quick Access' : language === 'gu' ? 'ઝડપી પહોંચ' : 'तुरंत पहुंच'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className={`bg-gradient-to-r ${action.gradient} ${action.border} hover:shadow-md transition-all cursor-pointer group`}>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${action.iconColor} group-hover:scale-110 transition-transform`} />
                      <div className={`font-medium text-sm ${action.textColor}`}>{action.title}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}