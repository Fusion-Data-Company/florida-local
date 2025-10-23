import Taxjar from "taxjar";
import { logger } from "./monitoring";
import { cache } from "./redis";

// Initialize TaxJar client
const apiKey = process.env.TAXJAR_API_TOKEN || process.env.TAXJAR_API_KEY;
const taxjar = apiKey
  ? new Taxjar({
      apiKey: apiKey,
      apiUrl: process.env.TAXJAR_API_URL || "https://api.taxjar.com",
    })
  : null;

interface TaxCalculationParams {
  fromCountry: string;
  fromZip: string;
  fromState: string;
  fromCity?: string;
  fromStreet?: string;
  toCountry: string;
  toZip: string;
  toState: string;
  toCity?: string;
  toStreet?: string;
  amount: number;
  shipping: number;
  lineItems: Array<{
    id: string;
    quantity: number;
    productTaxCode?: string;
    unitPrice: number;
    discount?: number;
  }>;
}

interface TaxRate {
  zip: string;
  state: string;
  stateRate: number;
  countyRate: number;
  cityRate: number;
  specialDistrictRate: number;
  combinedRate: number;
}

interface OrderObject {
  transaction_id: string;
  transaction_date: string;
  amount: number;
  sales_tax: number;
  to_state: string;
  to_zip?: string;
  to_country?: string;
}

// Get tax rates for a location
export async function getTaxRates(
  zip: string,
  city?: string,
  state?: string,
  country: string = "US"
): Promise<TaxRate | null> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - returning zero tax");
    return null;
  }

  try {
    // Check cache first
    const cacheKey = `taxrate:${country}:${zip}:${city || 'default'}:${state || 'default'}`;
    const cached = await cache.get<TaxRate>(cacheKey);
    if (cached) {
      return cached;
    }

    const params: any = { country };
    if (city) params.city = city;
    if (state) params.state = state;
    
    const response = await taxjar.ratesForLocation(zip, params);

    const rate: TaxRate = {
      zip: response.rate.zip || zip,
      state: response.rate.state || state || "",
      stateRate: response.rate.state_rate || 0,
      countyRate: response.rate.county_rate || 0,
      cityRate: response.rate.city_rate || 0,
      specialDistrictRate: (response.rate as any).special_district_rate || response.rate.combined_district_rate || 0,
      combinedRate: response.rate.combined_rate || 0,
    };

    // Cache for 24 hours
    await cache.set(cacheKey, rate, 86400);

    return rate;
  } catch (error) {
    logger.error("Failed to get tax rates", { error, zip });
    return null;
  }
}

// Calculate sales tax for an order
export async function calculateSalesTax(
  params: TaxCalculationParams
): Promise<{
  taxableAmount: number;
  taxCollectable: number;
  combinedTaxRate: number;
  breakdown: any;
} | null> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - returning zero tax");
    return {
      taxableAmount: params.amount,
      taxCollectable: 0,
      combinedTaxRate: 0,
      breakdown: {},
    };
  }

  try {
    const response = await taxjar.taxForOrder({
      from_country: params.fromCountry,
      from_zip: params.fromZip,
      from_state: params.fromState,
      from_city: params.fromCity,
      from_street: params.fromStreet,
      to_country: params.toCountry,
      to_zip: params.toZip,
      to_state: params.toState,
      to_city: params.toCity,
      to_street: params.toStreet,
      amount: params.amount,
      shipping: params.shipping,
      line_items: params.lineItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product_tax_code: item.productTaxCode,
        unit_price: item.unitPrice,
        discount: item.discount || 0,
      })),
    });

    return {
      taxableAmount: response.tax.taxable_amount,
      taxCollectable: response.tax.amount_to_collect,
      combinedTaxRate: response.tax.rate,
      breakdown: response.tax.breakdown,
    };
  } catch (error) {
    logger.error("Failed to calculate sales tax", { error, params });
    return null;
  }
}

