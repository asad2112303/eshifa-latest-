import { Suspense } from "react";
import RequestsView from "@/components/admin/requests-view";
import { TableSkeleton } from "@/components/admin/skeletons";

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <RequestsView />
    </Suspense>
  );
}
