import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function AuthNotifications() {
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const reason = params.get("reason");

    if (error && location === "/api/login") {
      let title = "Authentication Error";
      let description = "An error occurred during login. Please try again.";

      switch (error) {
        case "auth_failed":
          title = "Login Failed";
          description = reason
            ? `Authentication failed: ${decodeURIComponent(reason)}`
            : "Unable to authenticate with Replit. Please try again.";
          break;
        case "session_failed":
          title = "Session Error";
          description = reason
            ? `Session creation failed: ${decodeURIComponent(reason)}`
            : "Unable to create your session. Please try logging in again.";
          break;
        case "strategy_not_found":
          title = "Configuration Error";
          description =
            "Authentication is not properly configured for this domain. Please contact support.";
          break;
        default:
          description = reason
            ? decodeURIComponent(reason)
            : "An unexpected error occurred. Please try again.";
      }

      toast({
        title,
        description,
        variant: "destructive",
      });

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location, toast]);

  return null;
}

export function SessionWarning() {
  const { toast } = useToast();

  useEffect(() => {
    const SESSION_WARNING_TIME = 6 * 24 * 60 * 60 * 1000;
    const SESSION_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000;

    const checkSessionExpiry = async () => {
      try {
        const response = await fetch("/api/auth/session-info");
        if (response.ok) {
          const data = await response.json();
          
          if (!data.expires) {
            return;
          }
          
          const expiryTime = new Date(data.expires).getTime();
          const now = Date.now();
          const timeUntilExpiry = expiryTime - now;

          // Show warning if session expires in less than 24 hours
          const WARNING_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
          
          if (timeUntilExpiry > 0 && timeUntilExpiry <= WARNING_THRESHOLD) {
            const hoursLeft = Math.round(timeUntilExpiry / (60 * 60 * 1000));

            toast({
              title: "Session Expiring Soon",
              description: `Your session will expire in approximately ${hoursLeft} hours. Please save your work and log in again to avoid losing access.`,
              variant: "default",
            });
          }
        }
      } catch (err) {
        console.error("Error checking session expiry:", err);
      }
    };

    const interval = setInterval(checkSessionExpiry, 60 * 60 * 1000);
    checkSessionExpiry();

    return () => clearInterval(interval);
  }, [toast]);

  return null;
}