// Create a transaction record for reporting
export async function createTaxTransaction(
  transactionData: {
    transactionId: string;
    transactionDate: string;
    toCountry: string;
    toZip: string;
    toState: string;
    toCity?: string;
    toStreet?: string;
    amount: number;
    shipping: number;
    salesTax: number;
    lineItems: Array<{
      id: string;
      quantity: number;
      productIdentifier: string;
      description: string;
      productTaxCode?: string;
      unitPrice: number;
      discount?: number;
      salesTax: number;
    }>;
  }
): Promise<boolean> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - skipping transaction record");
    return false;
  }

  try {
    await taxjar.createOrder({
      transaction_id: transactionData.transactionId,
      transaction_date: transactionData.transactionDate,
      to_country: transactionData.toCountry,
      to_zip: transactionData.toZip,
      to_state: transactionData.toState,
      to_city: transactionData.toCity,
      to_street: transactionData.toStreet,
      amount: transactionData.amount,
      shipping: transactionData.shipping,
      sales_tax: transactionData.salesTax,
      line_items: transactionData.lineItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product_identifier: item.productIdentifier,
        description: item.description,
        product_tax_code: item.productTaxCode,
        unit_price: item.unitPrice,
        discount: item.discount || 0,
        sales_tax: item.salesTax,
      })),
    });

    logger.info("Tax transaction created", {
      transactionId: transactionData.transactionId,
      amount: transactionData.amount,
      tax: transactionData.salesTax,
    });

    return true;
  } catch (error) {
    logger.error("Failed to create tax transaction", { error, transactionData });
    return false;
  }
}

// Get tax categories for products
export async function getTaxCategories(): Promise<Array<{
  name: string;
  productTaxCode: string;
  description: string;
}> | null> {
  if (!taxjar) {
    return getDefaultTaxCategories();
  }

  try {
    // Check cache first
    const cached = await cache.get<any[]>("tax:categories");
    if (cached) {
      return cached;
    }

    const response = await taxjar.categories();
    
    const categories = response.categories.map((cat: any) => ({
      name: cat.name,
      productTaxCode: cat.product_tax_code,
      description: cat.description,
    }));

    // Cache for 7 days
    await cache.set("tax:categories", categories, 604800);

    return categories;
  } catch (error) {
    logger.error("Failed to get tax categories", { error });
    return getDefaultTaxCategories();
  }
}

// Default tax categories if TaxJar is not available
function getDefaultTaxCategories() {
  return [
    {
      name: "General - Tangible Goods",
      productTaxCode: "00000",
      description: "General tangible personal property",
    },
    {
      name: "Clothing",
      productTaxCode: "20010",
      description: "All human wearing apparel suitable for general use",
    },
    {
      name: "Food & Groceries",
      productTaxCode: "40030",
      description: "Food for human consumption, eligible for reduced rates in some states",
    },
    {
      name: "Software as a Service",
      productTaxCode: "30070",
      description: "Pre-written software, delivered electronically via the cloud",
    },
    {
      name: "Digital Goods",
      productTaxCode: "31000",
      description: "Digital products transferred electronically",
    },
  ];
}

// Validate a VAT number (for international)
export async function validateVatNumber(vatNumber: string): Promise<{
  valid: boolean;
  exists: boolean;
  country?: string;
  name?: string;
} | null> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - cannot validate VAT");
    return null;
  }

  try {
    const response = await taxjar.validate({
      vat: vatNumber,
    });

    return {
      valid: response.validation.valid,
      exists: response.validation.exists,
      country: response.validation.vies_response?.country_code,
      name: response.validation.vies_response?.name,
    };
  } catch (error) {
    logger.error("Failed to validate VAT number", { error, vatNumber });
    return null;
  }
}

/**
 * Generate comprehensive sales tax report for a date range
 * 
 * NOTE: Full functionality requires TAXJAR_API_TOKEN with proper subscription.
 * Response format may vary depending on TaxJar account type:
 * - Some accounts receive full order objects with amount/sales_tax properties
 * - Other accounts receive only transaction IDs and must fetch details separately
 * 
 * Uses TaxJar's reporting API to fetch transaction summaries and calculate totals
 * @param startDate - Start date in ISO format (YYYY-MM-DD)
 * @param endDate - End date in ISO format (YYYY-MM-DD)
 * @returns Sales tax report with totals and state breakdown, or null if unavailable
 */
