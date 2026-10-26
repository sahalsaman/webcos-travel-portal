"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { COUNTRY_PHONE_CODES } from "@/lib/country_currency";

const COUNTRY_CODES = COUNTRY_PHONE_CODES.map((country) => country.phoneCode);

function splitPhone(value: string) {
  const match = value.trim().match(/^(\+\d{1,4})[\s-]*(.*)$/);
  return { code: match?.[1] && (COUNTRY_CODES as readonly string[]).includes(match[1]) ? match[1] : "+91", number: match ? match[2] : value };
}

export function PhoneNumberField({ label, name, value = "", placeholder = "Phone number", required = false, onValueChange }: { label: string; name?: string; value?: string; placeholder?: string; required?: boolean; onValueChange?: (value: string) => void }) {
  const initial = splitPhone(value); const [code, setCode] = useState(initial.code); const [number, setNumber] = useState(initial.number); const full = (nextCode: string, nextNumber: string) => nextNumber.trim() ? `${nextCode} ${nextNumber.trim()}` : "";
  return <div><Label>{label}{required ? " *" : ""}</Label><div className="mt-1.5 flex gap-2"><Select aria-label={`${label} country code`} value={code} onChange={(event) => { setCode(event.target.value); onValueChange?.(full(event.target.value, number)); }} className="w-28 shrink-0"><option value="">Code</option>{COUNTRY_PHONE_CODES.map((item) => <option key={item.phoneCode} value={item.phoneCode}>{item.flag} {item.phoneCode}</option>)}</Select><Input value={number} onChange={(event) => { const next = event.target.value.replace(/[^0-9\s-]/g, ""); setNumber(next); onValueChange?.(full(code, next)); }} inputMode="tel" placeholder={placeholder} required={required} /></div>{name ? <input type="hidden" name={name} value={full(code, number)} /> : null}</div>;
}
