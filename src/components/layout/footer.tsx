export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        © {currentYear} Matrix Astronomy Club. All rights reserved. {/* Updated Name */}
      </div>
    </footer>
  );
}
