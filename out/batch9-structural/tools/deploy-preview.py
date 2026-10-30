#!/usr/bin/env python3
"""Batch 9 Item 1 PROTOTYPE deploy — preview branch only.
Surrogate via dynamic_credentials, child env only; never printed."""
import os, subprocess, sys
sys.path.insert(0, '/opt/muse/skills/custom-connector-setup/bin')
from dynamic_credentials import dynamic_credential_entry
entry = dynamic_credential_entry('custom.cloudflare')
env = dict(os.environ)
env['CLOUDFLARE_API_TOKEN'] = entry['surrogate']
workdir = os.path.expanduser('~/workspace/the-flat-rate-movers-pages')
r = subprocess.run(['npx', 'wrangler', 'pages', 'deploy', 'public',
                    '--project-name=the-flat-rate-movers', '--branch=batch9proto'],
                   cwd=workdir, env=env, capture_output=True, text=True)
print(r.stdout[-3000:])
print(r.stderr[-1500:], file=sys.stderr)
print('exit:', r.returncode)
sys.exit(r.returncode)
