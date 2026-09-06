import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  BookA,
  AlertTriangle,
  Headphones,
  BookOpen,
  NotebookPen,
  Map,
  BarChart3,
  Library,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today/", label: "Today", icon: CheckSquare },
  { href: "/speaking/", label: "Speaking", icon: MessageSquare },
  { href: "/vocabulary/", label: "Vocabulary", icon: BookA },
  { href: "/mistakes/", label: "Mistakes", icon: AlertTriangle },
  { href: "/listening/", label: "Listening", icon: Headphones },
  { href: "/grammar/", label: "Grammar", icon: BookOpen },
  { href: "/journal/", label: "Journal", icon: NotebookPen },
  { href: "/roadmap/", label: "Roadmap", icon: Map },
  { href: "/analytics/", label: "Analytics", icon: BarChart3 },
  { href: "/materials/", label: "Materials", icon: Library },
  { href: "/settings/", label: "Settings", icon: Settings },
];

export const MOBILE_NAV: NavItem[] = NAV_ITEMS.filter((n) =>
  ["/", "/today/", "/speaking/", "/vocabulary/", "/mistakes/"].includes(n.href),
);
