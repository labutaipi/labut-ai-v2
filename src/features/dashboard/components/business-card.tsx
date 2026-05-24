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
import { useBusinessProfile, useSyncBusiness, useConfirmBusiness, useRejectBusiness } from "@/hooks/use-business";
import { formatDistanceToNow } from "../lib/format-distance";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={
            i <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
          }
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm font-semibold text-(--sea-ink)">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function BusinessCard({
  businessName,
}: {
  businessName?: string | null;
}) {
  const { data: profile, isLoading } = useBusinessProfile();
  const sync = useSyncBusiness();
  const confirm = useConfirmBusiness();
  const reject = useRejectBusiness();

  const presencaTooltip = "Fonte: Google Maps via SerpAPI. Buscamos o nome do seu negócio no Google Maps e exibimos o rating público e as avaliações mais recentes dos seus clientes."

  if (!businessName) {
    return (
      <Card className="gap-0 py-0">
        <CardHeader className="px-6 pb-0 pt-6">
          <div className="flex items-center gap-2">
            <CardTitle>Sua presença no Google</CardTitle>
            <InfoTooltip text={presencaTooltip} />
          </div>
          <CardDescription>
            Avaliações e visibilidade do seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-3xl">🗺️</span>
            <p className="text-sm text-(--sea-ink-soft)">
              Informe o nome do seu negócio no perfil para ver seus dados no
              Google Maps.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-6 pb-0 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Sua presença no Google</CardTitle>
              <InfoTooltip text={presencaTooltip} />
            </div>
            <CardDescription>
              {profile
                ? `Sincronizado ${formatDistanceToNow(new Date(profile.syncedAt))}`
                : "Dados públicos do Google Maps"}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sync.mutate()}
            disabled={sync.isPending || isLoading}
            className="shrink-0 rounded-xl text-xs"
          >
            {sync.isPending ? "Buscando..." : "Sincronizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-4">
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-(--line)" />
        ) : !profile ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-3xl">🔍</span>
            <p className="text-sm text-(--sea-ink-soft)">
              Clique em "Sincronizar" para buscar seu negócio no Google Maps.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Banner de confirmação — só exibe enquanto não confirmado */}
            {!profile.confirmed && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40">
                <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                  Este é o seu negócio?
                </p>
                <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
                  Encontramos <strong>{profile.name}</strong> no Google Maps. Confirme para ver os dados completos.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => confirm.mutate()}
                    disabled={confirm.isPending || reject.isPending}
                    className="rounded-lg text-xs"
                  >
                    {confirm.isPending ? "Confirmando..." : "Sim, é meu negócio"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject.mutate()}
                    disabled={confirm.isPending || reject.isPending}
                    className="rounded-lg text-xs"
                  >
                    Não é meu negócio
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-white/40 px-4 py-3 dark:bg-white/5">
              <span className="text-sm font-medium text-(--sea-ink)">
                {profile.name}
              </span>
              {profile.rating && <StarRating rating={profile.rating} />}
            </div>

            {profile.reviewCount != null && (
              <p className="text-xs text-(--sea-ink-soft)">
                {profile.reviewCount} avaliações no Google Maps
              </p>
            )}

            {profile.reviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
                  Avaliações recentes
                </p>
                {profile.reviews
                  .slice(0, 3)
                  .map((review: (typeof profile.reviews)[number]) => (
                    <div
                      key={review.id}
                      className="rounded-xl bg-white/40 px-4 py-3 dark:bg-white/5"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-(--sea-ink)">
                          {review.author}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`text-xs ${i <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="line-clamp-2 text-xs text-(--sea-ink-soft)">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
