import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/ui/avatar";
import { Settings, LogOut, Menu, X, Mail } from "lucide-react";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/app/lib/utils";
import { useIsMobile } from "@/app/hooks/use-mobile";
import { useAuth } from "../hooks/use-auth";

const Header = ({ toggleSidebar }: { toggleSidebar?: () => void }) => {
  const { user, logout } = useAuth();
  // const location = useLocation();
  const isMobile = useIsMobile();
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <header className="bg-background border-b border-brand-sand-light sticky top-0 z-[1000]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {toggleSidebar && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <Menu size={20} />
            </Button>
          )}

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-lg">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display font-semibold text-lg">Email</span>
              <span className="block text-xs -mt-1 text-muted-foreground">
                Whisperer
              </span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
          </Link>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-sans font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} alt={user?.name || "User"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {showMenu ? <X size={20} /> : <Settings size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden fixed right-0 top-[61px] bg-background border border-brand-sand-light p-2 rounded-bl-md shadow-md transition-all z-[1001]",
          showMenu
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full pointer-events-none",
        )}
      >
        <div className="flex flex-col gap-2 w-48">
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} alt={user?.name || "User"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-sans font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <Link href="/settings" onClick={toggleMenu}>
            <Button variant="ghost" className="w-full justify-start">
              <Settings size={18} className="mr-2" />
              Settings
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              toggleMenu();
              logout();
            }}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
