"use client";

import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/hooks/use-auth";
import { Mail } from "lucide-react";

const Index = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Hero content */}
      <div className="flex-1 bg-gradient-to-br from-email-primary to-email-secondary p-8 md:p-12 lg:p-16 flex flex-col justify-center">
        <div className="max-w-lg mx-auto md:mx-0 animate-fade-in">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-lg mb-6 mx-auto md:mx-0">
            <Mail className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Email Whisperer
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-8">
            Your private AI assistant for managing emails. Get help analyzing
            tone, drafting responses, and managing your inbox - all with
            complete privacy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={login}
              disabled={isLoading}
              size="lg"
              className="bg-white text-email-primary hover:bg-white/90 font-medium px-6"
            >
              {isLoading ? "Connecting..." : "Sign in with Google"}
            </Button>
          </div>

          <div className="mt-8 text-white/80 text-sm">
            <p>✓ Privacy first - all conversations stored locally</p>
            <p>✓ Analyze email tone and context</p>
            <p>✓ Get help with professional responses</p>
            <p>✓ Secure and private by design</p>
          </div>
        </div>
      </div>

      {/* Right side - Image or feature highlights */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="max-w-md w-full border border-gray-200 rounded-lg overflow-hidden shadow-lg animate-fade-in">
          <div className="bg-gray-50 border-b border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div className="ml-2 text-sm text-gray-600">Email Whisperer</div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex mb-6">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 bg-gray-100 p-3 rounded-lg rounded-tl-none flex-1">
                <p className="text-gray-800">
                  Hello! I can help analyze your emails and suggest appropriate
                  responses. What email would you like me to help with today?
                </p>
              </div>
            </div>

            <div className="flex mb-6 justify-end">
              <div className="mr-4 bg-email-primary p-3 rounded-lg rounded-tr-none flex-1">
                <p className="text-white">
                  I received an email from a client who seems upset about a
                  deadline. How should I respond?
                </p>
              </div>
              <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center text-gray-600 font-medium">
                U
              </div>
            </div>

            <div className="flex">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 bg-gray-100 p-3 rounded-lg rounded-tl-none flex-1">
                <p className="text-gray-800">
                  Based on what you&apos;ve shared, I recommend acknowledging
                  their concern first, then providing a clear explanation about
                  the delay. Would you like me to draft a professional response
                  that maintains the relationship?
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-white border border-gray-200 rounded-l-md py-2 px-3 text-sm"
                disabled
              />
              <button className="bg-email-primary text-white px-4 rounded-r-md flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
