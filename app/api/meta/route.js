export async function POST(request) {
  const { path, method, body, token } = await request.json();
  const url = `https://graph.facebook.com/v19.0${path}`;
  
  const res = await fetch(url, {
    method: method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify({ ...body, access_token: token }) } : {})
  });
  
  const data = await res.json();
  return Response.json(data);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const token = searchParams.get('token');
  
  const url = `https://graph.facebook.com/v19.0${path}&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  return Response.json(data);
}
