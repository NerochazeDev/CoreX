import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Deposit() {
  const [, setLocation] = useLocation();
  
  // Redirect to automated deposit immediately - this is now the only deposit method
  useEffect(() => {
    setLocation('/deposit/automated');
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to deposit...</p>
      </div>
    </div>
  );
}