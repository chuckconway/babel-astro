import React, { useId, useMemo } from 'react';
import type { VegaLiteProps } from 'react-vega';
import VegaChartClient from './VegaChartClient';

export type VegaChartProps = {
  spec?: VegaLiteProps['spec'];
  ariaLabel?: string;
  caption?: string;
  className?: string;
  /** Optional tabular data for an accessible fallback (visually hidden). */
  tableData?: Array<Record<string, string | number>>;
  tableCaption?: string;
  /** If provided, JSON string for the Vega-Lite spec; used when embedding via remark transform. */
  specJson?: string;
};

export default function VegaChart({ spec, ariaLabel, caption, className, tableData, tableCaption, specJson }: VegaChartProps) {
  const figcapId = useId();
  const label = ariaLabel || (typeof caption === 'string' ? caption : 'Chart');

  // Ensure stable spec reference; avoids rerenders on MDX hydration.
  const stableSpec = useMemo(() => {
    if (spec) return spec;
    if (specJson) {
      try {
        return JSON.parse(specJson);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [spec, specJson]);

  return (
    <VegaChartClient
      spec={stableSpec}
      specJson={specJson}
      ariaLabel={label}
      caption={caption}
      className={className}
      tableData={tableData}
      tableCaption={tableCaption}
    />
  );
}


