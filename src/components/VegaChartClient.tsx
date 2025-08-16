import React, { useId, useMemo } from 'react';
import { VegaLite } from 'react-vega';
import type { VegaLiteProps } from 'react-vega';

export type VegaChartClientProps = {
  spec?: VegaLiteProps['spec'];
  ariaLabel?: string;
  caption?: string;
  className?: string;
  tableData?: Array<Record<string, string | number>>;
  tableCaption?: string;
  specJson?: string;
};

export default function VegaChartClient({ spec, ariaLabel, caption, className, tableData, tableCaption, specJson }: VegaChartClientProps) {
  const figcapId = useId();
  const label = ariaLabel || (typeof caption === 'string' ? caption : 'Chart');

  const stableSpec = useMemo(() => {
    if (spec) return spec;
    if (specJson) {
      try { return JSON.parse(specJson); } catch { return undefined; }
    }
    return undefined;
  }, [spec, specJson]);

  return (
    <figure className={className ?? ''}>
      <div role="img" aria-label={label} aria-describedby={caption ? figcapId : undefined}>
        {stableSpec ? <VegaLite spec={stableSpec} actions={false} renderer="canvas" /> : null}
      </div>
      {caption ? (
        <figcaption id={figcapId} className="mt-2 text-sm text-muted-content">{caption}</figcaption>
      ) : null}
      {Array.isArray(tableData) && tableData.length > 0 ? (
        <div className="sr-only">
          <table>
            {tableCaption ? <caption>{tableCaption}</caption> : null}
            <thead>
              <tr>
                {Object.keys(tableData[0]).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {Object.keys(tableData[0]).map((k) => (
                    <td key={k}>{String(row[k] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </figure>
  );
}


