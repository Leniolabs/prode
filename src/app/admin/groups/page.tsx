'use client'
import React from "react";
import { Match } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { HeaderMenu } from "@/components/common/Header";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import { Meta } from "@/components/common/Meta";
import { MatchInput } from "@/components/common/MatchInput";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useRequireSession } from "@/hooks";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  CardsContainer,
  GroupsContainer,
} from "@/components/view/Groups";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";

const stageHeaderClass =
  "mb-[18px] [&>:first-child]:bg-brand-green [&>:first-child]:text-white [&>:first-child]:rounded-card [&>:first-child]:text-[25px] [&>:first-child]:font-bold [&>:first-child]:leading-[1.15] [&>:first-child]:pt-[11px] [&>:first-child]:px-5 [&>:first-child]:pb-[13px] [&>:first-child]:normal-case";
const groupCardClass =
  "rounded-card overflow-hidden [&>:first-child]:bg-white [&>:first-child]:text-brand-blue [&>:first-child]:text-[16px] [&>:first-child]:font-bold [&>:first-child]:leading-none [&>:first-child]:min-h-[28px] [&>:first-child]:px-3 [&>:first-child]:pt-[7px] [&>:first-child]:pb-[5px] [&>:first-child]:uppercase";
const matchPairBg = ["bg-[#f6f5f5]", "bg-[#ededed]", "bg-[#e1e1e1]"];

// Reference (system) group match. No per-user prediction data lives here —
// goalsLeft/goalsRight ARE the official result the admin sets.
type UIMatch = Pick<
  Match,
  "date" | "goalsLeft" | "goalsRight" | "id" | "stage" | "filled"
> & {
  countryLeftId: string;
  countryRightId: string;
};

interface AdminGroupsData {
  matches: UIMatch[];
}

const GROUPS = [
  "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E", "GROUP_F",
  "GROUP_G", "GROUP_H", "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
];

export default function AdminGroupsPage() {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  // Admin-only: admin-groups-data returns 403 for non-admins — bounce them.
  const { data } = useQuery<AdminGroupsData | null>({
    queryKey: ["admin-groups-data"],
    queryFn: async () => {
      const res = await fetch("/api/admin-groups-data");
      if (res.status === 401 || res.status === 403) {
        router.replace("/rooms");
        return null;
      }
      return res.json();
    },
    enabled: session.status === "authenticated",
    retry: false,
  });

  const [updating, setUpdating] = React.useState(false);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);

  React.useEffect(() => {
    if (data?.matches) {
      setMatches(data.matches);
      setOriginalMatches(data.matches);
    }
  }, [data?.matches]);

  // The two inputs edit the OFFICIAL result directly (stored in goalsLeft/Right).
  const handleResultChange = React.useCallback(
    (id: string, goalsLeft: number | null, goalsRight: number | null) => {
      setMatches((matches) =>
        matches.map((match) =>
          match.id === id ? { ...match, goalsLeft, goalsRight } : match
        )
      );
    },
    []
  );

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      return (
        originalMatch.goalsLeft !== match.goalsLeft ||
        originalMatch.goalsRight !== match.goalsRight
      );
    });
  }, [originalMatches, matches]);

  const isModified = !!differentMatches.length;

  const formattedGroupsTitle = React.useMemo(() => {
    const title = i18n.groupsTitle.toLowerCase();
    return title.charAt(0).toUpperCase() + title.slice(1);
  }, [i18n.groupsTitle]);

  const handleSave = React.useCallback(() => {
    setUpdating(true);
    axios
      .post("/api/admin/groups", {
        matches: differentMatches
          .map((match) => ({
            id: match.id,
            goalsLeft: match.goalsLeft,
            goalsRight: match.goalsRight,
          }))
          .filter(
            (match) =>
              (match.goalsLeft || match.goalsLeft === 0) &&
              (match.goalsRight || match.goalsRight === 0)
          ),
      })
      .then(() => {
        setOriginalMatches(matches);
        setUpdating(false);
      });
  }, [differentMatches, matches]);

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout dark className="relative overflow-hidden before:hidden">
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
      >
        <div className="shrink-0 [&_div:has(>img)]:!h-[46px] [&_div:has(>img)]:!w-[46px] [&_div:has(>img)_img]:!h-[46px] [&_div:has(>img)_img]:!w-[46px] max-[640px]:[&_div:has(>img)]:!h-[40px] max-[640px]:[&_div:has(>img)]:!w-[40px] max-[640px]:[&_div:has(>img)_img]:!h-[40px] max-[640px]:[&_div:has(>img)_img]:!w-[40px]">
          <HeaderMenu compact />
        </div>
      </WelcomeBar>

      <Container full>
        <GroupsContainer full>
          <ContainerHeader
            sticky
            className={stageHeaderClass}
            title={formattedGroupsTitle}
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
          <CardsContainer gridArea="matches">
            {GROUPS.map((group) => (
              <Card
                key={group}
                className={groupCardClass}
                title={i18n[group as keyof typeof i18n]}
              >
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match, index) => (
                      <MatchInput
                        key={match.id}
                        className={matchPairBg[Math.floor(index / 2)]}
                        date={new Date(match.date)}
                        countryLeftId={match.countryLeftId}
                        countryRightId={match.countryRightId}
                        userGoalsLeft={match.goalsLeft}
                        userGoalsRight={match.goalsRight}
                        onChange={(leftGoals, rightGoals) =>
                          handleResultChange(match.id, leftGoals, rightGoals)
                        }
                      />
                    ))}
                </CardContent>
              </Card>
            ))}
          </CardsContainer>
        </GroupsContainer>
      </Container>
      <Footer>
        <LocaleSelect />
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
