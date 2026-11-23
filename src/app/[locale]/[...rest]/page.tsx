import {notFound} from 'next/navigation';

/** Ensure unknown paths under /uk and /en reach our localized 404 with HTTP 404. */
export default function UnknownJourneyRoute() {
  notFound();
}
