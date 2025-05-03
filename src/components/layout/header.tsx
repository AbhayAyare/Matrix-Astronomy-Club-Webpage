import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Telescope } from 'lucide-react'; // Removed Palette icon

const navItems = [
  { href: '#about', label: 'About' },
  { href: '#events', label: 'Events' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#join', label: 'Join Us' },
  { href: '#newsletter', label: 'Newsletter' },
  // { href: '#design', label: 'Design' }, // Removed Design link
  { href: '#contact', label: 'Contact' },
  // { href: '/admin', label: 'Admin Login', admin: true }, // Login remains disabled
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-fade-in">
      <div className="container flex h-14 items-center">
        {/* Site Title/Logo */}
        <Link href="/" className="mr-auto flex items-center space-x-2 md:mr-6">
          <Telescope className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            Matrix Astronomy Hub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 justify-center gap-4 md:flex lg:gap-6">
          {navItems.map((item) => !item.admin && ( // Ensure admin check remains
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:scale-105 motion-safe:animate-[fade-in_0.5s_ease-out_forwards]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Trigger */}
        <div className="ml-auto flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 p-4">
                 <Link href="/" className="mb-4 flex items-center space-x-2">
                  <Telescope className="h-6 w-6 text-primary" />
                  <span className="font-bold">Matrix Hub</span>
                 </Link>
                 {navItems.map((item) => ( // Map over potentially filtered items
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-base font-medium text-foreground/80 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                 {/* Login button removed from mobile menu as well */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
