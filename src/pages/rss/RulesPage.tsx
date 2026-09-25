/**
 * RSS Downloader page (/rss/rules)
 *
 * The rule editor used to live in a right-side drawer, which was cramped at
 * every width — now it's a full page: toolbar (back + title) over the
 * master–detail manager (rule list | editor).
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { RssRulesManager } from "@/components/rss/rules/RssRulesManager";
import { Button } from "@/components/ui/button";
import { pollWithBackoff } from "@/hooks/useMainDataSync";
import { flattenFeeds } from "@/pages/rss/FeedTree";

export function RssRulesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: feeds } = useQuery({
    queryKey: ["rss-feeds"],
    queryFn: () => qbtClient.getRssItems(true),
    refetchInterval: pollWithBackoff(60_000),
  });
  const feedNames = flattenFeeds(feeds ?? {})
    .filter((f) => !f.feed.children)
    .map((f) => f.path);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t("Back")}
          onClick={() => void navigate({ to: "/rss" })}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Settings2 className="size-4 text-primary" />
          {t("RSS Downloader")}
        </h2>
      </div>
      <RssRulesManager feedNames={feedNames} />
    </div>
  );
}
