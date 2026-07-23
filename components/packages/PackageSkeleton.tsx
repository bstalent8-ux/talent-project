import styles from "./PackagePricing.module.css";

export default function PackageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.packageGrid} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonLine} style={{ width: "42%" }} />
          <div className={styles.skeletonLine} style={{ width: "76%", height: "1.8rem" }} />
          <div className={styles.skeletonLine} style={{ width: "64%" }} />
          <div className={styles.skeletonLine} style={{ width: "90%" }} />
          <div className={styles.skeletonLine} style={{ width: "82%" }} />
          <div className={styles.skeletonLine} style={{ width: "54%" }} />
        </div>
      ))}
    </div>
  );
}
