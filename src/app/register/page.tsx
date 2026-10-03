"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useSenbet } from "@/context/senbet-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSenbet();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifiedStep, setVerifiedStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Please fill in all registration fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email, password, fullName);
      // Move to verified / school setup step
      setVerifiedStep(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToCreateSchool = () => {
    router.push("/create-school");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-blue-950 font-black shadow-lg text-2xl">
              ✝
            </div>
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white font-serif">Create Admin Account</h2>
          <p className="text-xs text-slate-400">የሰንበት ትምህርት ቤት አስተዳዳሪ አካውንት መመዝገቢያ</p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl">
          {!verifiedStep ? (
            <>
              <CardHeader>
                <CardTitle className="text-white text-base">Step 1: Admin Registration</CardTitle>
                <CardDescription className="text-slate-400">
                  Register as the school owner/admin to manage your Sunday School
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name (ሙሉ ስም)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="መምህር ተክለ ማርያም"
                        className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@senbet.org"
                        className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password (ቢያንስ 6 ፊደላት)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold h-10 mt-2"
                  >
                    {loading ? "Registering..." : "Create Account & Verify"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-xs text-slate-400">
                <span>Already registered?</span>
                <Link href="/login" className="text-amber-400 hover:underline font-medium">
                  Sign In
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-white text-base">Email Verified Successfully!</CardTitle>
                <CardDescription className="text-slate-400">
                  Welcome, <strong>{fullName}</strong>. Your account is authenticated.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-blue-950/60 border border-blue-800 p-4 text-xs text-blue-200">
                  <div className="flex items-center gap-2 font-semibold text-white mb-1">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    <span>Role Granted: School Owner / Admin</span>
                  </div>
                  <p>
                    You are now ready to set up your Sunday School (ሰንበት ትምህርት ቤት) profile and begin
                    registering classes.
                  </p>
                </div>

                <Button
                  onClick={handleProceedToCreateSchool}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-blue-950 font-bold h-11 text-sm flex items-center justify-center gap-2"
                >
                  <span>Step 2: Create Senbet School</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
