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
  // Original v22 places form and success panel in separate sibling <sc-if> nodes.
  const formBranch = form.closest('sc-if');
  const successBranch = formBranch?.nextElementSibling;
  if (!(formBranch instanceof HTMLElement) || !(successBranch instanceof HTMLElement)) return () => {};
  const reset = successBranch.querySelector<HTMLButtonElement>('button[type="button"]');
  if (!reset) return () => {};
  const formDisplay = formBranch.style.display;
  const successDisplay = successBranch.style.display;

  const render = (sent: boolean) => {
    formBranch.style.display = sent ? 'none' : formDisplay;
    successBranch.style.display = sent ? successDisplay : 'none';
    formBranch.hidden = sent;
    successBranch.hidden = !sent;
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
    formBranch.hidden = false;
    successBranch.hidden = false;
    formBranch.style.display = formDisplay;
    successBranch.style.display = successDisplay;
  };
}
