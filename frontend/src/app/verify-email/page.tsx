"use client";

import React from "react";
import Link from "next/link";
import { MailCheck, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <MailCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Verify Your Email</h1>
        <p className="text-xs text-slate-400 mb-6">
          We have sent a verification link to your email address. Please click the link to activate your account.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors w-full"
        >
          Proceed to Login <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
