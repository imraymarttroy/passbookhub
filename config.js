/*
 * Firebase project settings for PassbookHub.
 *
 * These values identify the project; they are not secrets. Access to data is
 * controlled by the Firestore security rules in firestore.rules.
 */
window.BudgetConfig = {
  firebase: {
    apiKey: 'AIzaSyAbj_7RH8S9GZCaGfXBmjcb41NMyGo1IX4',
    authDomain: 'passbookhub-24184.firebaseapp.com',
    projectId: 'passbookhub-24184',
    storageBucket: 'passbookhub-24184.firebasestorage.app',
    messagingSenderId: '509354772013',
    appId: '1:509354772013:web:500dad604ebcb0abea5aa4'
  },
  /* App Check (Fraud Defense / reCAPTCHA Enterprise). The site key is public by design. */
  appCheckSiteKey: '6LeIWA4uAAAAAJFJiukgbE-FOnIo1mg3Vi3z58uK',
  /*
   * Google Pay for the PassbookHub Pro free trial. TEST mode shows Google's test cards and never charges.
   * To take real payments: set environment to 'PRODUCTION', add your merchantId from the Google Pay &
   * Wallet Console, and set gateway / gatewayMerchantId to your payment processor's values.
   */
  googlePay: {
    environment: 'TEST',
    merchantId: '',
    merchantName: 'PassbookHub',
    gateway: 'example',
    gatewayMerchantId: 'exampleGatewayMerchantId',
    currency: 'PHP',
    country: 'PH'
  }
};
