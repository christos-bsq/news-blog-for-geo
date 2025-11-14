import type { Context } from 'netlify:edge';
import experimentIndex from './experiment-index.json' with { type: 'json' };

type Experiment = {
  slug?: string;
  title?: string;
  experiment_type: string;
  render_mode: string;
  server_delay_ms: number;
};

const defaultExperiment: Experiment = {
  experiment_type: 'baseline',
  render_mode: 'ssr',
  server_delay_ms: 0
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const requestId = crypto.randomUUID();
  const slug = extractSlug(url.pathname);
  const experiment = (slug ? (experimentIndex as Record<string, Experiment>)[slug] : null) ?? defaultExperiment;

  if (experiment.server_delay_ms > 0) {
    await wait(experiment.server_delay_ms);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('X-Request-Id', requestId);
  const nextResponse = new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });

  const requestHeaders = headersToJSON(request.headers);
  const userAgent = requestHeaders['user-agent'] ?? '';
  const botInfo = detectBot(userAgent);
  const siteEnv = Deno.env.get('SITE_ENV') ?? 'development';
  const loggingEndpoint = Deno.env.get('LOGGING_ENDPOINT');

  const payload = {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    query: url.search,
    host: requestHeaders.host ?? url.host,
    user_agent: userAgent,
    referer: requestHeaders.referer ?? '',
    x_forwarded_for: requestHeaders['x-forwarded-for'] ?? '',
    headers_json: JSON.stringify(requestHeaders),
    is_bot: botInfo.isBot,
    bot_family: botInfo.family,
    experiment_type: experiment.experiment_type,
    render_mode: experiment.render_mode,
    server_delay_ms: experiment.server_delay_ms,
    response_status: response.status,
    site_env: siteEnv,
    slug
  };

  if (loggingEndpoint) {
    context.waitUntil(sendLog(loggingEndpoint, payload));
  }

  return nextResponse;
}

function extractSlug(pathname: string) {
  const match = pathname.match(/^\/post\/([^/]+)/);
  return match ? match[1] : null;
}

function headersToJSON(headers: Headers) {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

function detectBot(userAgent: string) {
  const pairs: [RegExp, string][] = [
    [/googlebot/i, 'googlebot'],
    [/bingbot/i, 'bingbot'],
    [/duckduckbot/i, 'duckduckbot'],
    [/yandexbot/i, 'yandexbot'],
    [/baiduspider/i, 'baiduspider'],
    [/gptbot/i, 'gptbot'],
    [/perplexitybot/i, 'perplexity'],
    [/slurp/i, 'slurp'],
    [/facebookexternalhit/i, 'facebook']
  ];

  for (const [regex, family] of pairs) {
    if (regex.test(userAgent)) {
      return { isBot: true, family };
    }
  }

  const genericBot = /bot|crawl|spider|fetcher|monitor/i.test(userAgent);
  return { isBot: genericBot, family: genericBot ? 'other' : 'unknown' };
}

async function sendLog(endpoint: string, payload: Record<string, unknown>) {
  const headers = new Headers({ 'content-type': 'application/json' });
  const apiKey = Deno.env.get('LOGGING_API_KEY');
  if (apiKey) {
    headers.set('authorization', `Bearer ${apiKey}`);
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Logging delivery failed', error);
  }
}
