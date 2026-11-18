/**
 * Reinstates the original DCLogic demo form's sent/unsent toggle on the
 * approved static fallback. It does not send or store personal data.
 * Original v22 renderVals: submit => setState({sent:true}),
 * reset => setState({sent:false}).
 */
export function mountV22DemoBooking(scene: HTMLElement): () => void {
  const book = scene.querySelector<HTMLElement>('#book');
  const form = book?.querySelector<HTMLFormElement>('form');
  if (!form) return () => {};
  const success = form.nextElementSibling;
  if (!(success instanceof HTMLElement)) return () => {};
  const reset = success.querySelector<HTMLButtonElement>('button[type="button"]');
  const formDisplay = form.style.display;
  const successDisplay = success.style.display;

  const render = (sent: boolean) => {
    form.style.display = sent ? 'none' : formDisplay;
    success.style.display = sent ? successDisplay : 'none';
    form.hidden = sent;
    success.hidden = !sent;
  };
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    render(true);
  };
  const again = () => {
    form.reset();
    render(false);
  };
  form.addEventListener('submit', submit);
  reset?.addEventListener('click', again);
  render(false);
  return () => {
    form.removeEventListener('submit', submit);
    reset?.removeEventListener('click', again);
    form.hidden = false;
    success.hidden = false;
    form.style.display = formDisplay;
    success.style.display = successDisplay;
  };
}
