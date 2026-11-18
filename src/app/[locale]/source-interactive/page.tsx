import {V22SourceInteraction} from '@/components/journey/V22SourceInteraction';
import {getV22SourceScene} from '@/lib/v22-source-scene';

/**
 * Isolated interactive migration harness.
 * Legacy DOM is inserted after hydration to avoid browser HTML repair mismatches.
 * The original v22 source remains untouched.
 */
export default function SourceInteractivePage() {
  const {html, drawerHtml, inlineCss} = getV22SourceScene();
  return (
    <>
      <link rel="stylesheet" href="/legacy/styles.css" />
      <V22SourceInteraction
        html={html}
        drawerHtml={drawerHtml}
        inlineCss={inlineCss}
      />
    </>
  );
}
