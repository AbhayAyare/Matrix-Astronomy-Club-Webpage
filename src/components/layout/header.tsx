import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Telescope } from 'lucide-react';

const navItems = [
  { href: '#about', label: 'About' },
  { href: '#events', label: 'Events' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#join', label: 'Join Us' },
  { href: '#newsletter', label: 'Newsletter' },
  { href: '#contact', label: 'Contact' },
  { href: '/admin', label: 'Admin Login', admin: true },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Telescope className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Matrix Astronomy Hub
          </span>
        </Link>
        <nav className="hidden flex-1 gap-6 md:flex">
          {navItems.map((item) => !item.admin && (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/admin">Admin Login</Link>
          </Button>
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
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
                 {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-base font-medium text-foreground/80 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
