"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/Header";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/hooks/use-auth";
import Link from "next/link";
import useChats from "@/app/hooks/use-chats";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Mail,
  ArrowLeft,
} from "lucide-react";

const Settings = () => {
  const { user, logout, removeAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Settings state
  // const [enableNotifications, setEnableNotifications] = useState(false);
  // const [useGPT4, setUseGPT4] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  // Use the chat hook
  const { deleteAllChats } = useChats();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Header />

        <div className="flex-1 py-8 px-4 relative overflow-hidden bg-secondary">
          <div className="absolute inset-0 bg-privacy-pattern opacity-30"></div>
          <div className="absolute top-20 right-10 w-64 h-64 bg-brand-teal/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-sand/20 rounded-full blur-3xl"></div>

          <div className="container max-w-4xl relative">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-display font-bold">Settings</h1>
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-brand-sand/30 rounded-full">
                  <div className="p-2 bg-brand-sand/50 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-brand-teal" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">
                Privacy is Our Foundation
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Not an afterthought. We built Email Whisperer with privacy as
                the core principle. Your data stays on your device, and you
                remain in complete control at all times.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <Card className="rounded-2xl border border-border relative mindful-shadow">
                  <div className="absolute -top-4 -left-4 bg-brand-teal text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Account Settings
                  </div>

                  <CardContent className="p-8">
                    <Card className="bg-secondary rounded-xl mb-5 border border-border">
                      <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" /> User Information
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-5 pt-3 space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Email
                          </Label>
                          <p className="text-sm font-medium">
                            {user?.email ?? ""}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Name
                          </Label>
                          <p className="text-sm font-medium">
                            {user?.name ?? ""}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-secondary rounded-xl mb-5 border border-border">
                      <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4" /> Security Settings
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-5 pt-3">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-xs text-muted-foreground">
                            End-to-end encryption
                          </p>
                          <div className="w-5 h-5 rounded-full bg-brand-teal flex items-center justify-center">
                            <ShieldCheck className="h-3 w-3 text-white" />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Store data locally only
                          </p>
                          <div className="w-5 h-5 rounded-full bg-brand-teal flex items-center justify-center">
                            <ShieldCheck className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>

                  <CardFooter className="px-8 pb-8 pt-0 justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                        >
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Your Account?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all your account data,
                            including chat history. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              try {
                                removeAccount();
                                toast.success("Account deleted successfully");
                              } catch (error) {
                                toast.error("Failed to delete account");
                                console.error("Error deleting account:", error);
                              }
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" onClick={logout}>
                      Sign Out
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div>
                <Card className="rounded-2xl border border-border relative mindful-shadow mb-6">
                  <div className="absolute -top-4 -left-4 bg-brand-teal text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Privacy Controls
                  </div>

                  <CardContent className="p-8">
                    <Card className="bg-secondary rounded-xl border border-border mb-5">
                      <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <EyeOff className="h-4 w-4" /> Data Control
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-5 pt-3">
                        <div className="mt-3 flex justify-between items-center mb-5">
                          <Label
                            htmlFor="auto-save"
                            className="text-xs font-medium"
                          >
                            Auto-save chat history locally
                          </Label>
                          <Switch
                            id="auto-save"
                            checked={autoSave}
                            onCheckedChange={setAutoSave}
                            className="data-[state=checked]:bg-brand-teal"
                          />
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full text-xs flex items-center gap-1.5 justify-center mt-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Clear All Chat
                              History
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all your chat
                                history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deleteAllChats}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Yes, delete everything
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-xs">
                          Your data never leaves your device
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border relative mindful-shadow">
                  <div className="absolute -top-4 -left-4 bg-brand-teal text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Appearance
                  </div>

                  <CardContent className="p-8">
                    <Card className="bg-secondary rounded-xl border border-border">
                      <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-sm font-medium">
                          Display Options
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-5 pt-3">
                        <div className="flex justify-between items-center">
                          <Label
                            htmlFor="dark-mode"
                            className="text-xs text-muted-foreground"
                          >
                            Dark Mode
                          </Label>
                          <Switch
                            id="dark-mode"
                            checked={theme === "dark"}
                            onCheckedChange={(checked) => {
                              setTheme(checked ? "dark" : "light");
                            }}
                            className="data-[state=checked]:bg-brand-teal"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-sand text-brand-teal-dark">
                <ShieldCheck className="h-3 w-3" /> Privacy First Design
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Email Whisperer • Privacy-Focused AI Email Assistant
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;
