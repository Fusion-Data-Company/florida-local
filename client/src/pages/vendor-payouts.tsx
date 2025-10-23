import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Wallet, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import MagicDataTable, { type Column } from "@/components/magic/MagicDataTable";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Business = {
  id: string;
  name: string;
  ownerId: string;
  stripeAccountId?: string;
};

type StripeStatus = {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
  payoutSchedule?: {
    interval: string;
    delay_days: number;
  };
};

type Balance = {
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
};

type Payout = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number;
  description: string | null;
  created: number;
};

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  type: string;
  description: string | null;
  fee: number;
  net: number;
  created: number;
};

// Create payout form schema with dynamic validation
const createPayoutFormSchema = (maxAmount: number) => z.object({
  amount: z.coerce
    .number({ required_error: "Amount is required" })
    .min(1, "Amount must be at least $1")
    .max(maxAmount / 100, `Amount cannot exceed available balance ($${(maxAmount / 100).toFixed(2)})`),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

type PayoutFormValues = z.infer<ReturnType<typeof createPayoutFormSchema>>;

export default function VendorPayoutsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");

  // Get user's businesses
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/businesses/my"],
    enabled: isAuthenticated,
  });

  // Get Stripe account status
  const { 
    data: stripeStatus, 
    isLoading: statusLoading,
    error: statusError 
  } = useQuery<StripeStatus>({
    queryKey: ["/api/businesses", selectedBusiness, "stripe", "status"],
    enabled: !!selectedBusiness,
    retry: false,
  });

  // Get balance
  const { data: balance, isLoading: balanceLoading } = useQuery<Balance>({
    queryKey: ["/api/businesses", selectedBusiness, "stripe", "balance"],
    enabled: !!selectedBusiness && !!stripeStatus?.accountId,
    retry: false,
  });

  // Get payouts
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery<{ data: Payout[] }>({
    queryKey: ["/api/businesses", selectedBusiness, "stripe", "payouts"],
    enabled: !!selectedBusiness && !!stripeStatus?.accountId,
    retry: false,
  });

  // Get transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<{ data: Transaction[] }>({
    queryKey: ["/api/businesses", selectedBusiness, "stripe", "transactions"],
    enabled: !!selectedBusiness && !!stripeStatus?.accountId,
    retry: false,
  });

  // Payout form
  const availableBalanceAmount = balance?.available?.find(b => b.currency === 'usd')?.amount || 0;
  const payoutForm = useForm<PayoutFormValues>({
    resolver: zodResolver(createPayoutFormSchema(availableBalanceAmount)),
    defaultValues: {
      amount: undefined,
      description: "",
    },
  });

  // Create Stripe Connect account
  const createConnectAccount = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/businesses/${selectedBusiness}/stripe/connect`, {});
    },
    onSuccess: (data: any) => {
      if (data.accountLink?.url) {
        window.location.href = data.accountLink.url;
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to setup Stripe Connect", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Resume onboarding
  const resumeOnboarding = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/businesses/${selectedBusiness}/stripe/refresh`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resume onboarding');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to resume onboarding", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Create manual payout
  const createPayout = useMutation({
    mutationFn: async (values: PayoutFormValues) => {
      const amountInCents = Math.round(values.amount * 100);
      return await apiRequest("POST", `/api/businesses/${selectedBusiness}/stripe/payouts`, {
        amount: amountInCents,
        description: values.description || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Payout requested successfully" });
      payoutForm.reset();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/businesses", selectedBusiness, "stripe", "payouts"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/businesses", selectedBusiness, "stripe", "balance"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/businesses", selectedBusiness, "stripe", "transactions"] 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create payout", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Update payout settings
  const updatePayoutSettings = useMutation({
    mutationFn: async (interval: string) => {
      return await apiRequest("POST", `/api/businesses/${selectedBusiness}/stripe/payout-settings`, {
        interval,
        delayDays: 2,
      });
    },
    onSuccess: () => {
      toast({ title: "Payout schedule updated successfully" });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/businesses", selectedBusiness, "stripe", "status"] 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update payout schedule", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Currency formatter
  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  // Payout columns
  const payoutColumns: Column<Payout>[] = [
    {
      key: 'created',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value * 1000), 'MMM dd, yyyy'),
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      render: (value, row) => (
        <span className="font-semibold text-lg">
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => {
        const variants: Record<string, { color: string; icon: any }> = {
          paid: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
          pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
          in_transit: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Send },
          failed: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
          canceled: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle },
        };
        const variant = variants[value] || variants.pending;
        const Icon = variant.icon;
        return (
          <Badge className={`${variant.color} flex items-center gap-1 w-fit`}>
            <Icon className="h-3 w-3" />
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'arrival_date',
      title: 'Arrival Date',
      sortable: true,
      render: (value) => format(new Date(value * 1000), 'MMM dd, yyyy'),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value) => value || <span className="text-muted-foreground italic">No description</span>,
    },
  ];

  // Transaction columns
  const transactionColumns: Column<Transaction>[] = [
    {
      key: 'created',
      title: 'Date',
      sortable: true,
      render: (value) => format(new Date(value * 1000), 'MMM dd, yyyy HH:mm'),
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {value.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value) => value || <span className="text-muted-foreground italic">-</span>,
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <span className={`font-semibold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'fee',
      title: 'Fee',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <span className="text-muted-foreground">
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'net',
      title: 'Net',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <span className={`font-bold ${value >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to access vendor payouts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="miami-glass">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Vendor Payouts
            </CardTitle>
            <CardDescription>
              You need to create a business first to manage payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="fl-gold"
              onClick={() => window.location.href = '/create-business'}
            >
              Create Business
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableBalance = balance?.available?.find(b => b.currency === 'usd');
  const pendingBalance = balance?.pending?.find(b => b.currency === 'usd');
  const hasStripeAccount = !!statusError || !!stripeStatus?.accountId;
  const isOnboarded = stripeStatus?.onboardingComplete;
  const canRequestPayout = stripeStatus?.payoutsEnabled;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="vendor-payouts-header flex items-center justify-between rounded-2xl p-6 relative">
        <div className="marble-content">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2" data-testid="heading-vendor-payouts">
            Vendor Payouts
          </h1>
          <p className="text-muted-foreground">
            Manage your Stripe Connect payouts and transactions
          </p>
        </div>
        <Wallet className="h-12 w-12 text-cyan-600 marble-content" />
      </div>

      {/* Business Selection */}
      <Card className="vendor-business-selection miami-glass border-white/30 relative">
        <CardHeader className="marble-content">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Select Business
          </CardTitle>
        </CardHeader>
        <CardContent className="marble-content">
          <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
            <SelectTrigger className="w-full max-w-md bg-white/80 border-white/30" data-testid="select-business">
              <SelectValue placeholder="Choose a business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedBusiness && (
        <>
          {/* Stripe Onboarding Section */}
          {statusLoading ? (
            <Card className="vendor-stripe-status miami-glass relative">
              <CardContent className="pt-6 marble-content">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : !hasStripeAccount || (statusError && (statusError as any).message?.includes('No Stripe Connect account')) ? (
            <Card className="vendor-stripe-status miami-glass border-cyan-300 miami-card-glow relative">
              <CardHeader className="marble-content">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-cyan-600" />
                  Set Up Stripe Payouts
                </CardTitle>
                <CardDescription>
                  Connect your bank account to receive payouts from customer orders
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content">
                <Button
                  variant="fl-gold"
                  onClick={() => createConnectAccount.mutate()}
                  disabled={createConnectAccount.isPending}
                  className="gap-2"
                  data-testid="button-setup-payouts"
                >
                  {createConnectAccount.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Set Up Payouts
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : !isOnboarded ? (
            <Card className="vendor-stripe-status miami-glass border-yellow-300 relative">
              <CardHeader className="marble-content">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  Complete Stripe Onboarding
                </CardTitle>
                <CardDescription>
                  Finish setting up your account to start receiving payouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 marble-content">
                {stripeStatus?.requirements && (
                  <Alert data-testid="alert-requirements">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Required Information</AlertTitle>
                    <AlertDescription>
                      {stripeStatus.requirements.currently_due.length > 0 && (
                        <div>
                          <p className="font-semibold">Currently Due:</p>
                          <ul className="list-disc list-inside">
                            {stripeStatus.requirements.currently_due.map((req) => (
                              <li key={req} className="capitalize">{req.replace(/_/g, ' ')}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  variant="fl-gold"
                  onClick={() => resumeOnboarding.mutate()}
                  disabled={resumeOnboarding.isPending}
                  className="gap-2"
                  data-testid="button-resume-onboarding"
                >
                  {resumeOnboarding.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Resume Onboarding
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="vendor-stripe-status miami-glass border-green-300 relative">
              <CardContent className="pt-6 marble-content">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-lg">Stripe Account Active</h3>
                    <p className="text-sm text-muted-foreground">
                      Payouts {stripeStatus.payoutsEnabled ? 'enabled' : 'disabled'} • 
                      Charges {stripeStatus.chargesEnabled ? 'enabled' : 'disabled'}
                    </p>
                  </div>
                  <Badge 
                    className="ml-auto bg-green-100 text-green-800 border-green-300"
                    data-testid="badge-account-status"
                  >
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Summary Card */}
          {isOnboarded && (
            <div className="vendor-balance-cards grid md:grid-cols-2 gap-6">
              <Card className="miami-glass border-cyan-300 miami-card-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
                <CardHeader className="relative marble-content">
                  <CardTitle className="flex items-center gap-2 text-cyan-700">
                    <TrendingUp className="h-5 w-5" />
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative marble-content">
                  {balanceLoading ? (
                    <Skeleton className="h-16 w-48" />
                  ) : (
                    <div className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-available-balance">
                      {formatCurrency(availableBalance?.amount || 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="miami-glass border-purple-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                <CardHeader className="relative marble-content">
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Clock className="h-5 w-5" />
                    Pending Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative marble-content">
                  {balanceLoading ? (
                    <Skeleton className="h-16 w-48" />
                  ) : (
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="text-pending-balance">
                      {formatCurrency(pendingBalance?.amount || 0)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payout Schedule & Manual Payout */}
          {isOnboarded && (
            <div className="vendor-payout-settings grid md:grid-cols-2 gap-6">
              {/* Payout Schedule */}
              <Card className="vendor-payout-schedule miami-glass relative">
                <CardHeader className="marble-content">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Payout Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 marble-content">
                  <div>
                    <Label htmlFor="payout-schedule">Schedule Interval</Label>
                    <Select
                      value={stripeStatus?.payoutSchedule?.interval || 'daily'}
                      onValueChange={(value) => updatePayoutSettings.mutate(value)}
                      disabled={updatePayoutSettings.isPending}
                    >
                      <SelectTrigger 
                        id="payout-schedule" 
                        className="bg-white/80 border-white/30"
                        data-testid="payout-schedule"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Delay: {stripeStatus?.payoutSchedule?.delay_days || 2} days
                  </div>
                  {stripeStatus?.payoutSchedule?.interval === 'manual' && canRequestPayout && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Manual mode enabled. Use the form below to request payouts.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Manual Payout Form */}
              {canRequestPayout && (
                <Card className="vendor-payout-form miami-glass border-blue-300 relative">
                  <CardHeader className="marble-content">
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Request Payout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="marble-content">
                    <Form {...payoutForm}>
                      <form onSubmit={payoutForm.handleSubmit((values) => createPayout.mutate(values))} className="space-y-4">
                        <FormField
                          control={payoutForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (USD) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="1"
                                  placeholder="100.00"
                                  className="bg-white/80 border-white/30"
                                  data-testid="input-payout-amount"
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground mt-1">
                                Available: {formatCurrency(availableBalance?.amount || 0)}
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={payoutForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Weekly payout"
                                  className="bg-white/80 border-white/30"
                                  data-testid="input-payout-description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          variant="fl-gold"
                          type="submit"
                          disabled={!payoutForm.formState.isValid || createPayout.isPending}
                          className="w-full gap-2"
                          data-testid="button-request-payout"
                        >
                          {createPayout.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Request Payout
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Payouts History */}
          {isOnboarded && (
            <Card className="vendor-payouts-table miami-glass relative">
              <CardHeader className="marble-content">
                <CardTitle>Payouts History</CardTitle>
                <CardDescription>View all your payout transactions</CardDescription>
              </CardHeader>
              <CardContent className="marble-content">
                {payoutsLoading ? (
                  <div className="space-y-3" data-testid="loading-payouts">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : payoutsData?.data && payoutsData.data.length > 0 ? (
                  <div data-testid="table-payouts">
                    <MagicDataTable
                      data={payoutsData.data}
                      columns={payoutColumns}
                      searchable={true}
                      sortable={true}
                      paginated={true}
                      pageSize={10}
                      emptyMessage="No payouts yet"
                    />
                  </div>
                ) : (
                  <Alert data-testid="alert-no-payouts">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Payouts Yet</AlertTitle>
                    <AlertDescription>
                      Your payout history will appear here once you start receiving payments.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transactions History */}
          {isOnboarded && (
            <Card className="vendor-transactions-table miami-glass relative">
              <CardHeader className="marble-content">
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All balance transactions including charges, refunds, and fees</CardDescription>
              </CardHeader>
              <CardContent className="marble-content">
                {transactionsLoading ? (
                  <div className="space-y-3" data-testid="loading-transactions">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : transactionsData?.data && transactionsData.data.length > 0 ? (
                  <div data-testid="table-transactions">
                    <MagicDataTable
                      data={transactionsData.data}
                      columns={transactionColumns}
                      searchable={true}
                      sortable={true}
                      paginated={true}
                      pageSize={10}
                      emptyMessage="No transactions yet"
                    />
                  </div>
                ) : (
                  <Alert data-testid="alert-no-transactions">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Transactions Yet</AlertTitle>
                    <AlertDescription>
                      Your transaction history will appear here once you start processing payments.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
    </div>
  );
}
