export function ProfilIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 18C2.5 13.8579 5.85786 10.5 10 10.5C14.1421 10.5 17.5 13.8579 17.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UsersIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M1.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 4.2A2.8 2.8 0 0114 9.6M15 17c0-2-.6-3.6-1.8-4.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2l6 2.2v4.3c0 3.8-2.5 7.3-6 8.5-3.5-1.2-6-4.7-6-8.5V4.2L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 10l1.8 1.8L13 7.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WfhIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M7 5v10M13 5v10M3 9h14M3 13h14"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="10" cy="9" r="1.5" fill="currentColor" />
      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function WfhAbsensiIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 29 32" fill="none" className={className}>
      <defs>
        <clipPath id="absensi-clip">
          <rect width="29" height="32" rx="10" />
        </clipPath>
      </defs>
      <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAAsTAAALEwEAmpwYAAADf0lEQVR4nO2cPWsUURSGRxGj+FGJQozpYqEgih+of8BCtBS0CIrYOdHdnfOeWS3uD/CDqCAKFvojRDBExEJNFW3ERhsVojYGA4qoK5ctNMHs3p2785GZ94G3yg5z7sPhbuZwZ4OAEEIIIYQQQgghpOQYY1aJ6DkRnQJ0DtBWBTIH4DmAsTAMB1KXDGAI0JcFWHgrr4jghfWQaidXXTL+kZ1aZ9vtIu8FokCJIg3TEj1VhAWiIBHRZymJxte8F4cCxfpIRXTeC0MBQ9Gg6FIlyFu0CL4BGAewr9ForEmloLLiLlnfRVG0I+96lyyunUzJmXQ0xn3vU3kcRe/Lu85KiDbGrM27ziVPP/7d4Yg1HEhdNEes6jZi9RHNEavOk92xs31Ec8Sq7iNWT9EcscJxxOonmiNWuI5YfUTnvTAUMBQNim6VKaUSLaKvADTjON7dbDY3GWNWiMgggDMimKFoeOcngLoVu1hN9Xp9A6CvKRqJ81skPr7oQubJvrgFwKn2ExtFt3qJiN4JeqRWq60G9AlFo6ctI9FxrTiOt4rgF0XDqZsfBh6IYJKi4RIYH9H2eoqGk+hjnqJPUzScRB/yEa2qhyka3aOqR3xEi8hRioZTR9d9RAM4T9FwEv3AU/R9ioaT6AlP0RMUje5xffReDFU9QdFw6ugxH9Hco+GcR36i9TFFwy0iejeJZBHcy7LOkoxJZbAXybXahc32OopGr8HlXkQDuJp1jSURrd+jKNrpIllVd9nPUzSSRQRvVHW4i+RhQN/mUV9pRKN99OpkJ9H273nVRtGg6FYC0aNdRI8WTrTL+bkiiRbBp0ajsbGTaHvWA9DPBRPd/URoUUSLYFJERjpJ/rsuGbFPlIURbecIxRaN9yJ6zZ5KchH8H+F7AFwH9EOuou0p9W4HTbIWLaJfRPRWFMUHgiBYFvQBY8xyAAcB3AYwm7notjAMdZKdoegfInpJRNYFKRKGZr2IXrH3y1R0++bhgH01wJ5aX/gFudg1/e1izCTdHpISx/FeQD9mKjoJ/exk5PTSKID9/ezslIrsVzfrjSBHRPRmJUQD2B7kSKPR3FYR0VqaUDQoulWmpCKa7xnqgmA2JdF8cxZZ/Dihy5wElQrOpiLaZU6C6mTaGLMySItucxJUI9P2aEOQNp3mJChp2uvEU7tdpNrJhBBCCCGEEEIIIUEx+AMUOoxvxR2TYAAAAABJRU5ErkJggg==" width="29" height="32" preserveAspectRatio="xMidYMid meet" clipPath="url(#absensi-clip)" />
    </svg>
  );
}

