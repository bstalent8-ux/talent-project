"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";
import styles from "./TrustedBrands.module.css";

export type TrustedBrand = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
};

type Props = {
  label: string;
  ariaLabel: string;
};

let trustedBrandsPromise: Promise<TrustedBrand[]> | null = null;

function loadTrustedBrands() {
  trustedBrandsPromise ??= fetch("/api/public/trusted-brands", {
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) return [];
    return response.json() as Promise<TrustedBrand[]>;
  }).catch(() => []);

  return trustedBrandsPromise;
}

function Skeleton() {
  return (
    <div className={styles.root} aria-hidden="true">
      <span className={styles.labelSkeleton} />
      <div className={styles.skeletonTrack}>
        {Array.from({ length: 6 }).map((_, index) => (
          <span className={styles.skeletonLogo} key={index} />
        ))}
      </div>
    </div>
  );
}

function TrustedBrands({ label, ariaLabel }: Props) {
  const [brands, setBrands] = useState<TrustedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadTrustedBrands().then((items) => {
      if (!cancelled) {
        setBrands(items);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton />;
  if (brands.length === 0) return null;

  return (
    <section className={styles.root} aria-label={ariaLabel}>
      <p className={styles.label}>{label}</p>
      <div className={styles.viewport}>
        <div className={styles.fadeStart} aria-hidden="true" />
        <div className={styles.track}>
          {[0, 1].map((group) => (
            <div className={styles.group} key={group} aria-hidden={group === 1}>
              {brands.map((brand) => {
                const content = brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={group === 0 ? brand.name : ""}
                    width={150}
                    height={64}
                    loading="lazy"
                    sizes="150px"
                    className={styles.logoImage}
                  />
                ) : (
                  <span className={styles.logoText}>{brand.name}</span>
                );

                return brand.website_url ? (
                  <a
                    className={styles.logoItem}
                    href={brand.website_url}
                    key={`${group}-${brand.id}`}
                    tabIndex={group === 1 ? -1 : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                ) : (
                  <span className={styles.logoItem} key={`${group}-${brand.id}`}>
                    {content}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div className={styles.fadeEnd} aria-hidden="true" />
      </div>
    </section>
  );
}

export default memo(TrustedBrands);
