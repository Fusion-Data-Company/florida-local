/**
 * Seller Onboarding Flow for Stripe Connect
 * 
 * Comprehensive onboarding UI for KYC verification and account setup
 * Supports individual and company business types with full verification tracking
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Building2, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2, 
  ExternalLink,
  Shield,
  FileText,
  DollarSign,
  CreditCard,
  Globe,
  Calendar,
  Upload
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SellerOnboardingProps {
  businessId: string;
  onComplete?: () => void;
}

interface VerificationStatus {
  isVerified: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  pendingVerification: string[];
  disabledReason?: string;
  currentDeadline?: string;
}

interface AccountCapabilities {
  cardPayments: boolean;
  transfers: boolean;
  achPayments: boolean;
  taxReporting: boolean;
  instantPayouts: boolean;
}

export default function SellerOnboarding({ businessId, onComplete }: SellerOnboardingProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<"individual" | "company">("company");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    taxId: "",
    companyName: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
    },
    website: "",
    productDescription: "",
  });

  // Fetch existing account if any
  const { data: existingAccount, isLoading: loadingAccount } = useQuery({
    queryKey: [`/api/businesses/${businessId}/stripe-account`],
    retry: false,
  });

  // Fetch verification status if account exists
  const { data: verificationStatus, refetch: refetchStatus } = useQuery<VerificationStatus>({
    queryKey: [`/api/connect/accounts/${existingAccount?.accountId}/verification`],
    enabled: !!existingAccount?.accountId,
    refetchInterval: 5000, // Poll every 5 seconds during onboarding
  });

  // Create Connect account
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/connect/accounts/create", "POST", {
        businessId,
        businessType,
        ...formData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created",
        description: "Your Stripe Connect account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/stripe-account`] });
      setStep(2);
    },
    onError: (error: any) => {
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create Stripe Connect account",
        variant: "destructive",
      });
    },
  });

  // Get onboarding link
  const getOnboardingLinkMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest(`/api/connect/accounts/${accountId}/onboarding`, "POST", {
        refreshUrl: window.location.href,
        returnUrl: `${window.location.origin}/seller/onboarding/complete`,
      });
    },
    onSuccess: (data) => {
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start onboarding",
        variant: "destructive",
      });
    },
  });

  // Get dashboard link
  const getDashboardLinkMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest(`/api/connect/accounts/${accountId}/dashboard`, "POST");
    },
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to access dashboard",
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = async () => {
    // Validate required fields
    if (businessType === "individual") {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.companyName || !formData.taxId || !formData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    }

    await createAccountMutation.mutateAsync();
  };

  const getVerificationIcon = (status: VerificationStatus) => {
    if (status.isVerified) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (status.pastDue.length > 0) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (status.currentlyDue.length > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    if (status.isVerified) {
      return <Badge variant="default" className="bg-green-600">Verified</Badge>;
    } else if (status.pastDue.length > 0) {
      return <Badge variant="destructive">Action Required</Badge>;
    } else if (status.currentlyDue.length > 0) {
      return <Badge variant="secondary">Pending Verification</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const calculateProgress = () => {
    if (!existingAccount) return 0;
    if (verificationStatus?.isVerified) return 100;
    if (verificationStatus?.pendingVerification.length) return 75;
    if (verificationStatus?.currentlyDue.length === 0) return 50;
    return 25;
  };

  return (
    <div className="space-y-6" data-testid="seller-onboarding">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Account Setup</CardTitle>
          <CardDescription>
            Complete your Stripe Connect account to start accepting payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {!existingAccount && !loadingAccount ? (
        // Step 1: Create Account
        <Card>
          <CardHeader>
            <CardTitle>Create Your Seller Account</CardTitle>
            <CardDescription>
              Start by providing basic information about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Type Selection */}
            <div className="space-y-3">
              <Label>Business Type</Label>
              <RadioGroup
                value={businessType}
                onValueChange={(value: "individual" | "company") => setBusinessType(value)}
                data-testid="business-type-selection"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="individual" id="individual" />
                  <User className="h-4 w-4 ml-2" />
                  <Label htmlFor="individual" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-medium">Individual / Sole Proprietor</div>
                      <div className="text-sm text-muted-foreground">
                        You're a freelancer or sole owner
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="company" id="company" />
                  <Building2 className="h-4 w-4 ml-2" />
                  <Label htmlFor="company" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-medium">Company</div>
                      <div className="text-sm text-muted-foreground">
                        You're a registered business entity
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid gap-4">
              {businessType === "individual" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Acme Corporation"
                      data-testid="input-company-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID (EIN) *</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="12-3456789"
                      data-testid="input-tax-id"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="business@example.com"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="input-website"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Product/Service Description</Label>
                <Input
                  id="productDescription"
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  placeholder="Brief description of what you sell"
                  data-testid="input-description"
                />
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Secure & Compliant</AlertTitle>
              <AlertDescription>
                Your information is encrypted and used solely for payment processing compliance.
                Stripe Connect handles all sensitive financial data securely.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateAccount}
              disabled={createAccountMutation.isPending}
              data-testid="create-account-button"
            >
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Seller Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Account exists - Show status and actions
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Account Status
                  {verificationStatus && getVerificationIcon(verificationStatus)}
                </CardTitle>
                {verificationStatus && getVerificationBadge(verificationStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationStatus && (
                <>
                  {verificationStatus.isVerified ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Account Verified</AlertTitle>
                      <AlertDescription>
                        Your account is fully verified and ready to accept payments.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {verificationStatus.pastDue.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Immediate Action Required</AlertTitle>
                          <AlertDescription>
                            <ul className="mt-2 list-disc list-inside">
                              {verificationStatus.pastDue.map((item) => (
                                <li key={item}>{item.replace(/_/g, " ")}</li>
                              ))}
                            </ul>
                            {verificationStatus.currentDeadline && (
                              <p className="mt-2 font-medium">
                                Deadline: {new Date(verificationStatus.currentDeadline).toLocaleDateString()}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {verificationStatus.currentlyDue.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Information Required</AlertTitle>
                          <AlertDescription>
                            <ul className="mt-2 list-disc list-inside">
                              {verificationStatus.currentlyDue.map((item) => (
                                <li key={item}>{item.replace(/_/g, " ")}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {verificationStatus.pendingVerification.length > 0 && (
                        <Alert>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertTitle>Verification in Progress</AlertTitle>
                          <AlertDescription>
                            The following items are being verified:
                            <ul className="mt-2 list-disc list-inside">
                              {verificationStatus.pendingVerification.map((item) => (
                                <li key={item}>{item.replace(/_/g, " ")}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {!verificationStatus.isVerified && (
                    <Button
                      className="w-full"
                      onClick={() => getOnboardingLinkMutation.mutate(existingAccount.accountId)}
                      disabled={getOnboardingLinkMutation.isPending}
                      data-testid="continue-onboarding-button"
                    >
                      {getOnboardingLinkMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Continue Verification
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Card Payments</span>
                  </div>
                  {existingAccount?.capabilities?.cardPayments ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Bank Transfers</span>
                  </div>
                  {existingAccount?.capabilities?.achPayments ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>International Payments</span>
                  </div>
                  {existingAccount?.capabilities?.transfers ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Instant Payouts</span>
                  </div>
                  {existingAccount?.capabilities?.instantPayouts ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Tax Reporting</span>
                  </div>
                  {existingAccount?.capabilities?.taxReporting ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => getDashboardLinkMutation.mutate(existingAccount.accountId)}
                disabled={getDashboardLinkMutation.isPending || !verificationStatus?.isVerified}
                data-testid="dashboard-button"
              >
                {getDashboardLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Stripe Dashboard
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}