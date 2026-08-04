import type {
  DeliveryMethod,
  PaymentMethod,
} from "./types";

export const DELIVERY_OPTIONS: Record<
  DeliveryMethod,
  { label: string; cost: number; description: string }
> = {
  STANDARD: { label: "Standard Delivery", cost: 49, description: "3 - 5 business days" },
  EXPRESS: { label: "Express Delivery", cost: 99, description: "1 - 2 business days" },
  SAME_DAY: { label: "Same Day Delivery", cost: 149, description: "Same day dispatch" },
  PICKUP: { label: "Store Pickup", cost: 0, description: "Pick up from our store" },
};

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery", description: "Pay in cash when your order arrives" },
  { value: "UPI", label: "UPI", description: "GPay, PhonePe, Paytm and more" },
  { value: "CREDIT_CARD", label: "Credit Card", description: "Visa, Mastercard, Amex" },
  { value: "DEBIT_CARD", label: "Debit Card", description: "Visa, Mastercard, RuPay" },
  { value: "NET_BANKING", label: "Net Banking", description: "All major banks supported" },
  { value: "WALLET", label: "Wallet", description: "Paytm wallet and more" },
];
