import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import YouTubeBackground from '@/components/youtube-background';

export default function LoginError() {
  // Add class to body to indicate video background
  useEffect(() => {
    document.body.classList.add('has-video-bg');
    return () => document.body.classList.remove('has-video-bg');
  }, []);
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const reason = params.get('reason') || 'unknown';
  const debugData = params.get('debug');

  let parsedDebug: any = null;
  if (debugData) {
    try {
      parsedDebug = JSON.parse(decodeURIComponent(debugData));
    } catch (e) {
      console.error('Failed to parse debug data:', e);
    }
  }

  const errorMessages: Record<string, {
    title: string;
    description: string;
    whatHappened: string;
    howToFix: string[];
    canRetry: boolean;
  }> = {
    auth_failed: {
      title: "Authentication Failed",
      description: "We encountered an error during the sign-in process.",
      whatHappened: "The authentication service was unable to verify your identity. This could be due to a temporary network issue or a problem with the authentication provider.",
      howToFix: [
        "Click 'Try Again' below to retry the login",
        "Check your internet connection",
        "Try clearing your browser cookies and cache",
        "If the problem persists, try a different browser"
      ],
      canRetry: true
    },
    no_user: {
      title: "User Not Found",
      description: "We couldn't find your account or create a new one.",
      whatHappened: "After successfully authenticating, we couldn't create or retrieve your user account. This might be due to a database connection issue.",
      howToFix: [
        "Click 'Try Again' - we'll attempt to create your account again",
        "Make sure you're using the same URL you started login from",
        "Enable cookies in your browser (required for login)",
        "Try accessing from the main URL: the-florida-local.replit.app"
      ],
      canRetry: true
    },
    session_failed: {
      title: "Session Error",
      description: "We couldn't establish your session.",
      whatHappened: "Your authentication was successful, but we couldn't create a secure session for you. This is usually a temporary issue.",
      howToFix: [
        "Click 'Try Again' - session creation will be retried automatically",
        "Clear your browser cookies for this site",
        "Make sure third-party cookies are enabled",
        "Try using an incognito/private browsing window"
      ],
      canRetry: true
    },
    network_error: {
      title: "Network Error",
      description: "Unable to connect to the authentication service.",
      whatHappened: "Your browser couldn't reach our servers. This might be due to your internet connection or a temporary server issue.",
      howToFix: [
        "Check your internet connection",
        "Click 'Try Again' in a few seconds",
        "Try refreshing the page",
        "If you're on VPN, try disconnecting it"
      ],
      canRetry: true
    },
    unknown: {
      title: "Login Error",
      description: "An unexpected error occurred during sign-in.",
      whatHappened: "Something went wrong that we didn't anticipate. Don't worry, your data is safe.",
      howToFix: [
        "Click 'Try Again' below",
        "Clear your browser cache and cookies",
        "Try a different browser",
        "Contact support if the problem continues"
      ],
      canRetry: true
    }
  };

  const error = errorMessages[reason] || errorMessages.unknown;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        position: 'relative',
        zIndex: 2,
        background: 'transparent',
        backgroundColor: 'transparent'
      }}
    >
      {/* Video Background - Jacksonville Buildings */}
      <YouTubeBackground youtubeUrl="https://youtu.be/I0qV37ezBJc" overlayOpacity={0.3} />

      <div className="max-w-md w-full mx-4 relative" style={{ zIndex: 20 }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {error.title}
          </h1>

          <p className="text-center text-gray-600 mb-6">
            {error.description}
          </p>

          {/* What Happened Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              What happened?
            </h3>
            <p className="text-sm text-gray-700">
              {error.whatHappened}
            </p>
          </div>

          {/* How to Fix Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              How to fix this:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              {error.howToFix.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-gradient-to-r from-[#008B8B] to-[#20B2AA] hover:from-[#006B6B] hover:to-[#008B8B]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Error code: <code className="bg-gray-100 px-2 py-1 rounded">{reason}</code>
            </p>
            {parsedDebug && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Debug Information:</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                  {JSON.stringify(parsedDebug, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
