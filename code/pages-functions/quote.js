export async function onRequestPost(context) {
  try {
    const data = await context.request.json().catch(() => ({}));
    const clean = (v) => (typeof v === 'string' ? v.trim().slice(0, 4000) : '');
    if (clean(data.website)) return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    if (!clean(data.from) || !clean(data.to)) return new Response(JSON.stringify({ ok: false, error: 'From and To are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    // Forward to the Cloudflare Worker that holds the native Email Service binding.
    // No third-party form service, no Gmail password in this function.
    const resp = await fetch('https://flat-rate-quote-email.ratemovers.workers.dev/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const text = await resp.text();
    return new Response(text, { status: resp.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e).slice(0, 500) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
