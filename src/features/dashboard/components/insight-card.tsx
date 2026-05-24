"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTooltip } from "@/components/info-tooltip";
import type { InsightContent } from "@/lib/ai/insights";
import { useGenerateInsight, useLatestInsight } from "@/hooks/use-insights";
import { formatDistanceToNow } from "../lib/format-distance";

const INSIGHT_ITEMS: Array<{
  key: keyof InsightContent;
  label: string;
  icon: string;
}> = [
  { key: "emAlta", label: "O que está em alta", icon: "📈" },
  { key: "oportunidade", label: "Oportunidade detectada", icon: "💡" },
  { key: "acao", label: "Ação recomendada", icon: "🎯" },
];

export default function InsightCard() {
  const { data: insight, isLoading } = useLatestInsight();
  const generate = useGenerateInsight();

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-6 pb-0 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>O que a IA detectou</CardTitle>
              <InfoTooltip text="Gerado pelo Claude (Anthropic) com base nos seus dados de tendências do Google Trends. A IA analisa pico de interesse, média, tendência e buscas em alta para gerar três insights: o que está em alta, uma oportunidade e uma ação recomendada." />
            </div>
            <CardDescription>
              {insight
                ? `Atualizado ${formatDistanceToNow(new Date(insight.generatedAt))}`
                : "Insights baseados nos seus dados de mercado"}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generate.mutate()}
            disabled={generate.isPending || isLoading}
            className="shrink-0 rounded-xl text-xs"
          >
            {generate.isPending ? "Analisando..." : "Atualizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-[var(--line)]"
              />
            ))}
          </div>
        ) : !insight ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-3xl">🤖</span>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Clique em "Atualizar" para gerar seus primeiros insights com IA.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {INSIGHT_ITEMS.map(({ key, label, icon }) => (
              <div
                key={key}
                className="rounded-xl bg-white/40 px-4 py-3 dark:bg-white/5"
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                  {icon} {label}
                </p>
                <p className="text-sm text-[var(--sea-ink)]">
                  {insight.content[key]}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
