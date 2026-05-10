// frontend/src/features/payments/FinePayment.tsx
import { useState } from 'react';
import { apiRequest } from '../../shared/services/apiClient';

// Define response type
type PaymentResponse = {
  success: boolean;
  client_secret?: string;
  payment_intent_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  error?: string;
};

export function FinePayment({ token, caseId, amount }: { token: string; caseId: string; amount: number }) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'easypaisa'>('stripe');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const result = await apiRequest<PaymentResponse>('/payments/create', {
        method: 'POST',
        token,
        body: {
          case_id: caseId,
          amount: amount,
          payment_method: paymentMethod,
          mobile_number: mobileNumber || undefined
        }
      });
      
      if (result.success) {
        if (paymentMethod === 'stripe' && result.client_secret) {
          // Dynamic import for Stripe to avoid build issues
          const stripeModule = await import('@stripe/stripe-js');
          const stripe = await stripeModule.loadStripe('pk_test_your_stripe_key');
          if (stripe) {
            const { error } = await stripe.confirmPayment({
              clientSecret: result.client_secret,
              confirmParams: {
                return_url: `${window.location.origin}/app?tab=payment-success`
              }
            });
            if (error) {
              setMessage(`Payment failed: ${error.message}`);
            }
          } else {
            setMessage('Stripe failed to load');
          }
        } else if (paymentMethod === 'easypaisa' && result.order_id) {
          setMessage(`✅ Payment initiated! Complete payment on EasyPaisa app. Order ID: ${result.order_id}`);
        } else {
          setMessage('✅ Payment initiated!');
        }
      } else {
        setMessage(`❌ Payment failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('❌ Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>💰 Pay Fine</h3>
      <p>Amount Due: <strong>PKR {amount.toLocaleString()}</strong></p>
      
      <div className="form-grid">
        <label>Payment Method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
          <option value="stripe">💳 Credit/Debit Card (Stripe)</option>
          <option value="easypaisa">📱 EasyPaisa</option>
        </select>
        
        {paymentMethod === 'easypaisa' && (
          <>
            <label>Mobile Number (EasyPaisa Account)</label>
            <input 
              value={mobileNumber} 
              onChange={(e) => setMobileNumber(e.target.value)} 
              placeholder="03XXXXXXXXX"
            />
          </>
        )}
        
        {message && (
          <div style={{ padding: '12px', background: message.includes('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>
            {message}
          </div>
        )}
        
        <button onClick={handlePayment} disabled={loading} style={{ background: '#10b981', cursor: 'pointer' }}>
          {loading ? 'Processing...' : `Pay PKR ${amount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}