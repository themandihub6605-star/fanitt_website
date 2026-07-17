interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  name: string;
  description: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

let scriptLoadPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Opens the Razorpay checkout modal. Resolves with the payment response on
 * success, or rejects if the script fails to load or the user dismisses it.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Failed to load Razorpay checkout — check your internet connection');

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  return new Promise((resolve, reject) => {
    // @ts-expect-error Razorpay is injected globally by the checkout.js script
    const rzp = new window.Razorpay({
      key: keyId,
      amount: options.amount,
      currency: 'INR',
      name: options.name,
      description: options.description,
      order_id: options.orderId,
      prefill: {
        name: options.prefillName,
        email: options.prefillEmail,
        contact: options.prefillContact,
      },
      theme: { color: '#F4511E' },
      handler: (response: RazorpaySuccessResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });

    rzp.open();
  });
}
