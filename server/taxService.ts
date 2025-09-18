import Taxjar from "taxjar";
import { logger } from "./monitoring";
import { cache } from "./redis";

// Initialize TaxJar client
const taxjar = process.env.TAXJAR_API_TOKEN
  ? new Taxjar({
      apiKey: process.env.TAXJAR_API_TOKEN,
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
    const cacheKey = `taxrate:${country}:${zip}`;
    const cached = await cache.get<TaxRate>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await taxjar.ratesForLocation(zip, {
      city,
      state,
      country,
    });

    const rate: TaxRate = {
      zip: response.rate.zip,
      state: response.rate.state,
      stateRate: response.rate.state_rate,
      countyRate: response.rate.county_rate,
      cityRate: response.rate.city_rate,
      specialDistrictRate: response.rate.special_district_rate,
      combinedRate: response.rate.combined_rate,
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

// Generate sales tax report
export async function generateSalesTaxReport(
  startDate: string,
  endDate: string
): Promise<any> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - cannot generate tax report");
    return null;
  }

  try {
    // This would typically integrate with TaxJar's reporting API
    // For now, return a placeholder structure
    return {
      period: { startDate, endDate },
      summary: {
        totalSales: 0,
        taxableSales: 0,
        nonTaxableSales: 0,
        totalTaxCollected: 0,
      },
      byState: [],
      message: "Full reporting available with TaxJar subscription",
    };
  } catch (error) {
    logger.error("Failed to generate sales tax report", { error });
    return null;
  }
}

// Auto-file sales tax returns (requires TaxJar AutoFile)
export async function autoFileSalesTax(
  period: string,
  states: string[]
): Promise<boolean> {
  if (!taxjar) {
    logger.warn("TaxJar not configured - cannot auto-file");
    return false;
  }

  try {
    // This requires TaxJar AutoFile subscription
    logger.info("AutoFile requested", { period, states });
    
    // In production, this would trigger TaxJar's AutoFile API
    return false; // Placeholder
  } catch (error) {
    logger.error("Failed to auto-file sales tax", { error });
    return false;
  }
}
