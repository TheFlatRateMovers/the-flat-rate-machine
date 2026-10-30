export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    try {
      const data = await request.json().catch(() => ({}));
      // 'None noted' is display wording produced at render time, never data:
      // if it arrives in a payload (older cached page, mailto fallback), it is empty.
      const clean = (v) => {
        if (typeof v !== 'string') return '';
        const t = v.trim().slice(0, 4000);
        return t === 'None noted' ? '' : t;
      };
      if (clean(data.website)) return Response.json({ ok: true });
      const from = clean(data.from); const to = clean(data.to);
      if (!from || !to) return Response.json({ ok: false, error: 'From and To are required.' }, { status: 400 });
      // Mandatory contact fields: no client, cached page, or direct POST can
      // produce a lead the company cannot reply to.
      const name = clean(data.name); const phone = clean(data.phone); const email = clean(data.email);
      if (!name || !phone || !email) return Response.json({ ok: false, error: 'Name, phone, and email are required.' }, { status: 400 });
      const v = (k) => clean(data[k]) || '—';
      const detailed = data.mode === 'detailed';
      const lines = [
        'FLAT RATE QUOTE REQUEST — The Flat Rate Movers',
        'Form: ' + (detailed ? 'Detailed Project' : 'Quick Quote (Short)'),
        'From: ' + from,
        'To: ' + to,
        "What's moving: " + v('moving'),
        'Type: ' + v('type'),
        'Heavy / high-value: ' + (clean(data.heavy) || 'None noted'),
      ];
      // Never drop data a visitor actually entered, in either mode.
      // Detailed mode always lists the full set (with — for blanks); Short mode
      // adds a section only for fields that carry a real supplied value, so a
      // bare Short quote stays short and never shows defaults as if entered.
      const contactFields = [
        ['name', 'Contact name: '],
        ['phone', 'Phone: '],
        ['email', 'Email: '],
        ['reach', 'Best way to reach: '],
        ['project', 'Project type: '],
      ];
      const detailFields = [
        ['fromFull', 'From (full city/ZIP): '],
        ['toFull', 'To (full city/ZIP): '],
        ['date', 'Preferred date: '],
        ['dateEnd', 'Date range end: '],
        ['flex', 'Timing: '],
        ['size', 'Rooms / facility size: '],
        ['heavyList', 'Heavy & sensitive items: '],
        ['heavyWeight', 'Weight, if known: '],
        ['heavyDims', 'Dimensions, if known: '],
        ['originAccess', 'Access at origin: '],
        ['destAccess', 'Access at destination: '],
        ['services', 'Services needed: '],
        ['notes', 'Project notes / inventory: '],
      ];
      const render = (pair) => pair[1] + v(pair[0]);
      const supplied = (pair) => clean(data[pair[0]]) !== '';
      if (detailed) {
        lines.push('--- DETAILED PROJECT ---', ...contactFields.map(render), ...detailFields.map(render));
      } else {
        const contact = contactFields.filter(supplied);
        if (contact.length) lines.push('--- CONTACT (supplied) ---', ...contact.map(render));
        const detail = detailFields.filter(supplied);
        if (detail.length) lines.push('--- DETAIL SUPPLIED ---', ...detail.map(render));
      }
      const wt = (data.walkthrough && typeof data.walkthrough === 'object') ? data.walkthrough : null;
      if (wt && wt.requested) {
        lines.push('--- VIDEO WALKTHROUGH ---');
        if (wt.url) {
          lines.push('Walkthrough requested: yes', 'Room code: ' + clean(wt.code), 'Room link: ' + clean(wt.url));
        } else {
          lines.push('Walkthrough requested: yes (room link could not be created — call the client to arrange one)');
        }
      }
      const visitorEmail = clean(data.email);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail);
      const result = await env.EMAIL.send({
        from: { email: 'quotes@theflatratemovers.com', name: 'The Flat Rate Movers' },
        to: { email: 'ratemovers@gmail.com', name: 'The Flat Rate Movers' },
        ...(isEmail ? { replyTo: visitorEmail } : {}),
        subject: 'Flat Rate Quote Request — The Flat Rate Movers',
        text: lines.join('\n'),
      });
      return Response.json({ ok: true, messageId: result.messageId || null });
    } catch (e) {
      return Response.json({ ok: false, error: String(e.message || e).slice(0,500), code: e.code || null }, { status: 500 });
    }
  }
};
