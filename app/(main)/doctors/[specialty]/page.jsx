"use client";
import { useParams } from "next/navigation";

export default function SpecialtyPage() {
  const specialty = useParams();
  return <div>SpecialtyPage: {specialty}</div>;
}
