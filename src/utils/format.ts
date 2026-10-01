export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export const itemsLine = (items: { name: string; quantity: number }[]) => items.map((i) => `${i.quantity}× ${i.name}`).join(", ");

export const itemCount = (items: { quantity: number }[]) => items.reduce((n, i) => n + i.quantity, 0);

export const paymentLabel = (o: { paymentMethod: string; paymentStatus: string }) =>
  o.paymentMethod === "cod" ? "COD" : o.paymentStatus === "paid" ? "Paid online" : "Payment pending";

/** Minutes left until an accepted order's prep time runs out (negative = late). */
export const minutesLeft = (acceptedAt: string | null, prepMinutes: number | null) => {
  if (!acceptedAt || !prepMinutes) return null;
  return Math.round((new Date(acceptedAt).getTime() + prepMinutes * 60000 - Date.now()) / 60000);
};

export const PREP_OPTIONS = [10, 15, 20, 30];
