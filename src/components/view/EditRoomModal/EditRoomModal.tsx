import { ProdeRoom } from "@prisma/client";
import axios from "axios";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { Button } from "../../common/Button";
import {
  Form,
  FormFooter,
  FormInput,
  FormSection,
  FormSectionContent,
  FormSectionTitle,
} from "../../common/Form";
import { Modal } from "../../common/Modal";

interface EditRoomModalProps {
  room: Pick<
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
  onClose?: () => void;
}

type FormType = {
  name: string;
  password: string;
  public: boolean;
  pointsWinner: number;
  pointsGoals: number;
  pointsPenal: number;
  emailDomain: string;
};

export function EditRoomModal(props: EditRoomModalProps) {
  const i18n = useLocalizedText();

  const [form, setForm] = React.useState<FormType>({
    name: props.room.name || "",
    password: props.room.password || "",
    public: props.room.public,
    pointsWinner: props.room.pointsWinner || 1,
    pointsGoals: props.room.pointsGoals || 3,
    pointsPenal: props.room.pointsPenal || 5,
    emailDomain: props.room.emailDomain || "",
  });

  const handleChange = React.useCallback((key: keyof FormType) => {
    return (value: FormType[keyof FormType]) => {
      setForm((form) => ({ ...form, [key]: value }));
    };
  }, []);

  const handleSave = React.useCallback(() => {
    axios.put(`/api/${props.room.id}/update`, form).then(() => {
      props.onClose?.();
    });
  }, [form, props.room, props.onClose]);

  return (
    <Modal
      title={`${i18n.editTitle}${props.room.name}`}
      onClose={props.onClose}
    >
      <Form>
        <FormSection>
          <FormSectionTitle>{i18n.createGeneralTitle}</FormSectionTitle>
          <FormSectionContent>
            <FormInput
              label={i18n.createNameLabel}
              type="string"
              inline
              value={form.name}
              onChange={handleChange("name")}
            />
            <FormInput
              label={i18n.createPasswordLabel}
              legend={i18n.createPasswordLegend}
              type="string"
              inline
              value={form.password}
              onChange={handleChange("password")}
            />
            <FormInput
              label={i18n.createDomainLabel}
              legend={i18n.createDomainLegend}
              type="string"
              inline
              placeholder="(ex: @leniolabs.com)"
              value={form.emailDomain}
              onChange={handleChange("emailDomain")}
            />
            <FormInput
              label={i18n.createPublicLabel}
              legend={i18n.createPublicLegend}
              type="boolean"
              inline
              value={form.public}
              onChange={handleChange("public")}
            />
          </FormSectionContent>
          <FormSectionTitle>{i18n.createPointsTitle}</FormSectionTitle>
          <FormSectionContent>
            <FormInput
              label={i18n.createPointsResultLabel}
              legend={i18n.createPointsResultLegend}
              type="number"
              inline
              value={form.pointsWinner}
              onChange={handleChange("pointsWinner")}
            />
            <FormInput
              label={i18n.createPointsGoalsLabel}
              legend={i18n.createPointsGoalsLegend}
              type="number"
              inline
              value={form.pointsGoals}
              onChange={handleChange("pointsGoals")}
            />
            <FormInput
              label={i18n.createPointsPenaltisLabel}
              legend={i18n.createPointsPenaltisLegend}
              type="number"
              inline
              value={form.pointsPenal}
              onChange={handleChange("pointsPenal")}
            />
          </FormSectionContent>
        </FormSection>
        <FormFooter>
          <Button onClick={handleSave}>{i18n.buttonLabelSave}</Button>
        </FormFooter>
      </Form>
    </Modal>
  );
}
