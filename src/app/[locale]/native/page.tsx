import type {Metadata} from 'next';
import {NativeJourney} from '@/components/journey/NativeJourney';

export const metadata: Metadata = {
  title: 'Chornohora — Native Journey Preview',
  robots: {index: false, follow: false},
};

export default async function NativePreviewPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  return <NativeJourney locale={locale === 'en' ? 'en' : 'uk'} />;
}
