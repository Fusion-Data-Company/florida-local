/**
 * Payment Dashboard with Analytics
 * 
 * Comprehensive financial dashboard for payment history, analytics, and payout management
 * Provides real-time financial insights and transaction tracking
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PaymentDashboardProps {
  accountId?: string;
  isSeller?: boolean;
}

interface FinancialMetrics {
  totalRevenue: number;
  pendingBalance: number;
  availableBalance: number;
  totalTransactions: number;
  averageTransactionValue: number;
  refundRate: number;
  chargebackRate: number;
  monthlyGrowth: number;
}

interface Transaction {
  id: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  type: string;
  status: string;
  created: string;
  description?: string;
  customer?: string;
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  arrivalDate: string;
  status: string;
  method: string;
  failureReason?: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function PaymentDashboard({ accountId, isSeller = false }: PaymentDashboardProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [instantPayout, setInstantPayout] = useState(false);
  const itemsPerPage = 10;

  // Fetch financial metrics
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery<FinancialMetrics>({
    queryKey: ["/api/reports/financial", { 
      accountId, 
      startDate: dateRange.start.toISOString(), 
      endDate: dateRange.end.toISOString() 
    }],
  });

  // Fetch account balance
  const { data: balance } = useQuery({
    queryKey: [`/api/connect/accounts/${accountId}/balance`],
    enabled: !!accountId && isSeller,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: [`/api/connect/accounts/${accountId}/transactions`, currentPage],
    enabled: !!accountId,
  });

  // Fetch payouts
  const { data: payouts = [] } = useQuery<Payout[]>({
    queryKey: [`/api/connect/accounts/${accountId}/payouts`],
    enabled: !!accountId && isSeller,
  });

  // Create payout mutation
  const createPayoutMutation = useMutation({
    mutationFn: async () => {
      if (!accountId || !payoutAmount) throw new Error("Invalid payout parameters");
      
      return apiRequest(`/api/connect/accounts/${accountId}/payouts`, "POST", {
        amount: parseFloat(payoutAmount),
        instant: instantPayout,
      });
    },
    onSuccess: () => {
      toast({
        title: "Payout Initiated",
        description: `Payout of $${payoutAmount} has been initiated successfully.`,
      });
      setPayoutAmount("");
      queryClient.invalidateQueries({ queryKey: [`/api/connect/accounts/${accountId}/payouts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/connect/accounts/${accountId}/balance`] });
    },
    onError: (error: any) => {
      toast({
        title: "Payout Failed",
        description: error.message || "Failed to initiate payout",
        variant: "destructive",
      });
    },
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (type: "financial" | "tax" | "compliance") => {
      const endpoint = type === "tax" 
        ? `/api/reports/tax/${accountId}?year=${new Date().getFullYear()}`
        : `/api/reports/${type}`;
      
      return apiRequest(endpoint, "GET");
    },
    onSuccess: (data, type) => {
      toast({
        title: "Report Generated",
        description: `Your ${type} report has been generated successfully.`,
      });
      // Handle report download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString()}.json`;
      a.click();
    },
    onError: (error: any) => {
      toast({
        title: "Report Generation Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (transactionFilter === "all") return transactions;
    return transactions.filter(t => t.type === transactionFilter);
  }, [transactions, transactionFilter]);

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Calculate chart data
  const revenueChartData = useMemo(() => {
    if (!transactions.length) return [];
    
    const grouped = transactions.reduce((acc, t) => {
      const date = format(new Date(t.created), "MMM dd");
      acc[date] = (acc[date] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, revenue]) => ({
      date,
      revenue: revenue / 100,
    }));
  }, [transactions]);

  const paymentMethodData = useMemo(() => {
    const methods = { Card: 0, Bank: 0, Wallet: 0, Other: 0 };
    transactions.forEach(t => {
      if (t.type.includes("card")) methods.Card++;
      else if (t.type.includes("bank")) methods.Bank++;
      else if (t.type.includes("wallet")) methods.Wallet++;
      else methods.Other++;
    });
    
    return Object.entries(methods)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
      case "paid":
        return <Badge variant="default" className="bg-green-600">Succeeded</Badge>;
      case "pending":
      case "in_transit":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
      case "canceled":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="payment-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Payment Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your financial performance and manage payouts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetchMetrics()}
            data-testid="refresh-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button data-testid="generate-report-button">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Financial Report</DialogTitle>
                <DialogDescription>
                  Select the type of report you want to generate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => generateReportMutation.mutate("financial")}
                  disabled={generateReportMutation.isPending}
                >
                  Financial Report
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => generateReportMutation.mutate("tax")}
                  disabled={generateReportMutation.isPending}
                >
                  Tax Report (1099-K)
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => generateReportMutation.mutate("compliance")}
                  disabled={generateReportMutation.isPending}
                >
                  Compliance Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-revenue">
              ${metrics?.totalRevenue.toFixed(2) || "0.00"}
            </div>
            {metrics?.monthlyGrowth !== undefined && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {metrics.monthlyGrowth > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{metrics.monthlyGrowth.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">{metrics.monthlyGrowth.toFixed(1)}%</span>
                  </>
                )}
                from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="available-balance">
              ${balance?.available?.[0]?.amount.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="pending-balance">
              ${balance?.pending?.[0]?.amount.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-transactions">
              {metrics?.totalTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ${metrics?.averageTransactionValue.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Transactions and Payouts */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {isSeller && <TabsTrigger value="payouts">Payouts</TabsTrigger>}
          {isSeller && <TabsTrigger value="payout-settings">Payout Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction Filters */}
          <div className="flex gap-2">
            <Select value={transactionFilter} onValueChange={setTransactionFilter}>
              <SelectTrigger className="w-[180px]" data-testid="filter-transactions">
                <SelectValue placeholder="Filter transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="charge">Charges</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="payout">Payouts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : paginatedTransactions.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                          <TableCell>
                            {format(new Date(transaction.created), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description || transaction.id}
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${(transaction.amount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -${(transaction.fee / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${(transaction.net / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
                      {filteredTransactions.length} transactions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * itemsPerPage >= filteredTransactions.length}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isSeller && (
          <TabsContent value="payouts" className="space-y-4">
            {/* Create Payout */}
            <Card>
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
                <CardDescription>
                  Transfer available funds to your bank account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payout-amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="payout-amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-8"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        max={balance?.available?.[0]?.amount || 0}
                        data-testid="input-payout-amount"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: ${balance?.available?.[0]?.amount.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payout-type">Payout Type</Label>
                    <Select
                      value={instantPayout ? "instant" : "standard"}
                      onValueChange={(v) => setInstantPayout(v === "instant")}
                    >
                      <SelectTrigger id="payout-type" data-testid="select-payout-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          Standard (2-5 days) - Free
                        </SelectItem>
                        <SelectItem value="instant">
                          Instant (30 minutes) - 1% + $0.25
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {instantPayout && payoutAmount && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Instant payout fee: ${(parseFloat(payoutAmount) * 0.01 + 0.25).toFixed(2)}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full"
                  onClick={() => createPayoutMutation.mutate()}
                  disabled={
                    !payoutAmount ||
                    parseFloat(payoutAmount) <= 0 ||
                    parseFloat(payoutAmount) > (balance?.available?.[0]?.amount || 0) ||
                    createPayoutMutation.isPending
                  }
                  data-testid="create-payout-button"
                >
                  {createPayoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Request Payout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Payout History */}
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                {payouts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Arrival</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id} data-testid={`payout-${payout.id}`}>
                          <TableCell>
                            {format(new Date(payout.arrivalDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${(payout.amount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payout.method === "instant" ? "Instant" : "Standard"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(payout.arrivalDate), "MMM dd")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No payouts yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isSeller && (
          <TabsContent value="payout-settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout Schedule</CardTitle>
                <CardDescription>
                  Configure how often you receive automatic payouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payout Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger data-testid="select-payout-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Automatic payouts are processed according to your schedule when your available balance exceeds $1.00
                    </AlertDescription>
                  </Alert>

                  <Button className="w-full" data-testid="save-payout-settings">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}