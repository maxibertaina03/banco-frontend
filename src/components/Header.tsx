import { Bell, Menu } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import logo from "../imports/image-3.png";

interface HeaderProps {
  displayName?: string;
}

export function Header({ displayName = 'Mi cuenta' }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="border-b border-primary/20 bg-[#1C0B2E]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[#2D1548] transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <img src={logo} alt="Orbital" className="h-9 object-contain" />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-[#2D1548] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#A855F7] rounded-full"></span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2D1548] transition-colors">
              <span className="text-sm">{user?.firstName || displayName}</span>
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-[#1C0B2E] border border-primary/20",
                  userButtonPopoverActionButton: "text-purple-300 hover:text-purple-100",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
