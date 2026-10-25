"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Building2,
  Server,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminTabs = [
  { name: "Overview", href: "/admin", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "System", href: "/admin/system", icon: Server },
  { name: "Waitlist", href: "/admin/waitlist", icon: Mail },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex items-stretch">

      {/* Content area */}
      <div className="min-w-0 flex-1 overflow-auto pl-8 lg:pl-10">{children}</div>
    </div>
  );
}
