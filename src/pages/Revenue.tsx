import { useState, useEffect } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { useProjectManagement, Currency, RevenueStatus } from '@/contexts/ProjectManagementContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, Trash2, DollarSign, Wallet, PiggyBank, Clock } from 'lucide-react';
import { format } from 'date-fns';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

export default function Revenue() {
  const { user } = useAuth();
  const { 
    getAllRevenues, 
    createRevenue, 
    updateRevenue,
    deleteRevenue,
    getClients, 
    projects,
    payments 
  } = useProjectManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clients, setClients] = useState<User[]>([]);
  const [newRevenue, setNewRevenue] = useState({
    clientId: '',
    projectId: '',
    amount: '',
    currency: 'USD' as Currency,
    dateReceived: new Date().toISOString().split('T')[0],
  });

  const revenues = getAllRevenues();

  useEffect(() => {
    const loadClients = async () => {
      const fetchedClients = await getClients();
      setClients(fetchedClients);
    };
    loadClients();
  }, [getClients]);

  // Calculate totals - ONLY include PAID revenue
  const paidRevenues = revenues.filter(r => r.status === 'paid');
  const pendingRevenues = revenues.filter(r => r.status === 'pending');
  
  const totalPaidRevenue = paidRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalPendingRevenue = pendingRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalPayments = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const profit = totalPaidRevenue - totalPayments;

  const handleCreateRevenue = async () => {
    if (newRevenue.clientId && newRevenue.projectId && newRevenue.amount) {
      await createRevenue(
        newRevenue.clientId,
        newRevenue.projectId,
        parseFloat(newRevenue.amount),
        newRevenue.currency,
        newRevenue.dateReceived
      );
      setNewRevenue({
        clientId: '',
        projectId: '',
        amount: '',
        currency: 'USD',
        dateReceived: new Date().toISOString().split('T')[0],
      });
      setIsCreateOpen(false);
    }
  };

  const handleToggleStatus = async (revenueId: string, currentStatus: RevenueStatus) => {
    await updateRevenue(revenueId, { 
      status: currentStatus === 'paid' ? 'pending' : 'paid' 
    });
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    if (confirm('Are you sure you want to delete this revenue record?')) {
      await deleteRevenue(revenueId);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  return (
    <div className="page-container">
      <AppHeader 
        title="Revenue & Profit" 
        subtitle="Track income and calculate profit"
        icon={<TrendingUp className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        {/* Financial Summary Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-success" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-success" />
                Paid Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold font-display text-success">${totalPaidRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed payments received</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-primary" style={{ animationDelay: '0.15s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Pending Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold font-display text-primary">${totalPendingRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-warning" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4 text-warning" />
                Employee Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold font-display text-warning">${totalPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid to employees</p>
            </CardContent>
          </Card>

          <Card className={`card-premium hover-lift animate-fade-in border-l-4 ${profit >= 0 ? 'border-l-success' : 'border-l-destructive'}`} style={{ animationDelay: '0.25s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <PiggyBank className={`h-4 w-4 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl sm:text-3xl font-bold font-display ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paid revenue minus payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Explanation */}
        <Card className="card-premium mb-8 animate-fade-in bg-muted/30" style={{ animationDelay: '0.3s' }}>
          <CardContent className="pt-5">
            <h3 className="font-display font-semibold mb-3">How Profit is Calculated</h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Profit = Paid Revenue - Paid Employee Payments</strong>
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                <span><strong className="text-foreground">Paid Revenue:</strong> Only revenue marked as "Paid" counts toward totals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Pending Revenue:</strong> Visible in the table but NOT included in profit calculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                <span><strong className="text-foreground">Employee Payments:</strong> Only payments marked as "Paid" are subtracted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span><strong className="text-foreground">Assumption:</strong> All amounts are treated as USD (no currency conversion)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Create Revenue Button */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6 gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow animate-fade-in" style={{ animationDelay: '0.35s' }}>
              <Plus className="h-4 w-4" />
              Record Revenue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Record New Revenue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select 
                  value={newRevenue.clientId} 
                  onValueChange={(v) => setNewRevenue(prev => ({ ...prev, clientId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No clients available</div>
                    ) : (
                      clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select 
                  value={newRevenue.projectId} 
                  onValueChange={(v) => setNewRevenue(prev => ({ ...prev, projectId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No projects available</div>
                    ) : (
                      projects.map(proj => (
                        <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newRevenue.amount}
                    onChange={(e) => setNewRevenue(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={newRevenue.currency} 
                    onValueChange={(v) => setNewRevenue(prev => ({ ...prev, currency: v as Currency }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Received</Label>
                <Input
                  type="date"
                  value={newRevenue.dateReceived}
                  onChange={(e) => setNewRevenue(prev => ({ ...prev, dateReceived: e.target.value }))}
                />
              </div>

              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                New revenue is created as "Pending". Mark it as "Paid" once payment is confirmed.
              </p>

              <Button 
                className="w-full" 
                onClick={handleCreateRevenue}
                disabled={!newRevenue.clientId || !newRevenue.projectId || !newRevenue.amount}
              >
                Record Revenue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revenue Table */}
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="font-display">Revenue Records</CardTitle>
            <CardDescription>All income from clients (only "Paid" counts toward profit)</CardDescription>
          </CardHeader>
          <CardContent>
            {revenues.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No revenue recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.map((revenue) => (
                      <TableRow key={revenue.id} className={revenue.status === 'pending' ? 'opacity-70' : ''}>
                        <TableCell className="font-medium">
                          {getClientName(revenue.clientId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{getProjectName(revenue.projectId)}</TableCell>
                        <TableCell className={`font-semibold ${revenue.status === 'paid' ? 'text-success' : 'text-muted-foreground'}`}>
                          {CURRENCY_SYMBOLS[revenue.currency]}{revenue.amount.toFixed(2)} {revenue.currency}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(revenue.dateReceived), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={revenue.status === 'paid' ? 'default' : 'secondary'}
                            className={revenue.status === 'paid' ? 'bg-success hover:bg-success/90' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}
                          >
                            {revenue.status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(revenue.id, revenue.status)}
                            >
                              Mark as {revenue.status === 'paid' ? 'Pending' : 'Paid'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteRevenue(revenue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
