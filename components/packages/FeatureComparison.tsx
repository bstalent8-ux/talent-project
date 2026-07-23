"use client";

import type { LandingLang } from "@/app/(main)/home/_components/landing/content";
import type { MarketplacePackage } from "@/features/packages/types";
import styles from "./PackagePricing.module.css";

function prettyKey(key: string) {
  return key.replace(/_/g, " ");
}

export default function FeatureComparison({
  packages,
  lang,
}: {
  packages: MarketplacePackage[];
  lang: LandingLang;
}) {
  const featureKeys = [...new Set(packages.flatMap((pkg) => pkg.features.map((feature) => feature.feature_key)))];
  if (!packages.length || !featureKeys.length) return null;

  return (
    <div className={styles.comparison}>
      <table>
        <thead>
          <tr>
            <th>{lang === "ar" ? "الميزة" : "Feature"}</th>
            {packages.map((pkg) => (
              <th key={pkg.id}>{pkg.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureKeys.map((key) => (
            <tr key={key}>
              <td>{prettyKey(key)}</td>
              {packages.map((pkg) => {
                const feature = pkg.features.find((item) => item.feature_key === key);
                return <td key={`${pkg.id}-${key}`}>{feature?.feature_value ?? "—"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
