import { LoadingState } from "@/components/feedback/LoadingState";

export default function Loading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <LoadingState label="Memuat konten..." />
    </div>
  );
}
