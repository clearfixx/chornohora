import {getV22SourceScene} from '@/lib/v22-source-scene';

export default function SourceScenePage() {
  const {html, inlineCss} = getV22SourceScene();
  return (
    <>
      <link rel="stylesheet" href="/legacy/styles.css" />
      <style dangerouslySetInnerHTML={{__html: inlineCss}} />
      <div
        data-v22-source-scene=""
        dangerouslySetInnerHTML={{__html: html}}
      />
    </>
  );
}
