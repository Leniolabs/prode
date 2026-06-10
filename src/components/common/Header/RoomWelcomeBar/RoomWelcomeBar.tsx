import { ProdeRoom, User } from "@/generated/prisma";
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { EditRoomModal } from "../../../view/EditRoomModal";
import { PencilIcon } from "../../Icons";
import { HeaderMenu } from "../HeaderMenu";
import { WelcomeBar } from "../WelcomeBar";

interface RoomWelcomeBarProps {
  id?: string;
  name?: string;
  roomAdmin?: boolean;
  prodeEnd?: string | null;
  room?: Pick<
    ProdeRoom,
    | "id"
    | "name"
    | "emailDomain"
    | "password"
    | "pointsGoals"
    | "pointsPenal"
    | "pointsWinner"
    | "public"
  >;
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points?: number;
    ranking?: number;
  };
}

export function RoomWelcomeBar(
  props: React.PropsWithChildren<RoomWelcomeBarProps>
) {
  const i18n = useLocalizedText();
  const [showRoomModal, setShowRoomModal] = React.useState(false);

  const handleToggleModal = React.useCallback(() => {
    setShowRoomModal(true);
  }, []);
  const handleRoomModalClose = React.useCallback(() => {
    setShowRoomModal(false);
    window.location.reload();
  }, []);

  const hasNav = !!props.children;

  const hasIndicators =
    props.userRanking &&
    (props.userRanking.points || props.userRanking.points === 0) &&
    (props.userRanking.ranking || props.userRanking.ranking === 0);

  // Room pages always show the room name (or nothing). The deadline subtitle
  // from WelcomeBar is a /rooms concept and must never appear here, so we pass
  // an explicit subtitle (an empty fragment when there is no room name).
  const subtitle = props.name ? (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="shrink-0">{i18n.headerRoom}</span>
      <span className="truncate font-bold">{props.name}</span>
      {props.room && props.roomAdmin ? (
        <button
          type="button"
          onClick={handleToggleModal}
          aria-label="Edit room"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          <PencilIcon />
        </button>
      ) : null}
    </span>
  ) : (
    <></>
  );

  return (
    <>
      <WelcomeBar title={i18n.headerTitle} subtitle={subtitle}>
        <div className="flex items-center gap-3 max-[640px]:gap-2">
          {/* Desktop: nav buttons live in the top bar (hidden on mobile,
              where they move to the sticky footer nav below). */}
          {hasNav && (
            <div className="flex items-center gap-1.5 max-lg:hidden [&_a]:h-auto [&_a]:px-[14px] [&_a]:py-1.5 [&_a]:text-sm [&_button]:h-auto [&_button]:px-[14px] [&_button]:py-1.5 [&_button]:text-sm">
              {props.children}
            </div>
          )}
          {hasIndicators && (
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-white max-[640px]:gap-1.5 max-[640px]:px-2 max-[640px]:py-0.5">
              {/* Position: medal icon + value */}
              <span className="flex items-center gap-1 leading-none">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-[#FFCA30] max-[640px]:h-3.5 max-[640px]:w-3.5"
                >
                  <path d="M7.5 2h9a1 1 0 0 1 .92 1.39l-1.7 4A5 5 0 1 1 8.28 7.4l-1.7-4A1 1 0 0 1 7.5 2Zm4.5 6.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm0 1.6 .73 1.48 1.63.24-1.18 1.15.28 1.62L12 13.83l-1.46.76.28-1.62-1.18-1.15 1.63-.24Z" />
                </svg>
                <span className="text-[17px] font-bold tabular-nums max-[640px]:text-[15px]">
                  {props.userRanking?.ranking}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="h-5 w-px shrink-0 bg-white/30 max-[640px]:h-4"
              />
              {/* Points: value + "pts" label */}
              <span className="flex items-baseline gap-1 leading-none">
                <span className="text-[17px] font-bold tabular-nums max-[640px]:text-[15px]">
                  {props.userRanking?.points}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70 max-[640px]:text-[10px]">
                  pts
                </span>
              </span>
            </div>
          )}
          <div className="shrink-0 [&_div:has(>img)]:!h-[46px] [&_div:has(>img)]:!w-[46px] [&_div:has(>img)_img]:!h-[46px] [&_div:has(>img)_img]:!w-[46px] max-[640px]:[&_div:has(>img)]:!h-[40px] max-[640px]:[&_div:has(>img)]:!w-[40px] max-[640px]:[&_div:has(>img)_img]:!h-[40px] max-[640px]:[&_div:has(>img)_img]:!w-[40px]">
            <HeaderMenu
              compact
              position={props.userRanking?.ranking}
              prodePublic={props.userRanking?.prodePublic}
              dark={props.userRanking?.dark}
              background={props.userRanking?.background}
            />
          </div>
        </div>
      </WelcomeBar>

      {hasNav && (
        <>
          {/* Mobile-only: reserve nav-height of space at the bottom of the page
              shell so the fixed nav below never covers the footer or page
              content, and there is NO gap below the footer (the reserved strip
              sits *under* the footer and is fully covered by the nav). Done in
              raw CSS via :has() rather than the body-padding-bottom hack, so it
              self-cleans when this component unmounts and only applies where the
              nav exists. Scoped to the Layout shell (bg-app-gradient or its dark
              variant bg-brand-blue). */}
          <style>{`
            @media (max-width: 1023px) {
              section.bg-app-gradient:has(.prode-mobile-nav),
              section.bg-brand-blue:has(.prode-mobile-nav) {
                padding-bottom: 64px;
              }
            }
          `}</style>
          {/* Mobile: a clean nav fixed to the viewport bottom with the two nav
              buttons as equal-width cells. Hidden on desktop, where the buttons
              live in the top bar. */}
          <div className="prode-mobile-nav fixed bottom-0 left-0 right-0 z-[60] flex w-full gap-2 border-t border-white/10 bg-[#015697] px-3 py-2.5 shadow-[0_-2px_12px_rgba(0,0,0,0.25)] lg:hidden">
            {React.Children.map(props.children, (child) =>
              child == null || child === false ? null : (
                <div className="flex min-w-0 flex-1 [&>*]:flex [&>*]:h-auto [&>*]:w-full [&>*]:!w-full [&>*]:items-center [&>*]:justify-center [&>*]:py-2.5 [&>*]:text-sm">
                  {child}
                </div>
              )
            )}
          </div>
        </>
      )}

      {showRoomModal && props.room && (
        <EditRoomModal room={props.room} onClose={handleRoomModalClose} />
      )}
    </>
  );
}
