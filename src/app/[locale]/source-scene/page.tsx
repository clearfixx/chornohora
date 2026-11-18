import {getV22SourceScene} from '@/lib/v22-source-scene';

/**
 * Comparison route: original static fallback DOM, no DC runtime or event
 * controllers. It is not the finished interactive migration.
 */
export default function SourceScenePage() {
  const {html, drawerHtml, inlineCss} = getV22SourceScene();
  return (
    <>
      <link rel="stylesheet" href="/legacy/styles.css" />
      <style dangerouslySetInnerHTML={{__html: inlineCss}} />
      <div data-v22-source-scene="" dangerouslySetInnerHTML={{__html: html}} />
      <div data-v22-source-drawer="" dangerouslySetInnerHTML={{__html: drawerHtml}} />
    </>
  );
}
