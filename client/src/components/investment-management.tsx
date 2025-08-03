
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatBitcoin, formatDate } from "@/lib/utils";
import { Pause, Play, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface Investment {
  id: number;
  userId: number;
  planId: number;
  amount: string;
  currentProfit: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPaused: boolean;
  pausedAt?: string;
  pauseReason?: string;
  pausedBy?: number;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface InvestmentPlan {
  id: number;
  name: string;
}

export function InvestmentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pauseReason, setPauseReason] = useState("");
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    refetchInterval: 30000,
  });

  const { data: plans = [] } = useQuery<InvestmentPlan[]>({
    queryKey: ['/api/investment-plans'],
  });

  // Get all user investments
  const allInvestments = users.flatMap(user => {
    const { data: userInvestments = [] } = useQuery<Investment[]>({
      queryKey: ['/api/investments/user', user.id],
      enabled: !!user.id,
    });
    return userInvestments.map(inv => ({ ...inv, userEmail: user.email, userName: `${user.firstName} ${user.lastName}` }));
  });

  const pauseInvestmentMutation = useMutation({
    mutationFn: async ({ investmentId, reason }: { investmentId: number; reason: string }) => {
      const response = await fetch(`/api/admin/investments/${investmentId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-backdoor-access': 'true',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Investment Paused",
        description: "Investment has been paused successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/investments/user'] });
      setPauseReason("");
      setSelectedInvestment(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unpauseInvestmentMutation = useMutation({
    mutationFn: async (investmentId: number) => {
      const response = await fetch(`/api/admin/investments/${investmentId}/unpause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-backdoor-access': 'true',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Investment Resumed",
        description: "Investment has been resumed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/investments/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPlanName = (planId: number) => {
    return plans.find(plan => plan.id === planId)?.name || `Plan ${planId}`;
  };

  const activeInvestments = allInvestments.filter(inv => inv.isActive);
  const pausedInvestments = allInvestments.filter(inv => inv.isPaused);

  return (
    <div className="space-y-6">
      {/* Active Investments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-500" />
            Active Investments ({activeInvestments.filter(inv => !inv.isPaused).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeInvestments.filter(inv => !inv.isPaused).map((investment: any) => (
              <div key={investment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{investment.userName} ({investment.userEmail})</div>
                    <div className="text-sm text-muted-foreground">
                      {getPlanName(investment.planId)} • {formatBitcoin(investment.amount)} BTC
                    </div>
                    <div className="text-sm text-green-600">
                      Profit: +{formatBitcoin(investment.currentProfit)} BTC
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      Active
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvestment(investment)}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pause Investment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="pause-reason">Reason for Pausing</Label>
                            <Textarea
                              id="pause-reason"
                              placeholder="e.g., Account needs renewal, Verification required, etc."
                              value={pauseReason}
                              onChange={(e) => setPauseReason(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                if (selectedInvestment && pauseReason.trim()) {
                                  pauseInvestmentMutation.mutate({
                                    investmentId: selectedInvestment.id,
                                    reason: pauseReason.trim(),
                                  });
                                }
                              }}
                              disabled={!pauseReason.trim() || pauseInvestmentMutation.isPending}
                              variant="destructive"
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause Investment
                            </Button>
                            <Button variant="outline" onClick={() => {
                              setPauseReason("");
                              setSelectedInvestment(null);
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
            {activeInvestments.filter(inv => !inv.isPaused).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active investments found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paused Investments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Paused Investments ({pausedInvestments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pausedInvestments.map((investment: any) => (
              <div key={investment.id} className="border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{investment.userName} ({investment.userEmail})</div>
                    <div className="text-sm text-muted-foreground">
                      {getPlanName(investment.planId)} • {formatBitcoin(investment.amount)} BTC
                    </div>
                    <div className="text-sm text-green-600">
                      Profit: +{formatBitcoin(investment.currentProfit)} BTC
                    </div>
                    {investment.pausedAt && (
                      <div className="text-sm text-orange-600">
                        Paused: {formatDate(new Date(investment.pausedAt))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                      Paused
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unpauseInvestmentMutation.mutate(investment.id)}
                      disabled={unpauseInvestmentMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  </div>
                </div>
                {investment.pauseReason && (
                  <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-300">
                    <div className="text-sm font-medium text-orange-800">Pause Reason:</div>
                    <div className="text-sm text-orange-700">{investment.pauseReason}</div>
                  </div>
                )}
              </div>
            ))}
            {pausedInvestments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No paused investments found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
