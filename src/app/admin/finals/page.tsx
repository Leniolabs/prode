'use client'
import React from "react";
import { Match } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { HeaderMenu } from "@/components/common/Header";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import { Meta } from "@/components/common/Meta";
import {
  Layout,
  Footer,
  Container,
  ContainerHeader,
} from "@/layout";
import { useRequireSession } from "@/hooks";
import { useInterval } from "@/hooks/useInterval";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  getAdminFinalsMatchLooser,
  getAdminFinalsMatchWinner,
} from "@/utils/points";
import { MatchFinalsInput } from "@/components/common/MatchFinalsInput";
import {
  FinalsContainer,
  FinalsBracket,
  BracketsMobileContainer,
} from "@/components/view/Finals";
import {
  Collapsable,
  CollapsableContainer,
} from "@/components/common/Collapsable";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import {
  getFinalsStageGroup,
  getFinalsStageOrder,
  resolveFinalsMatches,
} from "@/utils/finals";
import { useQuery } from "@tanstack/react-query";

type UIMatch = Pick<
  Match,
  | "date"
  | "goalsLeft"
  | "goalsRight"
  | "id"
  | "stage"
  | "filled"
  | "penaltisLeft"
  | "penaltisRight"
> & {
  countryLeftId?: string;
  countryRightId?: string;
};

interface AdminFinalsData {
  matches: UIMatch[];
}

export default function AdminFinalsPage() {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  // Admin-only: admin-finals-data returns 403 for non-admins — bounce them.
  const { data } = useQuery<AdminFinalsData | null>({
    queryKey: ["admin-finals-data"],
    queryFn: async () => {
      const res = await fetch("/api/admin-finals-data");
      if (res.status === 401 || res.status === 403) {
        router.replace("/rooms");
        return null;
      }
      return res.json();
    },
    enabled: session.status === "authenticated",
    retry: false,
  });

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);
  const [updating, setUpdating] = React.useState(false);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);

  React.useEffect(() => {
    if (data?.matches) {
      setMatches(data.matches);
      setOriginalMatches(data.matches);
    }
  }, [data?.matches]);

  const computedMatches = React.useMemo(() => {
    return resolveFinalsMatches(
      matches,
      getAdminFinalsMatchWinner,
      getAdminFinalsMatchLooser
    );
  }, [matches]);

  const handleMatchChange = React.useCallback(
    (id: string) =>
      (value: {
        countryLeftId: string | undefined;
        goalsLeft: number | null;
        countryRightId: string | undefined;
        goalsRight: number | null;
        penaltisLeft?: number | null;
        penaltisRight?: number | null;
      }) => {
        setMatches(
          computedMatches.map((match) =>
            match.id === id
              ? {
                  ...match,
                  countryLeftId: value.countryLeftId,
                  goalsLeft: value.goalsLeft,
                  countryRightId: value.countryRightId,
                  goalsRight: value.goalsRight,
                  penaltisLeft: value.penaltisLeft ?? null,
                  penaltisRight: value.penaltisRight ?? null,
                }
              : match
          )
        );
      },
    [computedMatches]
  );

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      return (
        originalMatch.countryLeftId !== match.countryLeftId ||
        originalMatch.countryRightId !== match.countryRightId ||
        originalMatch.goalsLeft !== match.goalsLeft ||
        originalMatch.goalsRight !== match.goalsRight ||
        originalMatch.penaltisLeft !== match.penaltisLeft ||
        originalMatch.penaltisRight !== match.penaltisRight
      );
    });
  }, [originalMatches, matches]);

  const isModified = !!differentMatches.length;

  const handleSave = React.useCallback(() => {
    setUpdating(true);
    axios
      .post("/api/admin/finals", {
        matches: differentMatches
          .map((match) => ({
            id: match.id,
            countryLeftId: match.countryLeftId,
            countryRightId: match.countryRightId,
            goalsLeft: match.goalsLeft ?? null,
            goalsRight: match.goalsRight ?? null,
            penaltisLeft: match.penaltisLeft ?? null,
            penaltisRight: match.penaltisRight ?? null,
          }))
          .filter((match) => match.countryLeftId && match.countryRightId),
      })
      .then(() => {
        setOriginalMatches(matches);
        setUpdating(false);
      });
  }, [differentMatches, matches]);

  const handleStartFinals = React.useCallback(() => {
    axios.post("/api/admin/finals-start").then(() => {});
  }, []);

  return (
    <Layout dark className="relative overflow-hidden before:hidden">
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
      >
        <div className="flex items-center gap-3 max-[640px]:gap-2">
          <Button variant="secondary" onClick={handleStartFinals}>
            Start Finals
          </Button>
          <div className="shrink-0 [&_div:has(>img)]:!h-[46px] [&_div:has(>img)]:!w-[46px] [&_div:has(>img)_img]:!h-[46px] [&_div:has(>img)_img]:!w-[46px] max-[640px]:[&_div:has(>img)]:!h-[40px] max-[640px]:[&_div:has(>img)]:!w-[40px] max-[640px]:[&_div:has(>img)_img]:!h-[40px] max-[640px]:[&_div:has(>img)_img]:!w-[40px]">
            <HeaderMenu compact />
          </div>
        </div>
      </WelcomeBar>
      <Container full>
        <FinalsContainer full>
          <ContainerHeader
            sticky
            title={i18n.finalsTitle}
            gridArea="matches-header"
          >
            <Button
              variant="transparent"
              disabled={!isModified}
              className="ml-auto"
              onClick={handleSave}
            >
              {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
            </Button>
          </ContainerHeader>
          {/* Desktop: clean bracket tree (admin = editable country pickers). */}
          <FinalsBracket
            matches={computedMatches}
            now={now}
            onChange={handleMatchChange}
            admin
          />
          {/* Mobile: collapsible accordion, mirroring /finals. */}
          <BracketsMobileContainer gridArea="matches">
            <CollapsableContainer>
              {(
                [
                  ["FINALS_16", i18n.FINALS_16],
                  ["FINALS_8", i18n.FINALS_8],
                  ["FINALS_4", i18n.FINALS_4],
                  ["FINALS_2", i18n.FINALS_2],
                  ["FINAL", i18n.FINAL],
                ] as const
              ).map(([group, title]) => (
                <Collapsable key={group} title={title}>
                  {computedMatches
                    .filter((x) => getFinalsStageGroup(x.stage) === group)
                    .sort(
                      (a, b) =>
                        getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage)
                    )
                    .map((match, index) => (
                      <MatchFinalsInput
                        key={match.id}
                        date={new Date(match.date)}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft ?? undefined}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight ?? undefined}
                        penaltisLeft={match.penaltisLeft ?? null}
                        penaltisRight={match.penaltisRight ?? null}
                        onChange={handleMatchChange(match.id)}
                        countryInput
                        order={index + 1}
                      />
                    ))}
                </Collapsable>
              ))}
            </CollapsableContainer>
          </BracketsMobileContainer>
        </FinalsContainer>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
