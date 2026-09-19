import { env } from 'cloudflare:workers';
export function database(): D1Database {const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new Error('Database unavailable');return db;}
export function settings(){return env as unknown as Record<string,string>;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
export function stamp(){return new Date().toISOString();}
export function event(action:string,detail:string){return database().prepare('INSERT INTO audit (id,action,detail,created) VALUES (?,?,?,?)').bind(crypto.randomUUID(),action,detail,stamp());}
export async function snapshot(){const db=database();const [r,i,a,s]=await Promise.all([db.prepare('SELECT * FROM resources ORDER BY name').all(),db.prepare('SELECT * FROM incidents ORDER BY created DESC LIMIT 100').all(),db.prepare('SELECT * FROM audit ORDER BY created DESC LIMIT 100').all(),db.prepare('SELECT * FROM samples ORDER BY id DESC LIMIT 400').all()]);return {resources:r.results,incidents:i.results,audit:a.results,samples:s.results.reverse(),aiEnabled:!!(settings().AI_API_KEY&&settings().AI_MODEL)};}
export function failure(e:unknown){console.error(e);return Response.json({error:'Service unavailable. Your last saved data is preserved. Please retry.'},{status:503});}
