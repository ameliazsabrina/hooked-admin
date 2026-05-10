"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { trpc } from "@/lib/trpc";
import { ApexFishForm } from "../apex-fish-form";

export default function NewApexFishPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const create = trpc.admin.apexFish.create.useMutation();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New apex fish</h1>
        <p className="text-sm text-muted-foreground">
          Upload an image, name, and weight range. The fish becomes available
          on the events/new picker as soon as it&apos;s saved.
        </p>
      </div>

      <ApexFishForm
        imageRequired
        submitting={create.isPending}
        submitLabel="Create"
        error={error}
        onCancel={() => router.push("/apex-fish")}
        onSubmit={async (values) => {
          if (!values.imageBase64 || !values.imageMimeType) {
            setError("Image is required");
            return;
          }
          setError(null);
          try {
            const created = await create.mutateAsync({
              name: values.name,
              weightMinKg: values.weightMinKg,
              weightMaxKg: values.weightMaxKg,
              imageBase64: values.imageBase64,
              imageMimeType: values.imageMimeType,
            });
            void utils.admin.apexFish.list.invalidate();
            void utils.admin.event.apexCatalog.invalidate();
            router.push(`/apex-fish/${created.id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
      />

      <div className="text-xs text-muted-foreground">
        <Link href="/apex-fish" className="underline">
          ← Back to catalog
        </Link>
      </div>
    </div>
  );
}
