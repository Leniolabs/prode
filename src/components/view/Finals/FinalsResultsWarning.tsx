import { ProdeRoom } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Warning } from "../../common/Warning";
import styles from "./Finals.module.scss";

interface FinalsResultsWarningProps {
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

export function FinalsResultsWarning(
  props: React.PropsWithChildren<FinalsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  return (
    <Warning offset className={styles.finalsResultWarning}>
      <div className={styles.indicator}>
        <div className={className(styles.indicatorBox, styles.primary)}>
          +{props.roomConfig.pointsPenal}
        </div>
        {i18n.finalsExactPrediction}
      </div>
      <div className={styles.indicator}>
        <div className={className(styles.indicatorBox, styles.primary)}>
          +{props.roomConfig.pointsGoals}
        </div>
        <div className={className(styles.indicatorBox, styles.secondary)} />
        {i18n.finalsExactGoals} + {i18n.finalsCorrectResult}
      </div>
      <div className={styles.indicator}>
        <div className={className(styles.indicatorBox, styles.primary)}>
          +{props.roomConfig.pointsGoals}
        </div>
        {i18n.finalsExactGoals}
      </div>
      <div className={styles.indicator}>
        <div className={className(styles.indicatorBox, styles.secondary)}>
          +{props.roomConfig.pointsWinner}
        </div>
        {i18n.finalsCorrectResult}
      </div>
      <div className={styles.indicator}>
        <div className={className(styles.indicatorBox, styles.warning)}>+0</div>
        {i18n.finalsIncorrectPrediction}
      </div>
    </Warning>
  );
}
