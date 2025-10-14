import { useRealtimeUpdates } from '@/hooks/use-realtime-updates';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

export function RealtimeConnection() {
  const { isConnected } = useRealtimeUpdates();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Badge variant={isConnected ? "default" : "destructive"} className="fixed top-4 right-4 z-50">
      {isConnected ? "Live Updates" : "Connecting..."}
    </Badge>
  );
}