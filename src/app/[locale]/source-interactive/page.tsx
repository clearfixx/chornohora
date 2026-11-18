import {V22SourceInteraction} from '@/components/journey/V22SourceInteraction';
import {getV22SourceScene} from '@/lib/v22-source-scene';

/**
 * Isolated migration harness, not the production landing page.
 * Original DC scripts are deliberately absent.
 */
export default function SourceInteractivePage() {
  const {html, drawerHtml, inlineCss} = getV22SourceScene();
  return (
    <>
      <link rel="stylesheet" href="/legacy/styles.css" />
      <style dangerouslySetInnerHTML={{__html: inlineCss}} />
      <V22SourceInteraction html={html} drawerHtml={drawerHtml} />
    </>
  );
}
