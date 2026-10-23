import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, summarize, rotate, render, updateBody, publish } from './publish-confluence.mjs';

const now = new Date('2026-10-23T17:00:00Z');
const repoUrl = 'https://github.com/cesar-naja/saucedemo-playwright';
const meta = { id: '42', attempt: 1, timestamp: now.toISOString(), number: '8', sha: 'abcdef1234', url: `${repoUrl}/actions/runs/42`, jobResult: 'success' };
const result = (status, projectName = 'chromium') => ({ status, projectName, results: [{ retry: 0 }, { retry: 1 }] });
const report = tests => ({ stats: { duration: 12345 }, suites: [{ specs: [], suites: [{ specs: [{ tests }] }] }], errors: [] });
const run = (timestamp, id = '42', attempt = 1) => summarize(report([result('expected')]), { ...meta, timestamp, id, attempt });

test('counts final browser outcomes once per execution, excludes setup, keeps flaky separate', () => {
  const summary = summarize(report([result('expected', 'setup'), result('expected'), result('flaky', 'firefox'), result('unexpected'), result('skipped')]), meta);
  assert.deepEqual([summary.passed, summary.flaky, summary.failed, summary.skipped, summary.total], [1, 1, 1, 1, 4]);
  assert.deepEqual(summary.browsers, ['chromium', 'firefox']);
  assert.equal(summary.status, 'FAILED');
  assert.equal(summary.duration, 12);
});

test('does not show missing/empty reports or setup failures as successful', () => {
  for (const data of [null, report([]), report([result('skipped')]), report([result('unexpected', 'setup'), result('skipped')])]) {
    const summary = summarize(data, meta);
    assert.equal(summary.status, 'FAILED');
    assert.equal(summary.infrastructure, true);
  }
  assert.equal(summarize(report([result('expected')]), { ...meta, jobResult: 'failure' }).status, 'FAILED');
  assert.equal(summarize(report([result('flaky')]), meta).status, 'FLAKY');
  assert.throws(() => summarize(report([result('new-outcome')]), meta));
});

test('five Chicago dates retain inclusive boundary and multiple daily runs; reject future dates', () => {
  const runs = [run('2026-10-19T04:59:59Z', 'old'), run('2026-10-19T05:00:00Z', 'boundary'), run('2026-10-22T18:00:00Z', 'a'), run('2026-10-22T19:00:00Z', 'b'), run('2026-10-24T18:00:00Z', 'future')];
  assert.deepEqual(rotate(runs, null, now).map(r => r.id), ['b', 'a', 'boundary']);
  assert.equal(dayKey('2026-10-23T04:59:59Z'), '2026-10-22');
});

test('retention uses calendar dates across daylight saving transition', () => {
  const dstNow = new Date('2026-11-03T18:00:00Z');
  const rows = rotate([run('2026-10-30T04:59:59Z', 'old'), run('2026-10-30T05:00:00Z', 'keep')], null, dstNow);
  assert.deepEqual(rows.map(r => r.id), ['keep']);
});

test('reruns replace their row; delayed older attempts cannot overwrite newer ones', () => {
  const first = run(now.toISOString(), '42', 1);
  const newer = run(now.toISOString(), '42', 2);
  assert.equal(rotate([first], newer, now).length, 1);
  assert.equal(rotate([newer], first, now)[0].attempt, 2);
});

test('adds section once, preserves existing content and later manual overview edits', () => {
  const existing = '<h1>My existing overview</h1><p>Keep this.</p>';
  const first = updateBody(existing, run(now.toISOString()), repoUrl, now);
  const edited = first.replace('Project at a glance', 'My custom introduction') + '<p>Manual footer.</p>';
  const second = updateBody(edited, run(now.toISOString(), '43'), repoUrl, now);
  assert.ok(second.startsWith(existing));
  assert.ok(second.includes('My custom introduction'));
  assert.ok(second.endsWith('<p>Manual footer.</p>'));
  assert.equal((second.match(/Run it locally/g) || []).length, 1);
  assert.equal((second.match(/Playwright automated results<\/h2>/g) || []).length, 1);
  assert.ok(second.includes('"id":"43"'));
  assert.ok(second.includes('"id":"42"'));
});

