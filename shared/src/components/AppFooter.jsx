import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { getAppLink } from '../utils/appLinks.mjs';
import {
  attachDialogLightDismiss,
  detectInstallPlatform,
  getInstallOnboardingSteps,
  getPwaAppMeta,
  getPwaInstallSnapshot,
  subscribePwaInstall,
  triggerPwaInstall,
} from '../utils/pwaInstall.mjs';

const SSR_PWA_SNAPSHOT = Object.freeze({
  isStandalone: false,
  supportsWebInstall: false,
  hasDeferredPrompt: false,
  canDirectInstall: false,
});

function getClientPwaSnapshot() {
  return getPwaInstallSnapshot();
}

function getServerPwaSnapshot() {
  return SSR_PWA_SNAPSHOT;
}

/**
 * Shared AppFooter — used by IChingNow, TarotNow, TuViNow, TalkWithMe, NoteNow, SpiritNow
 *
 * Props:
 *   colors: ColorTheme (from shared/src/themes/*.js)
 *   appId: 'iching' | 'tarot' | 'tuvi' | 'talkwithme' | 'spiritnow' | 'notenow'
 *   tagline: string — optional custom tagline
 */

export default function AppFooter({
  colors = {},
  appId,
  tagline,
  compact = false,
  supportLabel,
  supportBtnText,
  copyrightText,
}) {
  const year = new Date().getFullYear();

  const accentColor = colors.accent || '#38bdf8';
  const accentSoft = colors.accentSoft || 'rgba(56, 189, 248, 0.14)';
  const borderColor = colors.footerBorder || 'var(--border-subtle, rgba(255, 255, 255, 0.12))';
  const textColor = colors.footerText || 'var(--text-muted, var(--color-ink-muted, rgba(255, 255, 255, 0.65)))';
  const linkColor = colors.footerLink || textColor;
  const footerBg = colors.footerBg || colors.bg || 'transparent';

  const pwaMeta = getPwaAppMeta(appId);
  const pwaState = useSyncExternalStore(
    subscribePwaInstall,
    getClientPwaSnapshot,
    getServerPwaSnapshot,
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const dialogRef = useRef(null);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!pwaMeta || pwaState.isStandalone || !dialogRef.current) return undefined;
    return attachDialogLightDismiss(dialogRef.current);
  }, [pwaMeta, pwaState.isStandalone]);

  const showPwaAction = Boolean(pwaMeta && !pwaState.isStandalone);
  const platform = showPwaAction ? detectInstallPlatform() : 'chromium-or-other';
  const onboardingSteps = showPwaAction
    ? getInstallOnboardingSteps(platform, pwaMeta.shortName)
    : [];

  const handlePwaClick = async () => {
    if (isInstalling) return;
    if (pwaState.canDirectInstall) {
      setIsInstalling(true);
      try {
        const res = await triggerPwaInstall();
        if (res.message) {
          setInstallStatus(res.message);
        }
      } finally {
        setIsInstalling(false);
      }
      return;
    }
    dialogRef.current?.showModal?.();
  };

  const handleDialogClose = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = '';
    }
  };

  return (
    <footer style={{
      position: 'relative',
      zIndex: 10,
      width: '100%',
      marginTop: compact ? 32 : (colors.marginTop || 48),
      padding: compact ? '22px 20px 28px' : '36px 20px 48px',
      borderTop: `1px solid ${borderColor}`,
      background: footerBg,
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 14 : 20,
      }}>
        {/* Contact CTA + Compact PWA Download Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '8px 18px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(14, 165, 233, 0.12) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 28,
            boxShadow: '0 2px 10px rgba(6, 182, 212, 0.08)',
          }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: textColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span>✨</span>
              <span>{supportLabel || 'Hỗ trợ & Góp ý:'}</span>
            </span>

            {appId === 'talkwithme' ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: accentColor,
                padding: '4px 12px',
                borderRadius: 16,
                background: accentSoft,
                border: `1px solid ${accentColor}`,
              }}>
                💬 Hòm thư liên hệ TalkWithMe
              </span>
            ) : (
              <a
                href={getAppLink('/talk/', { DEV: import.meta.env.DEV }, typeof window !== 'undefined' ? window.location : null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '5px 14px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0369a1 0%, #075985 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.35)';
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>💬</span>
                <span>{supportBtnText || 'Liên hệ qua TalkWithMe'}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>→</span>
              </a>
            )}
          </div>

          {showPwaAction && (
            <>
              <style>{`
                dialog.pwa-install-dialog {
                  padding: 0;
                  margin: auto;
                  border: 1px solid rgba(148, 163, 184, 0.28);
                  border-radius: 16px;
                  background: #0f172a;
                  color: #f8fafc;
                  max-width: min(360px, calc(100vw - 32px));
                  width: 100%;
                  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.5);
                }
                dialog.pwa-install-dialog:modal {
                  overscroll-behavior: contain;
                }
                dialog.pwa-install-dialog::backdrop {
                  overflow: hidden;
                  overscroll-behavior: contain;
                  background: rgba(2, 6, 23, 0.66);
                  backdrop-filter: blur(4px);
                }
              `}</style>
              <button
                type="button"
                onClick={handlePwaClick}
                aria-disabled={isInstalling ? 'true' : undefined}
                aria-haspopup={pwaState.canDirectInstall ? undefined : 'dialog'}
                aria-label={`Tải ứng dụng ${pwaMeta.shortName} (PWA)`}
                title={`Cài đặt ứng dụng ${pwaMeta.shortName} về thiết bị`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: linkColor,
                  background: accentSoft,
                  border: `1px solid ${borderColor}`,
                  cursor: isInstalling ? 'wait' : 'pointer',
                  opacity: isInstalling ? 0.72 : 1,
                  transition: 'transform 0.18s ease, border-color 0.18s ease, opacity 0.18s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (isInstalling) return;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = borderColor;
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                <span>Tải App</span>
              </button>

              <span
                role="status"
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                {installStatus}
              </span>

              <dialog
                ref={dialogRef}
                className="pwa-install-dialog"
                {...{ closedby: 'any' }}
                aria-labelledby={dialogTitleId}
                onClose={handleDialogClose}
              >
                <div style={{ padding: '18px 20px', textAlign: 'left' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                  }}>
                    <img
                      src={pwaMeta.icon}
                      alt=""
                      width="36"
                      height="36"
                      style={{
                        borderRadius: 9,
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                      }}
                    />
                    <div>
                      <h2
                        id={dialogTitleId}
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          lineHeight: 1.3,
                        }}
                      >
                        Cài ứng dụng {pwaMeta.shortName}
                      </h2>
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                      }}>
                        Mở nhanh từ màn hình chính như ứng dụng riêng
                      </p>
                    </div>
                  </div>

                  <ol style={{
                    margin: '0 0 16px',
                    paddingLeft: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    color: '#cbd5e1',
                  }}>
                    {onboardingSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>

                  <form method="dialog" style={{ display: 'flex', justifyContent: 'flex-end', margin: 0 }}>
                    <button
                      value="close"
                      autoFocus
                      style={{
                        padding: '6px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        background: 'rgba(56, 189, 248, 0.16)',
                        color: '#e0f2fe',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Đã hiểu
                    </button>
                  </form>
                </div>
              </dialog>
            </>
          )}
        </div>

        {/* Tagline */}
        {tagline && (
          <p style={{
            margin: 0,
            maxWidth: 680,
            fontSize: '0.8125rem',
            lineHeight: 1.6,
            color: textColor,
            textAlign: 'center',
            textWrap: 'pretty',
          }}>
            {tagline}
          </p>
        )}

        {/* Copyright */}
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          color: textColor,
          opacity: 0.85,
          textAlign: 'center',
        }}>
          {copyrightText || `© ${year} vunph.id.vn · Made with ❤️ in Việt Nam`}
        </p>
      </div>
    </footer>
  );
}
