import {z} from 'zod';
const payload=z.object({action:z.enum(['seed','simulate','acknowledge','resolve']),id:z.string().max(100).optional(),scenario:z.string().max(30).optional()});
import {database,event,failure,sameOrigin,snapshot,stamp} from '@/lib/ops';
export async function GET(){try{return Response.json(await snapshot(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});try{const parsed=payload.safeParse(await req.json());if(!parsed.success)return Response.json({error:"Invalid action payload"},{status:400});const {action,id,scenario}=parsed.data;const db=database();const now=stamp();
if(action==='seed'){
const rows=[['demo-api','payments-api','EC2 · t3.medium',68,62,128,42],['demo-worker','queue-worker','EKS · deployment',34,48,42,36],['demo-db','orders-db','RDS · PostgreSQL',24,58,18,64],['demo-cache','session-cache','ElastiCache · Redis',12,31,4,18],['demo-web','web-frontend','EC2 · t3.small',18,29,32,21],['demo-staging','staging-api','EC2 · t3.medium',3,14,24,42]];
const statements=rows.map(([id,name,kind,cpu,memory,latency,cost])=>db.prepare('INSERT OR IGNORE INTO resources (id,name,kind,region,cpu,memory,latency,cost,source,updated) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,name,kind,'ap-south-1',cpu,memory,latency,cost,'demo',now));
await db.batch([...statements,event('Demo loaded','Six simulated resources; monthly costs are illustrative USD estimates.')]);
}else if(action==='simulate'){
if(!['cpu','memory','latency'].includes(scenario??''))return Response.json({error:'Unknown scenario'},{status:400});
const r=await db.prepare("SELECT * FROM resources WHERE id='demo-api'").first();if(!r)return Response.json({error:'Load the demo environment first.'},{status:400});
const active=await db.prepare("SELECT id FROM incidents WHERE resource_id='demo-api' AND status!='resolved'").first();if(active)return Response.json({error:'Resolve the current demo incident before running another scenario.'},{status:409});
const cpu=scenario==='cpu'?96:68,memory=scenario==='memory'?94:62,latency=scenario==='latency'?1840:128;
const title=scenario==='cpu'?'CPU saturation on payments-api':scenario==='memory'?'Memory pressure on payments-api':'Elevated latency on payments-api';
const evidence=scenario==='cpu'?'CPU rose to 96%. Request queue growing. Synthetic log: worker backlog exceeded 250.':scenario==='memory'?'Memory reached 94%. Synthetic log: allocation failed; container approaching memory limit.':'Latency reached 1840 ms. Synthetic log: upstream database request timeout.';
await db.batch([db.prepare("UPDATE resources SET cpu=?,memory=?,latency=?,updated=? WHERE id='demo-api'").bind(cpu,memory,latency,now),db.prepare("INSERT INTO samples (resource_id,cpu,memory,latency,created) VALUES ('demo-api',?,?,?,?)").bind(cpu,memory,latency,now),db.prepare("INSERT INTO incidents (id,resource_id,title,severity,status,evidence,created) SELECT ?,'demo-api',?,'critical','open',?,? WHERE NOT EXISTS (SELECT 1 FROM incidents WHERE resource_id='demo-api' AND status!='resolved')").bind(crypto.randomUUID(),title,evidence,now),event('Incident simulated',title)]);
}else if(action==='acknowledge'||action==='resolve'){
if(typeof id!=='string')return Response.json({error:'Incident required'},{status:400});
const incident=await db.prepare('SELECT incidents.*,resources.source FROM incidents JOIN resources ON resources.id=incidents.resource_id WHERE incidents.id=?').bind(id).first<any>();if(!incident)return Response.json({error:'Incident not found'},{status:404});
if(incident.status==='resolved')return Response.json(await snapshot());
if(action==='resolve'&&incident.source!=='demo')return Response.json({error:'Real incidents require a fresh healthy telemetry sample before resolution.'},{status:409});
const statements=[db.prepare("UPDATE incidents SET status=?,resolved=? WHERE id=? AND status!='resolved'").bind(action==='resolve'?'resolved':'investigating',action==='resolve'?now:null,id),event(action==='resolve'?'Demo recovery completed':'Investigation started',incident.title)];
if(action==='resolve')statements.push(db.prepare('UPDATE resources SET cpu=32,memory=44,latency=65,updated=? WHERE id=?').bind(now,incident.resource_id),db.prepare('INSERT INTO samples (resource_id,cpu,memory,latency,created) VALUES (?,32,44,65,?)').bind(incident.resource_id,now));await db.batch(statements);
}else{return Response.json({error:'Unknown action'},{status:400});}
return Response.json(await snapshot());}catch(e){return failure(e);}}