export async function generateSalesTaxReport(
  startDate: string,
  endDate: string
): Promise<{
  period: { startDate: string; endDate: string };
  summary: {
    totalSales: number;
    taxableSales: number;
    nonTaxableSales: number;
    totalTaxCollected: number;
    transactionCount: number;
  };
  byState: Array<{
    state: string;
    sales: number;
    taxCollected: number;
  }>;
} | null> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - cannot generate tax report");
    return {
      period: { startDate, endDate },
      summary: {
        totalSales: 0,
        taxableSales: 0,
        nonTaxableSales: 0,
        totalTaxCollected: 0,
        transactionCount: 0,
      },
      byState: [],
    };
  }

  try {
    // Check cache first (1 hour TTL)
    const cacheKey = `taxreport:${startDate}:${endDate}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      logger.info("Returning cached tax report", { startDate, endDate });
      return cached;
    }

    logger.info("Generating sales tax report", { startDate, endDate });

    let totalSales = 0;
    let totalTaxCollected = 0;
    let taxableSales = 0;
    let nonTaxableSales = 0;
    const stateMap = new Map<string, { sales: number; tax: number }>();
    let totalTransactionCount = 0;

    // Type guard to check if response contains order objects or just IDs
    const isOrderObject = (item: any): item is OrderObject => {
      return item && typeof item === 'object' && ('amount' in item || 'sales_tax' in item);
    };

    // Pagination: fetch all pages with max 100 records per page
    // TaxJar uses 1-based pagination
    let page = 1;
    let hasMorePages = true;

    // TODO: Add bounded concurrency (p-limit) for showOrder calls when processing ID-only responses
    while (hasMorePages) {
      const ordersResponse = await taxjar.listOrders({
        from_transaction_date: startDate,
        to_transaction_date: endDate,
        per_page: '100',
        page: String(page),
      });

      // Handle empty response
      if (!ordersResponse?.orders || ordersResponse.orders.length === 0) {
        logger.info("No more orders to fetch", { page, startDate, endDate });
        hasMorePages = false;
        break;
      }

      const orders = ordersResponse.orders;
      totalTransactionCount += orders.length;

      // Check first item to determine response type
      const firstItem = orders[0];

      if (typeof firstItem === 'string') {
        // Response contains transaction IDs - need to fetch details for each
        logger.info("Processing transaction IDs", { count: orders.length, page });
        
        for (const transactionId of orders as string[]) {
          try {
            const orderDetails = await taxjar.showOrder(transactionId);
            const order = orderDetails.order;
            
            const orderAmount = order?.amount || 0;
            const orderTax = order?.sales_tax || 0;
            const orderState = order?.to_state || "UNKNOWN";

            totalSales += orderAmount;
            totalTaxCollected += orderTax;

            if (orderTax > 0) {
              taxableSales += orderAmount;
            } else {
              nonTaxableSales += orderAmount;
            }

            // Aggregate by state
            const stateData = stateMap.get(orderState) || { sales: 0, tax: 0 };
            stateData.sales += orderAmount;
            stateData.tax += orderTax;
            stateMap.set(orderState, stateData);
          } catch (orderError) {
            logger.error("Failed to fetch order details", { transactionId, error: orderError });
          }
        }
      } else if (isOrderObject(firstItem)) {
        // Response contains full order objects
        logger.info("Processing order objects", { count: orders.length, page });
        
        for (const order of orders as unknown as OrderObject[]) {
          try {
            const orderAmount = order?.amount || 0;
            const orderTax = order?.sales_tax || 0;
            const orderState = order?.to_state || "UNKNOWN";

            totalSales += orderAmount;
            totalTaxCollected += orderTax;

            if (orderTax > 0) {
              taxableSales += orderAmount;
            } else {
              nonTaxableSales += orderAmount;
            }

            // Aggregate by state
            const stateData = stateMap.get(orderState) || { sales: 0, tax: 0 };
            stateData.sales += orderAmount;
            stateData.tax += orderTax;
            stateMap.set(orderState, stateData);
          } catch (orderError) {
            logger.error("Failed to process order", { 
              orderId: order?.transaction_id || 'unknown', 
              error: orderError 
            });
          }
        }
      } else {
        logger.warn("Unexpected order format in response", { 
          firstItemType: typeof firstItem,
          page 
        });
      }

      // Check if there are more pages (if we got less than 100, we're done)
      if (orders.length < 100) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    // Build state breakdown
    const byState = Array.from(stateMap.entries()).map(([state, data]) => ({
      state,
      sales: data.sales,
      taxCollected: data.tax,
    }));

    const report = {
      period: { startDate, endDate },
      summary: {
        totalSales,
        taxableSales,
        nonTaxableSales,
        totalTaxCollected,
        transactionCount: totalTransactionCount,
      },
      byState,
    };

    // Cache for 1 hour (3600 seconds)
    await cache.set(cacheKey, report, 3600);

    logger.info("Sales tax report generated successfully", {
      startDate,
      endDate,
      transactionCount: report.summary.transactionCount,
      totalTax: totalTaxCollected,
      pagesProcessed: page + 1,
    });

    return report;
  } catch (error) {
    logger.error("Failed to generate sales tax report", { error, startDate, endDate });
    return null;
  }
}

/**
 * Request AutoFile sales tax returns - TaxJar AutoFile is managed through the TaxJar dashboard
 * 
 * IMPORTANT LIMITATIONS:
 * - TaxJar AutoFile is managed through the TaxJar dashboard, not via API
 * - This function logs the filing request but requires manual approval in TaxJar
 * - This is NOT automatic filing - it only records the request for tracking purposes
 * - Actual filing requires an active TaxJar AutoFile subscription and dashboard configuration
 * - Manual verification is required in the TaxJar dashboard to complete filing
 * 
 * @param period - Filing period in format 'YYYY-MM' or 'YYYY-Q#'
 * @param states - Array of state codes to file for (e.g., ['FL', 'CA'])
 * @returns false to indicate manual verification is needed in TaxJar dashboard
 */
export async function autoFileSalesTax(
  period: string,
  states: string[]
): Promise<boolean> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - cannot auto-file");
    return false;
  }

  try {
    logger.info("AutoFile requested - checking subscription status", { period, states });

    // Check if AutoFile is enabled for the account
    // Note: TaxJar API doesn't have a direct "check AutoFile status" endpoint
    // In production, this would be configured in your TaxJar account settings
    
    // Attempt to retrieve filing information for the period
    // This is a best-effort approach since TaxJar's AutoFile is managed through their dashboard
    for (const state of states) {
      try {
        // Log the filing attempt
        logger.info("Initiating AutoFile for state", {
          period,
          state,
          note: "AutoFile is managed through TaxJar dashboard - ensure subscription is active"
        });

        // In a real implementation with AutoFile API access, you would call:
        // await taxjar.createFiling({ period, region: state });
        
        // For now, we log the request as AutoFile is primarily dashboard-managed
        logger.info("AutoFile request logged", {
          period,
          state,
          message: "Filing will be processed by TaxJar AutoFile if subscription is active"
        });
      } catch (stateError) {
        logger.error("Failed to process AutoFile for state", {
          state,
          period,
          error: stateError
        });
      }
    }

    // Since AutoFile is subscription-based and managed through TaxJar's dashboard,
    // we return false to indicate manual verification is needed
    logger.warn("AutoFile requires TaxJar AutoFile subscription and dashboard configuration", {
      period,
      states,
      action: "Please verify filing status in TaxJar dashboard"
    });
    
    return false;
  } catch (error) {
    logger.error("Failed to auto-file sales tax", { error, period, states });
    return false;
  }
}

/**
 * Generate 1099-NEC form data for vendor tax reporting
 * Creates structured data for 1099 forms (not PDF generation)
 * @param vendorId - Unique identifier for the vendor
 * @param taxYear - Tax year for the form (e.g., 2025)
 * @param earnings - Total non-employee compensation amount
 * @param businessName - Payer business name
 * @param businessEIN - Payer Employer Identification Number
 * @returns Structured 1099-NEC form data, or null if generation fails
 */
export async function generate1099(params: {
  vendorId: string;
  taxYear: number;
  earnings: number;
  businessName: string;
  businessEIN: string;
}): Promise<{
  formType: string;
  taxYear: number;
  payer: {
    name: string;
    ein: string;
  };
  recipient: {
    vendorId: string;
  };
  amounts: {
    nonEmployeeCompensation: number;
    federalIncomeTaxWithheld: number;
  };
  generatedAt: string;
  note: string;
} | null> {
  try {
    logger.info("Generating 1099-NEC form data", {
      vendorId: params.vendorId,
      taxYear: params.taxYear,
      earnings: params.earnings,
    });

    // Validate inputs
    if (params.earnings < 0) {
      logger.error("Invalid earnings amount for 1099", { earnings: params.earnings });
      return null;
    }

    if (params.taxYear < 2020 || params.taxYear > new Date().getFullYear() + 1) {
      logger.error("Invalid tax year for 1099", { taxYear: params.taxYear });
      return null;
    }

    // Generate 1099-NEC form data structure
    const form1099 = {
      formType: "1099-NEC",
      taxYear: params.taxYear,
      payer: {
        name: params.businessName,
        ein: params.businessEIN,
      },
      recipient: {
        vendorId: params.vendorId,
      },
      amounts: {
        nonEmployeeCompensation: params.earnings,
        federalIncomeTaxWithheld: 0, // Typically 0 for 1099-NEC unless backup withholding applies
      },
      generatedAt: new Date().toISOString(),
      note: "This is structured form data. Consult with a tax professional for filing requirements.",
    };

    logger.info("1099-NEC form data generated successfully", {
      vendorId: params.vendorId,
      taxYear: params.taxYear,
      formType: form1099.formType,
    });

    return form1099;
  } catch (error) {
    logger.error("Failed to generate 1099 form data", {
      error,
      vendorId: params.vendorId,
    });
    return null;
  }
}