test('cleanup removes expired rows without creating a run and no-ops when unchanged', () => {
  assert.equal(updateBody('<p>No results yet</p>', null, repoUrl, now), '<p>No results yet</p>');
  const first = updateBody('', run(now.toISOString()), repoUrl, now);
  assert.equal(updateBody(first, null, repoUrl, now), first);
  const expired = updateBody(first, null, repoUrl, new Date('2026-10-28T18:00:00Z'));
  assert.ok(expired.includes('"runs":[]'));
  assert.ok(expired.includes('No published runs'));
});

test('fails safely for missing markers or corrupt state; escapes table markup', () => {
  assert.throws(() => updateBody('<h2>Playwright automated results</h2><p>Missing end</p>', null, repoUrl, now));
  assert.throws(() => updateBody('<h2>Playwright automated results</h2><p>End of Playwright automated results.</p>', run(now.toISOString()), repoUrl, now));
  const unsafe = { ...run(now.toISOString()), browsers: ['<script>bad()</script>]]>'] };
  const output = render([unsafe], now);
  assert.ok(!output.includes('<script>'));
  assert.ok(output.includes('&lt;script&gt;'));
  assert.equal((output.match(/\]\]>/g) || []).length, 1);
});

test('REST publisher retries version conflict, merges another run, preserves page title', async () => {
  const earlier = updateBody('<p>Human content</p>', run(now.toISOString(), 'earlier'), repoUrl, now);
  const concurrent = updateBody(earlier, run(now.toISOString(), 'concurrent'), repoUrl, now);
  let gets = 0;
  let puts = 0;
  const fetchImpl = async (url, options) => {
    assert.equal(options.redirect, 'error');
    assert.ok(url.startsWith('https://example.atlassian.net/wiki/api/v2/pages/163939'));
    if (!options.method) {
      gets++;
      return { ok: true, json: async () => ({ status: 'current', title: 'Original title', body: { storage: { value: gets === 1 ? earlier : concurrent } }, version: { number: gets } }) };
    }
    puts++;
    const payload = JSON.parse(options.body);
    assert.equal(payload.title, 'Original title');
    assert.equal(payload.version.number, gets + 1);
    assert.ok(payload.body.value.includes('Human content'));
    if (puts === 1) return { status: 409, ok: false };
    assert.ok(payload.body.value.includes('"id":"concurrent"'));
    assert.ok(payload.body.value.includes('"id":"42"'));
    return { status: 200, ok: true };
  };
  await publish({ apiBase: 'https://example.atlassian.net', pageId: '163939', email: 'test@example.com', token: 'dummy', incoming: run(now.toISOString()), repoUrl, fetchImpl, now });
  assert.equal(puts, 2);
});

test('REST cleanup does not create a version when no rows expire', async () => {
  let calls = 0;
  const value = updateBody('', run(now.toISOString()), repoUrl, now);
  await publish({ apiBase: 'https://example.atlassian.net', pageId: '163939', email: 'test@example.com', token: 'dummy', incoming: null, repoUrl, now, fetchImpl: async () => {
    calls++;
    return { ok: true, json: async () => ({ status: 'current', title: 'Overview', body: { storage: { value } }, version: { number: 1 } }) };
  } });
  assert.equal(calls, 1);
});

test('rejects unsafe destinations and stops on authentication errors', async () => {
  const args = { pageId: '163939', email: 'test@example.com', token: 'dummy', incoming: null, repoUrl };
  await assert.rejects(publish({ ...args, apiBase: 'https://attacker.example' }), /HTTPS Atlassian/);
  await assert.rejects(publish({ ...args, apiBase: 'https://example.atlassian.net', fetchImpl: async () => ({ ok: false, status: 401 }) }), /HTTP 401/);
});
