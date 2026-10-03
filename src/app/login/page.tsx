"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, KeyRound } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSenbet();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail("admin@senbet.org");
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Emblem */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-blue-950 font-black shadow-lg text-2xl">
              ✝
            </div>
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white font-serif">
            Sign in to Senbet School
          </h2>
          <p className="text-xs text-slate-400">ወደ ሰንበት ትምህርት ቤት መረጃ ቋት ይግቡ</p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-base">Account Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your registered email and password to enter the school dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold h-10"
              >
                {loading ? "Signing in..." : "Sign In to School"}
              </Button>
            </form>

            {/* Quick Demo Fill */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickDemo}
                className="w-full border-dashed border-amber-500/40 text-amber-300 hover:bg-amber-500/10 h-8 text-xs flex items-center justify-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Fill Demo Admin Credentials</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center text-xs text-slate-400">
            <span>New Sunday School?</span>
            <Link
              href="/register"
              className="text-amber-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>Register School</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
