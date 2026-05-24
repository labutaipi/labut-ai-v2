import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { DashboardContent } from "../../../features/dashboard/components/dashboard-content";

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(orpc.user.me.queryOptions({ input: {} }));
  const user = queryClient.getQueryData(
    orpc.user.me.queryOptions({ input: {} }).queryKey,
  ) as { segmentSlug?: string | null; citySlug?: string | null } | undefined;

  if (user?.segmentSlug && user?.citySlug) {
    await queryClient.prefetchQuery(
      orpc.trends.get.queryOptions({
        input: {
          segmentSlug: user.segmentSlug as string,
          citySlug: user.citySlug as string,
        },
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