export function WfhMonitorIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 27 27" fill="none" className={className}>
      <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE30lEQVR4nO2dS4scVRTHT0xQUVR8b+JGNOhC9AuE4BvURUA65Asobnox3fX/VzUI130YVz4zX8BECLpI/ACuRAgGEcZFspj4yIiCMQYD6rTcTHWsuanqeXVX3VN1/vBfpOvWcO795Z5bVaceIiaTyWQy7UIk9wP4lOQfJMdm1mk/5qeyLDtwAwbJ3yIIbNxxewb7JZ8ZTQdj5nWf9DPE0hSj8WWJIAgz/7cBYVw2IIzLBoRx2YAwLhsQ6gVy+vqJi2knV0HOzAOIwdihBoPBIzMHstNgTOsyIJGpdUAAvEZyFcBPaZq+KsrUKiC9Xm8vyR8nsQC4KCJ7RJFaBQTAs2E8WZY9KorUNiAflMR0VBSpNUCcc7f4dSOMB8CiKFJrgKRp+lxZPAC+FEVqDRCSH1YAueqc2ydK1AogvV5vL4BLVTElSfKMKFErgKQV6aowS94UJWoFEN6crsL6/5IokXogvfWTwdVgRrwdxHVOlEg9EADPBzH8DOAuAH8XfvtnOBzeKQrUBiAfBbPjvbxj54LfD4oCqQbSK09Xh/KOLQW/D0WBVANJkuSFMF15SH6bP7IKtn0iCqQaCMmPy9KVlz/3CGK7IAqkFkhvSroqbP+zuH04HD4kkUstEJIvVqWrifx1rADYKxK51AIBcLwqXRXaLAZt3pHIpRKIc27ftHRV6NzRIL7TErlUAuEW0pWXrxYG0H6NvaSrEgi2kK4KbX/RVNJVB8SnKwSDXJauJiq5GzDqkq46IEmSvLSVdDWRX8g1lXTnDmSr++3C70/roL83aycl3Xy/lXnH3zogmJKuvEaj0YPbLelmWfYYgCs1/GdqHZAfpqWrQgwXivulafp0VVvn3K0AztYBo1VAAFwk+bJsQQBOBPu/MaXtsbpgNAIkBgEYBjCPV7Q7BODfoO2ZOs9dugLkYDDI34RtBoPBA8X7gnOvjkajh+uMtRNAnHN3bFbSBfBZ0Je1Ju6e7wSQzUq6AN4q6cu70oC6BGSprKRL8kl/KBz041vn3O0NxdkNICgp6fb7/dvCQ1wAf6Vp+lRTcXYGSBKUdAGc92kpjN+nrybj7AwQt35RMkxNa8G/P286zs4AKSvpBjPjUt2HuGXqGpDFirjXYqm3dwoIby7pTmbHMYlEnQKSBSXdHMZZf0FRIlGngIjInuCx6auj0egJiUhdAyL+coh/ODT3YYlMnQMSuwxIZDIgkcmAtB2IvcAssheY+ZKn/8O7iKvLML6Yxwwxc/42IIzLBoRx2YAwLhsQztQrSZK8nr/gwPswyWUDwmZgLCws3BceZWVZdu92bu42IJyN/cyoOvQF0DMgrNc+RVUB6ff7dxsQxgMkTdN7DAhrB1JZgyF5xICwdi/7BbxkUb8/f8TCgLB+r/gF3K8Z+bpxZDswDAjjswFhfEDsw5KMwwB+90BONR2ImRMgJ/xRwAH7ODEbt39fy42qbP7F6JP+W6xNB8bu+XL+NLGVyE0mveKcU0XT/VMnGpD5Kr+U4Eh+R/JaBIvpeBNfy2N1067kqhSAx/OHMccaDeC874O0Qf7NCgC+b3pQuXsv+zdHiHaRTCIYzPGMPBDtIvl1BAM5noUBfCXaFb4WXLMBXBHtanoQOWOLdjU9gDQgG9X0ANKAbFTTA0gDslFNDyANyEY1PYBUBuQ/uCaEUs4UcaYAAAAASUVORK5CYII=" x="0" y="0" width="27" height="27" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
