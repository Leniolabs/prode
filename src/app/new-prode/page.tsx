'use client'
import React from "react";
import { User } from "@/generated/prisma";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import { HeaderMenu } from "@/components/common/Header/HeaderMenu";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Layout, Card, CardContent, Footer } from "@/layout";
import { useRequireSession } from "@/hooks";
import { Button } from "@/components/common/Button";
import { Toggle } from "@/components/common/Toggle";
import { Form, FormInput, FormSectionContent } from "@/components/common/Form";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/common/Form/FormError";
import { formError } from "@/utils/errors";
import { Meta } from "@/components/common/Meta";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";

interface NewProdeData {
  userRanking?: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark">;
  registeredProdes: number;
  prodeEnd?: string | null;
}

type FormType = {
  name: string;
  password: string;
  emailDomain: string;
  public: boolean;
  pointsWinner: number;
  pointsGoals: number;
  pointsPenal: number;
};

export default function NewProdePage() {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  const { data: props } = useQuery<NewProdeData>({
    queryKey: ["new-prode-page-data"],
    queryFn: () => fetch("/api/new-prode-page-data").then((r) => r.json()),
    enabled: session.status === "authenticated",
  });

  const [error, setError] = React.useState<string>("");
  const [roomNameError, setRoomNameError] = React.useState<boolean | undefined>(undefined);
  const [form, setForm] = React.useState<FormType>({
    name: "",
    password: "",
    emailDomain: "",
    public: true,
    pointsWinner: 1,
    pointsGoals: 3,
    pointsPenal: 5,
  });

  const checkRoomName = React.useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (name: string) => {
      setRoomNameError(undefined);
      clearTimeout(timeout);
      if (name) {
        timeout = setTimeout(() => {
          axios.get(`/api/check-room-name?name=${name}`).then((response) => {
            const allowed = response.data.allowed as boolean;
            setRoomNameError(!allowed);
          });
        }, 250);
      }
    };
  }, []);

  const handleChange = React.useCallback(
    (key: keyof FormType) => {
      return (value: FormType[keyof FormType]) => {
        if (key === "name") checkRoomName(value as FormType["name"]);
        setForm((form) => ({ ...form, [key]: value }));
      };
    },
    [checkRoomName]
  );

  const handleCreate = React.useCallback(() => {
    axios
      .post("/api/create", form)
      .then((response) => {
        const { id } = response.data;
        if (id) {
          router.push(`/${id}/ranking`);
        }
      })
      .catch((error) => {
        if (error.response.data.error) {
          setError(error.response.data.error);
        } else {
          setError("");
        }
      });
  }, [form, router]);

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout dark className="relative overflow-hidden before:hidden">
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
        prodeEnd={props?.prodeEnd}
      >
        <div className="flex items-center gap-3 max-[640px]:gap-2">
          <div className="shrink-0 [&_div:has(>img)]:!h-[46px] [&_div:has(>img)]:!w-[46px] [&_div:has(>img)_img]:!h-[46px] [&_div:has(>img)_img]:!w-[46px] max-[640px]:[&_div:has(>img)]:!h-[40px] max-[640px]:[&_div:has(>img)]:!w-[40px] max-[640px]:[&_div:has(>img)_img]:!h-[40px] max-[640px]:[&_div:has(>img)_img]:!w-[40px]">
            <HeaderMenu
              compact
              prodePublic={props?.userRanking?.prodePublic}
              dark={props?.userRanking?.dark}
              background={props?.userRanking?.background}
            />
          </div>
        </div>
      </WelcomeBar>

      <main className="relative z-[1] flex-1 w-full max-w-[620px] mx-auto px-4 py-[clamp(12px,3vh,36px)]">
        <Card title={i18n.createTitle} className="self-start [&>:first-child]:text-white">
          <CardContent>
            <Form>
              {/* General section — full width, bypassing FormSection's lg 50% */}
              <div className="w-full flex flex-wrap content-start">
                <div className="text-lg font-bold text-dark-navy px-4 pt-1 pb-0.5 w-full">
                  {i18n.createGeneralTitle}
                </div>
                <div className="[&>div>div]:!mb-[0.6em] w-full">
                  <FormSectionContent>
                    <FormInput
                      label={i18n.createNameLabel}
                      type="string"
                      placeholder="Nuevo Prode 1"
                      value={form.name}
                      onChange={handleChange("name") as (v: string) => void}
                      error={roomNameError ? "Name already taken" : ""}
                    />
                    <FormInput
                      label={`${i18n.createPasswordLabel} ${i18n.createPasswordLegend}`}
                      type="string"
                      inputType="password"
                      value={form.password}
                      onChange={handleChange("password") as (v: string) => void}
                    />
                    <FormInput
                      label={`${i18n.createDomainLabel} ${i18n.createDomainLegend}`}
                      type="string"
                      placeholder="domain.com"
                      value={form.emailDomain}
                      onChange={handleChange("emailDomain") as (v: string) => void}
                    />
                  </FormSectionContent>
                </div>
                <div className="px-4 pb-[0.4em] w-full flex items-center gap-2">
                  <span className="text-lg text-brand-blue flex-1">{i18n.createPublicLabel}</span>
                  <div className="flex items-center gap-2 text-[15px] text-dark-navy">
                    <span>No</span>
                    <Toggle
                      ariaLabel={i18n.createPublicLabel}
                      value={form.public}
                      onChange={handleChange("public") as (v: boolean) => void}
                    />
                    <span>Si</span>
                  </div>
                </div>
              </div>

              <hr className="border-0 border-t border-black/10 my-[0.2em] mx-4 w-[calc(100%-2rem)]" />

              {/* Points section — full width, bypassing FormSection's lg 50% */}
              <div className="w-full flex flex-wrap content-start">
                <div className="text-lg font-bold text-dark-navy px-4 pt-1 pb-0.5 w-full">
                  {i18n.createPointsTitle}
                </div>
                <div className="[&>div>div]:!mb-[1.9em] w-full">
                  <FormSectionContent>
                    <FormInput
                      label={i18n.createPointsResultLabel}
                      legend={i18n.createPointsResultLegend}
                      type="number"
                      inline
                      value={form.pointsWinner}
                      onChange={handleChange("pointsWinner") as (v: number) => void}
                    />
                    <FormInput
                      label={i18n.createPointsGoalsLabel}
                      legend={i18n.createPointsGoalsLegend}
                      type="number"
                      inline
                      value={form.pointsGoals}
                      onChange={handleChange("pointsGoals") as (v: number) => void}
                    />
                    <FormInput
                      label={i18n.createPointsPenaltisLabel}
                      legend={i18n.createPointsPenaltisLegend}
                      type="number"
                      inline
                      value={form.pointsPenal}
                      onChange={handleChange("pointsPenal") as (v: number) => void}
                    />
                  </FormSectionContent>
                </div>
              </div>

              <div className="w-full p-4">
                {error && (
                  <div className="mb-2">
                    <FormError>{formError(error)}</FormError>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <Button variant="outline" href="/rooms">
                    {i18n.buttonLabelCancel}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCreate}
                    disabled={!form.name.trim() || roomNameError === true}
                  >
                    {i18n.locale === "es" ? "Crear" : "Create"}
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer>
        <LocaleSelect />
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
