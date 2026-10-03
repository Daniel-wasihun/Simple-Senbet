"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Church, Phone, MapPin, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSenbet } from "@/context/senbet-context";

export default function CreateSchoolPage() {
  const router = useRouter();
  const { createSchool, user } = useSenbet();

  const [name, setName] = useState("");
  const [parishName, setParishName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parishName) {
      setError("Please provide both School Name and Parish Name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createSchool({
        name,
        parishName,
        code: code || name.substring(0, 4).toUpperCase() + "-01",
        phone,
        address,
      });
      // Redirect to school dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-amber-500 items-center justify-center text-blue-950 font-black shadow-lg text-2xl mb-2">
            ✝
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">Setup Your Senbet School</h2>
          <p className="text-xs text-slate-400">የሰንበት ትምህርት ቤትዎን መረጃ እዚህ ያቋቁሙ</p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-base">School Profile & Parish Identity</CardTitle>
            <CardDescription className="text-slate-400">
              Create your Sunday School and establish your Owner / Admin privileges
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
                  Sunday School Name (የሰንበት ትምህርት ቤቱ ስም) *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ደብረ መዊዕ ቅዱስ ጊዮርጊስ ሰንበት ት/ቤት"
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Parish / Church Name (የደብሩ / ቤተክርስቲያን ስም) *
                </label>
                <div className="relative">
                  <Church className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={parishName}
                    onChange={(e) => setParishName(e.target.value)}
                    placeholder="የደብረ መዊዕ ቅዱስ ጊዮርጊስ እና በዓታ ለማርያም ቤተክርስቲያን"
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    School Code (መለያ ኮድ)
                  </label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="DM-01"
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Phone (ስልክ ቁጥር)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 91 123 4567"
                      className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Location / Address (አድራሻ / ከተማ)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="አዲስ አበባ (Addis Ababa), Ethiopia"
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-950/50 border border-blue-800/80 p-3 text-xs text-blue-200 flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Owner Role Assignment</p>
                  <p className="text-[11px] text-blue-300">
                    Administrator: <strong>{user?.full_name || "You"}</strong> (
                    {user?.email || "admin"}).
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-blue-950 font-bold h-11 text-sm shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                {loading ? "Creating School..." : "Finish Setup & Open Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
