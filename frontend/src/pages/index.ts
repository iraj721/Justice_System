// Auth Pages
export { LoginPage } from "./auth/LoginPage";
export { RegisterPage } from "./auth/RegisterPage";
export { ForgotPasswordPage } from "./auth/ForgotPasswordPage";

// Dashboard Page (only the main dashboard router)
export { DashboardPage } from "./dashboard/DashboardPage";

// Legal Pages
export { TermsPage } from "./legal/TermsPage";
export { PrivacyPage } from "./legal/PrivacyPage";

// Public Pages (landing page)
export { HomePage } from "./public/HomePage";

// Role Pages (all role‑specific views)
export * from "./roles";

// Additional Pages (blockchain explorer, payments, video call)
export { BlockchainViewer } from "./blockchain/BlockchainViewer";
export { FinePayment } from "./payments/FinePayment";
export { VideoCall } from "./video/VideoCall";