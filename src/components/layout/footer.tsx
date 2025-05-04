import Link from 'next/link'; // Import Link

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        © {currentYear} Matrix Astronomy Club. All rights reserved.
         <div className="mt-2"> {/* Added margin top for spacing */}
             {/* Updated link to point to /admin and changed text */}
             <Link href="/admin" className="text-xs hover:text-primary transition-colors duration-200">
               Admin Panel
             </Link>
         </div>
      </div>
    </footer>
  );
}
