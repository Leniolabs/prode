'use client'
import React from "react";
import { User } from "@/generated/prisma";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import {
  Layout,
  Container,
  Card,
  CardContent,
} from "@/layout";
import { useRequireSession } from "@/hooks";
import { Button } from "@/components/common/Button";
import { Toggle } from "@/components/common/Toggle";
import {
  Form,
  FormInput,
  FormSection,
  FormSectionContent,
  FormFooter,
} from "@/components/common/Form";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/common/Form/FormError";
import { formError } from "@/utils/errors";
import { Meta } from "@/components/common/Meta";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";
import styles from "./new-prode.module.scss";

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
    <Layout dark>
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
        prodeEnd={props?.prodeEnd}
      >
        <Button variant="secondary" href="/rooms">
          {i18n.buttonLabelGoToMyProde}
        </Button>
      </WelcomeBar>
      <Container narrow className={styles.contentContainer}>
        <Card title={i18n.createTitle} className={styles.titleCard}>
          <CardContent>
            <Form>
              <FormSection className={styles.fullSection}>
                <div className={styles.sectionHeading}>{i18n.createGeneralTitle}</div>
                <FormSectionContent>
                  <FormInput
                    className={styles.compactField}
                    label={i18n.createNameLabel}
                    type="string"
                    placeholder="Nuevo Prode 1"
                    value={form.name}
                    onChange={handleChange("name") as (v: string) => void}
                    error={roomNameError ? "Name already taken" : ""}
                  />
                  <FormInput
                    className={styles.compactField}
                    label={`${i18n.createPasswordLabel} ${i18n.createPasswordLegend}`}
                    type="string"
                    inputType="password"
                    value={form.password}
                    onChange={handleChange("password") as (v: string) => void}
                  />
                  <FormInput
                    className={styles.compactField}
                    label={`${i18n.createDomainLabel} ${i18n.createDomainLegend}`}
                    type="string"
                    placeholder="domain.com"
                    value={form.emailDomain}
                    onChange={handleChange("emailDomain") as (v: string) => void}
                  />
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>{i18n.createPublicLabel}</span>
                    <div className={styles.toggleGroup}>
                      <span>No</span>
                      <Toggle
                        ariaLabel={i18n.createPublicLabel}
                        value={form.public}
                        onChange={handleChange("public") as (v: boolean) => void}
                      />
                      <span>Si</span>
                    </div>
                  </div>
                </FormSectionContent>
              </FormSection>

              <hr className={styles.divider} />

              <FormSection className={styles.fullSection}>
                <div className={styles.sectionHeading}>{i18n.createPointsTitle}</div>
                <FormSectionContent>
                  <FormInput
                    className={styles.pointsField}
                    label={i18n.createPointsResultLabel}
                    type="number"
                    inline
                    value={form.pointsWinner}
                    onChange={handleChange("pointsWinner") as (v: number) => void}
                  />
                  <FormInput
                    className={styles.pointsField}
                    label={i18n.createPointsGoalsLabel}
                    type="number"
                    inline
                    value={form.pointsGoals}
                    onChange={handleChange("pointsGoals") as (v: number) => void}
                  />
                  <FormInput
                    className={styles.pointsField}
                    label={i18n.createPointsPenaltisLabel}
                    type="number"
                    inline
                    value={form.pointsPenal}
                    onChange={handleChange("pointsPenal") as (v: number) => void}
                  />
                </FormSectionContent>
              </FormSection>

              <FormFooter className={styles.footer}>
                {error && <FormError>{formError(error)}</FormError>}
                <Button variant="outline" href="/rooms">
                  {i18n.buttonLabelCancel}
                </Button>
                <Button variant="secondary" onClick={handleCreate} disabled={!form.name.trim() || roomNameError === true}>
                  {i18n.buttonLabelSave}
                </Button>
              </FormFooter>
            </Form>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}
