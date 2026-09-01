export default {
	async fetch(request: Request, env: any): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const ADMIN_API = env.ADMIN_API;
		const USER_API = env.USER_API;

		const target = path.startsWith('/admin') ? ADMIN_API : USER_API;
		const newUrl = target + path;

		const newReq = new Request(newUrl, {
			method: request.method,
			headers: request.headers,
			body: request.body,
		});

		const res = await fetch(newReq);
		const body = await res.arrayBuffer();

		const headers = new Headers(res.headers);
		headers.set('Access-Control-Allow-Origin', '*');
		headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

		return new Response(body, {
			status: res.status,
			headers,
		});
	},
};