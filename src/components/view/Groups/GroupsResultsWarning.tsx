import { ProdeRoom } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Warning } from "../../common/Warning";
import styles from "./Groups.module.scss";

interface GroupsResultsWarningProps {
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

export function GroupsResultsWarning(
  props: React.PropsWithChildren<GroupsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  return (
    <Warning offset className={styles.groupsResultWarning}>
      <div className={styles.indicator}>
        <div className={styles.primary}>+{props.roomConfig.pointsGoals}</div>
        {i18n.groupsExactGoals}
      </div>
      <div className={styles.indicator}>
        <div className={styles.secondary}>+{props.roomConfig.pointsWinner}</div>
        {i18n.groupsCorrectResult}
      </div>
      <div className={styles.indicator}>
        <div className={styles.warning}>+0</div>
        {i18n.groupsIncorrectPrediction}
      </div>
    </Warning>
  );
}
