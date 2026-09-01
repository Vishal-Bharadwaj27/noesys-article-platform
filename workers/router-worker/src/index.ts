export default {
  async fetch(request: Request, env: any): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const ADMIN_API = env.ADMIN_API;
    const USER_API = env.USER_API;

    let targetUrl: string;
    if (path.startsWith("/admin")) {
      targetUrl = ADMIN_API + path;
    } else {
      targetUrl = USER_API + path;
    }

    const backendHeaders = new Headers(request.headers);
    backendHeaders.delete("Host");

    const backendRequest = new Request(targetUrl, {
      method: request.method,
      headers: backendHeaders,
      body: request.body,
    });

    const response = await fetch(backendRequest);
    const responseBody = await response.arrayBuffer();

    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};