"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { trpc } from "@/lib/trpc";
import { ApexFishForm } from "../apex-fish-form";

export default function EditApexFishPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const utils = trpc.useUtils();
  const fish = trpc.admin.apexFish.get.useQuery({ id });
  const update = trpc.admin.apexFish.update.useMutation();
  const [error, setError] = useState<string | null>(null);

  if (fish.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (fish.error) return <p className="text-sm text-destructive">{fish.error.message}</p>;
  if (!fish.data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{fish.data.name}</h1>
        <p className="text-sm text-muted-foreground">
          Editing apex fish. Changes propagate to event creation immediately;
          in-flight sessions keep the snapshot they were started with.
        </p>
      </div>

      <ApexFishForm
        imageRequired={false}
        initial={{
          name: fish.data.name,
          weightMinKg: fish.data.weightMinKg,
          weightMaxKg: fish.data.weightMaxKg,
          assetUrl: fish.data.assetUrl,
        }}
        submitting={update.isPending}
        submitLabel="Save changes"
        error={error}
        onCancel={() => router.push("/apex-fish")}
        onSubmit={async (values) => {
          setError(null);
          try {
            await update.mutateAsync({
              id,
              name: values.name,
              weightMinKg: values.weightMinKg,
              weightMaxKg: values.weightMaxKg,
              ...(values.imageBase64 && values.imageMimeType
                ? {
                    imageBase64: values.imageBase64,
                    imageMimeType: values.imageMimeType,
                  }
                : {}),
            });
            void utils.admin.apexFish.list.invalidate();
            void utils.admin.apexFish.get.invalidate({ id });
            void utils.admin.event.apexCatalog.invalidate();
            router.push("/apex-fish");
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
