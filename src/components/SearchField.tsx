"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";

export default function SearchField() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const query = (form.q as HTMLInputElement).value.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} method="GET" action={"/search"}>
      <div className="relative">
        <Input name="q" placeholder="Search" className="pe-10" />
        <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
      </div>
    </form>
  );
}
