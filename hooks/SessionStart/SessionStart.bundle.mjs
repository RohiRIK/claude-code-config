#!/usr/bin/env bun
import{existsSync as w,mkdirSync as T,readFileSync as ot,statSync as st,writeFileSync as it}from"fs";import{join as c}from"path";import{homedir as F}from"os";import{existsSync as _,readFileSync as O,writeFileSync as H,mkdirSync as J}from"fs";import{join as y,sep as v}from"path";import{homedir as G}from"os";var B=y(G(),".claude"),p=y(B,"projects"),b=y(p,"registry.json");function U(t){return t.replace(new RegExp("\\"+v,"g"),"-").replace(/\./g,"-")}function k(){if(!_(b))return{};try{return JSON.parse(O(b,"utf-8"))}catch{return{}}}function W(t){_(p)||J(p,{recursive:!0}),H(b,JSON.stringify(t,null,2)+`
`)}function L(t,e){let n=k();n[t]=e,W(n)}function $(t,e,n){return{name:t,projectDir:y(p,t),isNew:n,registeredPath:e}}function R(t){let e=k();if(e[t])return $(e[t],t,!1);let n=Object.keys(e).sort((r,m)=>m.length-r.length);for(let r of n)if(t.startsWith(r+"/")||t.startsWith(r+v))return $(e[r],r,!1);let s=U(t),g=y(p,s),u=["context-goals.md","context-decisions.md","context-progress.md","context-gotchas.md","context-summary.md"].some(r=>_(y(g,r)));return{name:s,projectDir:g,isNew:!u,registeredPath:null}}async function E(){let t="";try{for await(let e of Bun.stdin.stream())t+=new TextDecoder().decode(e)}catch{}return t}function D(t){let e={};try{e=JSON.parse(t)}catch{}let n=e.cwd||e.working_directory||e.session?.cwd||"";return n?{input:e,cwd:n}:null}function I(t,e){let n=t.split(`
`);return n.length<=e?t:n.slice(n.length-e).join(`
`)}import{appendFileSync as X,readFileSync as Y,mkdirSync as z,statSync as q,writeFileSync as K}from"fs";import{join as V,dirname as Q}from"path";import{homedir as Z}from"os";var x=V(Z(),".claude","logs","hooks.log"),tt=5e5,et=3e5,M=!1;function nt(){M||(z(Q(x),{recursive:!0}),M=!0)}function rt(){try{let t;try{t=q(x).size}catch{return}if(t<=tt)return;K(x,Y(x,"utf-8").slice(-et))}catch{}}function j(t,e,n,s,g){try{nt(),rt();let l={ts:new Date().toISOString(),hook:t,level:e,msg:n,...s!==void 0&&{detail:s},...g!==void 0&&{durationMs:g}};X(x,JSON.stringify(l)+`
`)}catch(l){console.error(`[hookLogger] Failed to write log: ${l}`)}}var d=c(F(),".claude"),P=c(d,"tmp"),ct=c(P,"session-tool-count.txt"),A=c(d,"memory","ltm.db"),at=60,N=30,gt=720*60*60*1e3,C=`\u26A1 LTM MCP live \u2014 use mcp__ltm__ltm_recall before tasks, mcp__ltm__ltm_learn after discoveries.
`;function ut(t){return(t.replace(/\/$/,"").split("/").pop()??"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}async function lt(t,e){if(!w(A))return"";try{let{getContextMerge:n,getSimilarMemories:s}=await import(c(d,"memory/db.js")),{embedText:g}=await import(c(d,"memory/embeddings.js")),{getDb:l}=await import(c(d,"memory/shared-db.js")),u,r,m,f=e?await g(e):null;if(f){let o=l();u=s(o,f,{minImportance:4,limit:16}),r=s(o,f,{projectScope:t,minImportance:2,limit:15}),process.stderr.write(`[SessionStart] Semantic LTM: ${u.length} globals, ${r.length} scoped
`)}else{let o=n(t);u=o.globals,r=o.scoped}try{let{readConfigSync:o}=await import(c(d,"memory/config.js"));if(o()?.ltm?.graphReasoning){let{getContextMergeWithGraph:h}=await import(c(d,"memory/db.js"));m=(await h(t)).graphInsights}}catch{}if(u.length===0&&r.length===0)return"";let a=["LTM:",""];if(u.length>0){a.push("globals:");for(let o of u)a.push(`- [${o.id}] ${o.content}`);a.push("")}if(r.length>0){a.push("project:");for(let o of r)a.push(`- [${o.id}] ${o.content}`);a.push("")}m&&(a.push(m),a.push(""));let S=a.join(`
`).split(`
`);return S.length>N?S.slice(0,N).join(`
`)+`
\u2026 (truncated)
`:a.join(`
`)}catch{return""}}async function mt(){try{let{runPendingMigrations:i}=await import((process.env.HOME??F())+"/.claude/memory/migrations.ts"),h=await i();h.length>0&&process.stderr.write(`[SessionStart] Applied ${h.length} migration(s)
`)}catch(i){process.stderr.write(`[SessionStart] Migration warning: ${i}
`)}let t=await E(),e=D(t);if(w(P)||T(P,{recursive:!0}),it(ct,"0"),!e){j("SessionStart","warn","No cwd in input, skipping context injection"),console.error("[SessionStart] No cwd in input, skipping context injection");return}let{cwd:n}=e,{name:s,projectDir:g,isNew:l,registeredPath:u}=R(n);if(l){let i=ut(n);L(n,i),T(c(p,i),{recursive:!0}),process.stdout.write(`# New Project Detected

No context files found for: \`${n}\`

I've registered this project as **"${i}"** in the context registry.
Context will be saved to \`~/.claude/projects/${i}/\`

If you'd like a different name, run: \`/register-project\`

Should I create the 4 context files now so your work is saved across sessions? (yes/no)
`);return}if(w(A))try{let{exportContextMarkdown:i}=await import(c(d,"memory/context.js"));i(s)}catch{}let r=c(g,"context-summary.md");if(!w(r)){["context-goals.md","context-decisions.md","context-progress.md","context-gotchas.md"].some(h=>w(c(g,h)))||process.stdout.write(`# Project Registered \u2014 No Context Files Yet

Project **"${s}"** is registered but has no context files.
Should I create them now? (yes/no)
`);return}if(Date.now()-st(r).mtimeMs>gt){j("SessionStart","warn",`Context for "${s}" is older than 30 days \u2014 skipping`),console.error(`[SessionStart] Context for "${s}" is older than 30 days \u2014 skipping`);return}let m=ot(r,"utf-8"),f=I(m,at),a=m.slice(0,500).trim()||void 0,S=await lt(s,a),o=S?`${f}

${S}
${C}`:`${f}
${C}`;process.stdout.write(o),j("SessionStart","info",`Injected context for "${s}" (${u?"registry":"slug fallback"})`)}mt();
