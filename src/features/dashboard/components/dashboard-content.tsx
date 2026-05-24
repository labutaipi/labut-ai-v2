"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TrendChart from "@/features/dashboard/components/trend-chart";
import KpiCard from "@/components/dashboard/KpiCard";
import RelatedQueries from "@/components/dashboard/RelatedQueries";
import RegionMap from "@/components/dashboard/RegionMap";
import TopicsBadges from "@/components/dashboard/TopicsBadges";
import InsightCard from "@/components/dashboard/InsightCard";
import BusinessCard from "@/components/dashboard/BusinessCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCityBySlug } from "@/lib/cities";
import { getSegmentBySlug } from "@/lib/segments";
import { useUser } from "@/hooks/use-user";
import {
  useTrends,
  useTrendsByRegion,
  useTrendTopics,
} from "@/features/dashboard/hooks/use-trends";
import { DashboardSkeleton } from "./dashboard-skeleton";

type TimelineEntry = {
  date?: string;
  values?: Array<{ query?: string; value?: string; extracted_value?: number }>;
};

export function DashboardContent() {
  const router = useRouter();

  const { data: user, isLoading: userLoading } = useUser();

  const trendsInput =
    user?.segmentSlug && user?.citySlug
      ? { segmentSlug: user.segmentSlug, citySlug: user.citySlug }
      : null;

  const { data: trends, isLoading: trendsLoading } = useTrends(trendsInput);
  const { data: byRegion } = useTrendsByRegion(trendsInput);
  const { data: topics } = useTrendTopics(trendsInput);

  useEffect(() => {
    if (user && (!user.segmentSlug || !user.citySlug)) {
      router.push("/onboarding");
    }
  }, [user, router]);

  if (userLoading || trendsLoading) return <DashboardSkeleton />;
  if (!user || !user.segmentSlug || !user.citySlug) return null;

  const segment = getSegmentBySlug(user.segmentSlug as any);
  const city = getCityBySlug(user.citySlug as any);

  const geoUsed = trends?.geoUsed as string | undefined;
  const showFallbackWarning =
    geoUsed === "BR-PI" && user.citySlug !== "teresina";

  const timelineData = (trends?.data as any)?.timeline_data ?? [];
  const relatedQueries = (trends?.data as any)?.related_queries?.rising ?? [];

  const values: number[] = timelineData.flatMap(
    (d: TimelineEntry) =>
      d.values?.map(
        (v: { extracted_value?: number }) => v.extracted_value ?? 0,
      ) ?? [],
  );
  const peak = values.length ? Math.max(...values) : 0;
  const avg = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
  const last = values.at(-1) ?? 0;
  const prev = values.at(-2) ?? last;
  const trend = last > prev ? "up" : last < prev ? "down" : "neutral";

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      {/* Header */}
      <div className="mb-8">
        <Badge variant="kicker" className="mb-1">
          Seu painel de mercado
        </Badge>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
          {segment.icon} {segment.label}{" "}
          <span className="text-[var(--sea-ink-soft)]">em {city.label}</span>
        </h1>
        {user.businessName && (
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            {user.businessName}
          </p>
        )}
      </div>

      {showFallbackWarning && (
        <Alert variant="warning" className="mb-6">
          <span className="text-base">ℹ️</span>
          <AlertDescription>
            Exibindo dados do Piauí — sua cidade ainda tem poucos dados para
            análise individual.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Pico de interesse"
          value={`${peak}`}
          subtitle="nos últimos 90 dias"
          color="green"
        />
        <KpiCard
          label="Interesse médio"
          value={`${avg}`}
          subtitle="média do período"
          color="neutral"
        />
        <KpiCard
          label="Tendência atual"
          value={
            trend === "up"
              ? "Em alta"
              : trend === "down"
                ? "Em queda"
                : "Estável"
          }
          subtitle="comparado à semana anterior"
          color={
            trend === "up" ? "green" : trend === "down" ? "red" : "neutral"
          }
          arrow={trend}
        />
      </div>

      {/* Gráfico */}
      <Card className="mb-6 gap-0 py-0">
        <CardHeader className="px-6 pb-0 pt-6">
          <CardTitle>Interesse ao longo do tempo</CardTitle>
          <CardDescription>Últimos 90 dias — escala de 0 a 100</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          {timelineData.length > 0 ? (
            <TrendChart data={timelineData} keywords={segment.keywords} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-[var(--sea-ink-soft)]">
              Nenhum dado disponível para este período.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights de IA */}
      <div className="mb-6">
        <InsightCard />
      </div>

      {/* Por região + Tópicos */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle>Interesse por região</CardTitle>
            <CardDescription>
              Onde as pessoas mais buscam seu segmento
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            <RegionMap data={(byRegion?.data as any) ?? null} />
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle>Tópicos relacionados</CardTitle>
            <CardDescription>Assuntos em alta no seu segmento</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            <TopicsBadges data={(topics?.data as any) ?? null} />
          </CardContent>
        </Card>
      </div>

      {/* Buscas em alta + Presença no Google */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle>O que as pessoas estão buscando</CardTitle>
            <CardDescription>
              Buscas em alta relacionadas ao seu segmento
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {relatedQueries.length > 0 ? (
              <RelatedQueries queries={relatedQueries} />
            ) : (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Nenhuma busca relacionada encontrada.
              </p>
            )}
          </CardContent>
        </Card>

        <BusinessCard businessName={user.businessName} />
      </div>
    </main>
  );
}
