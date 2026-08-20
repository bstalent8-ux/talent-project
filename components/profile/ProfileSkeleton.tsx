import styles from "./ProfileSkeleton.module.css";

/**
 * Loading fallback for /model/[handle], /ugc/[handle], /talent/[handle] —
 * rendered automatically by Next.js while each route's async page.tsx is
 * still awaiting loadTalentProfile(). No props, no client JS: it's a plain
 * server component that only reads theme-aware CSS custom properties.
 */
export default function ProfileSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.hero} />
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.main}>
            <div className={`${styles.block} ${styles.statsRow}`} />
            <div className={`${styles.block} ${styles.tabsRow}`} />
            <div className={`${styles.block} ${styles.gridBlock}`} />
            <div className={`${styles.block} ${styles.sideBlockTall}`} />
            <div className={`${styles.block} ${styles.sideBlockTall}`} />
          </div>
          <div className={styles.sidebar}>
            <div className={`${styles.block} ${styles.sideBlockTall}`} />
            <div className={`${styles.block} ${styles.sideBlock}`} />
            <div className={`${styles.block} ${styles.sideBlock}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
