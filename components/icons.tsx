import {
  User,
  Users,
  Calendar,
  CheckCircle,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Star,
  Plane,
  Globe,
  Clock,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Home,
  Menu,
  X,
  Loader2,
  Plus,
  Minus,
  LucideProps,
  type LucideIcon,
  UserCheck,
  Podcast,
  Music,
  Briefcase,
  Sparkles,
  CircuitBoard,
  MessageSquare,
  Wine,
  Utensils,
  HeartPulse,
  Tv,
  Laugh,
  Users2,
  Trophy,
  Palette,
  Instagram,
  Linkedin,
  Twitter
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  user: User,
  users: Users,
  calendar: Calendar,
  logout: LogOut,
  home: Home,
  menu: Menu,
  close: X,
  plane: Plane,
  globe: Globe,
  clock: Clock,
  phone: Phone,
  mail: Mail,
  location: MapPin,
  card: CreditCard,
  settings: Settings,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  ticket: Ticket,
  star: Star,
  spinner: Loader2,
  plus: Plus,
  minus: Minus,
  verified: UserCheck,
  podcast: Podcast,
  music: Music,
  business: Briefcase,
  special: Sparkles,
  tech: CircuitBoard,
  comedy: Laugh,
  message: MessageSquare,
  wine: Wine,
  food: Utensils,
  wellness: HeartPulse,
  presentation: Tv,
  family: Users2,
  sports: Trophy,
  art: Palette,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  
  // Generic logo placeholder
  logo: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 21v-4a2 2 0 0 1 2 -2h4" />
      <path d="M7 4v2a3 3 0 0 0 3 3h5" />
      <path d="M3 11v-4a2 2 0 0 1 2 -2h4" />
      <path d="M15 5v4a2 2 0 0 0 2 2h4" />
      <path d="M3 15v4a2 2 0 0 0 2 2h4" />
      <path d="M17 3l0 4" />
      <path d="M21 7l-4 0" />
      <path d="M7 21l0 -4" />
      <path d="M3 17l4 0" />
    </svg>
  ),
  
  // placeholder for any missing icon
  placeholder: ({ size, ...props }: LucideProps) => (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
      <path d="M12 7v5" />
      <path d="M12 16h.01" />
    </svg>
  ),
}; 