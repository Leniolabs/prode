"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/common/BrandLogo";
import { useLocalizedText } from "@/locale";

export function OfflineContent() {
  const i18n = useLocalizedText();

  return (
    <section className="offline-page">
      <main className="offline-main">
        <div className="offline-container">
          <section className="offline-intro">
            <span className="offline-badge">{i18n.offlineBadge}</span>
            <h1 className="offline-title">{i18n.offlineTitle}</h1>
            <p className="offline-description">{i18n.offlineDescription}</p>
          </section>

          <section className="offline-panels" aria-label={i18n.offlineActionsTitle}>
            <div className="offline-panel offline-panel-left">
              <h2 className="offline-panel-title">{i18n.offlineActionsTitle}</h2>
              <ul className="offline-list">
                <li>{i18n.offlineActionRetry}</li>
                <li>{i18n.offlineActionSignin}</li>
                <li>{i18n.offlineActionInstall}</li>
              </ul>
            </div>

            <div className="offline-panel offline-panel-right">
              <h2 className="offline-panel-title">{i18n.offlineRetryTitle}</h2>
              <ul className="offline-list">
                <li>{i18n.offlineRetryBody}</li>
              </ul>

              <div className="offline-actions">
                <Link href="/" className="offline-button offline-button-primary">
                  {i18n.offlineButtonHome}
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="offline-button offline-button-secondary"
                >
                  {i18n.offlineButtonRetry}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="offline-footer">
        <BrandLogo />
      </footer>

      <style>{`
        .offline-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          color: #fff;
          font-family: var(--font-poppins), sans-serif;
          background-color: #005596;
          background-image:
            linear-gradient(180deg, #005596 0%, #4597d3 100%),
            url('/bg-trophy.png');
          background-repeat: no-repeat, no-repeat;
          background-position: center center, center 60%;
          background-size: cover, cover;
          background-attachment: fixed, fixed;
        }

        .offline-main {
          flex: 1;
          overflow: hidden;
        }

        .offline-container {
          box-sizing: border-box;
          width: 100%;
          max-width: 1110px;
          margin: 0 auto 200px;
          padding: 92px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        .offline-intro {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .offline-badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.82);
          border-radius: 8px;
          padding: 10px 20px;
          color: #fff;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.2;
        }

        .offline-title {
          margin: 0;
          width: 100%;
          font-size: 50px;
          font-weight: 600;
          line-height: 1.18;
        }

        .offline-description {
          margin: 0;
          width: 100%;
          color: rgba(255, 255, 255, 0.92);
          font-size: 25px;
          line-height: 1.42;
        }

        .offline-panels {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .offline-panel {
          background: rgba(3, 24, 46, 0.74);
          border-radius: 8px;
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(2px);
          padding: 32px 24px;
        }

        .offline-panel-title {
          margin: 0;
          font-size: 25px;
          font-weight: 600;
          line-height: 1.2;
        }

        .offline-list {
          margin: 30px 0 0;
          padding-left: 24px;
        }

        .offline-list li {
          color: rgba(255, 255, 255, 0.92);
          font-size: 25px;
          line-height: 1.58;
        }

        .offline-list li + li {
          margin-top: 18px;
        }

        .offline-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .offline-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 46px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition:
            filter 150ms ease,
            background-color 150ms ease;
        }

        .offline-button:hover {
          filter: brightness(1.05);
        }

        .offline-button-primary {
          background-color: #5fa0d7;
          color: #fff;
        }

        .offline-button-secondary {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.82);
          color: #fff;
        }

        .offline-footer {
          min-height: 76px;
          padding: 12px 32px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          background-image: linear-gradient(90deg, #5bc2a7 0%, #4597d3 100%);
        }

        @media (min-width: 768px) {
          .offline-panels {
            flex-direction: row;
            gap: 28px;
          }

          .offline-panel-left {
            width: calc(58% - 14px);
          }

          .offline-panel-right {
            width: calc(42% - 14px);
          }
        }

        @media (max-width: 640px) {
          .offline-container {
            padding-left: 16px;
            padding-right: 16px;
          }

          .offline-intro {
            gap: 18px;
          }

          .offline-badge {
            font-size: 16px;
          }

          .offline-title {
            font-size: 36px;
          }

          .offline-description {
            font-size: 20px;
          }

          .offline-panel {
            padding: 24px 20px;
          }

          .offline-panel-title {
            font-size: 20px;
          }

          .offline-list li {
            font-size: 20px;
          }

          .offline-footer {
            padding: 12px 16px;
          }
        }
      `}</style>
    </section>
  );
}
