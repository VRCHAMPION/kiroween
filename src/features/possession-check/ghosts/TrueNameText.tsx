import { Fragment } from 'react';
import { segmentText } from '../segments';
import type { TrueName } from './ghost-effects';

/** The real address as plain text, with its suspicious part in bold and underlined. */
export function TrueNameText({ trueName }: { trueName: TrueName }) {
  return (
    <span className="true-name-address">
      {segmentText(trueName.address, trueName.parts).map((segment) => (
        <Fragment key={segment.start}>
          {segment.covering.length > 0 ? <strong className="true-name-part">{segment.text}</strong> : segment.text}
        </Fragment>
      ))}
    </span>
  );
}