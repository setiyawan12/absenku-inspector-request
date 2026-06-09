'use strict';

const INSPECTOR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Absenku Net</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0b14; --s1:#0f1020; --s2:#141526; --brd:#1e2038; --brd2:#252845;
  --txt:#d8daf0; --dim:#6b7099; --dim2:#4a4f6e;
  --acc:#6366f1; --acc2:#818cf8;
  --g:#34d399; --y:#fbbf24; --o:#f97316; --r:#f43f5e; --b:#60a5fa; --p:#a78bfa;
  --font:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono','Fira Code',monospace;
}
html.light{
  --bg:#f4f5ff; --s1:#ffffff; --s2:#edf0ff; --brd:#dde1f5; --brd2:#c5caec;
  --txt:#1a1b2e; --dim:#5c6080; --dim2:#8890b5;
  --acc:#4f51d4; --acc2:#4f51d4;
  --g:#059669; --y:#d97706; --o:#ea580c; --r:#e11d48; --b:#2563eb; --p:#7c3aed;
}
/* Method badges */
html.light .mGET{background:rgba(37,99,235,.1);color:#1d4ed8}
html.light .mPOST{background:rgba(5,150,105,.1);color:#065f46}
html.light .mPUT{background:rgba(194,65,12,.1);color:#9a3412}
html.light .mDELETE{background:rgba(190,18,60,.1);color:#9f1239}
html.light .mPATCH{background:rgba(109,40,217,.1);color:#5b21b6}
html.light .mOTHER,html.light .mHEAD,html.light .mOPTIONS{background:rgba(75,85,99,.1);color:#374151}
/* Status badges */
html.light .s2xx{background:rgba(5,150,105,.12);color:#065f46}
html.light .s3xx{background:rgba(180,83,9,.12);color:#92400e}
html.light .s4xx{background:rgba(194,65,12,.12);color:#9a3412}
html.light .s5xx{background:rgba(190,18,60,.12);color:#9f1239}
html.light .sunk{background:rgba(75,85,99,.1);color:#374151}
/* JSON syntax highlighting */
html.light .body-view.json .jk{color:#1d4ed8}
html.light .body-view.json .js{color:#047857}
html.light .body-view.json .jn{color:#b45309}
html.light .body-view.json .jb{color:#6d28d9}
html.light .body-view.json .jl{color:#be123c}
/* Code/body view */
html.light .body-view{background:#f0f2ff;color:#1a1b2e;border-color:var(--brd)}
html.light .body-copy{background:#e5e8ff;color:var(--dim)}
/* Header name column in tables */
html.light .htable td:first-child{background:rgba(37,99,235,.04);color:#1d4ed8}
html.light .htable tr:hover td{background:rgba(79,81,212,.04)}
/* Mock/port tags */
html.light .mock-tag{background:rgba(109,40,217,.12);color:#5b21b6;border-color:rgba(109,40,217,.25)}
html.light .port-badge{background:rgba(37,99,235,.1);color:#1d4ed8;border-color:rgba(37,99,235,.2)}
html.light .chip-mock{background:rgba(109,40,217,.1);color:#5b21b6;border-color:rgba(109,40,217,.25)}
html.light .chip-ip,html.light .chip-size{background:var(--s2);color:var(--dim);border-color:var(--brd)}
/* Sidebar */
html.light .reqrow:hover{background:rgba(79,81,212,.04)}
html.light .reqrow.active{background:rgba(79,81,212,.08);border-left-color:var(--acc)}
/* Buttons */
html.light .hbtn{background:#edf0ff;border-color:var(--brd);color:var(--dim)}
html.light .hbtn:hover{background:var(--brd);color:var(--txt)}
html.light .hbtn.active{background:rgba(79,81,212,.15);border-color:rgba(79,81,212,.4);color:var(--acc)}
html.light .hbtn.pause-on{background:rgba(180,83,9,.1);border-color:rgba(180,83,9,.3);color:#92400e}
html.light .action-btn{background:#edf0ff;border-color:var(--brd);color:var(--dim)}
html.light .action-btn:hover{background:var(--brd);color:var(--txt)}
html.light .action-btn.replay-btn{background:rgba(79,81,212,.1);border-color:rgba(79,81,212,.3);color:var(--acc)}
html.light .action-btn.edit-btn{background:rgba(180,83,9,.08);border-color:rgba(180,83,9,.25);color:#92400e}
html.light .action-btn.mock-btn{background:rgba(109,40,217,.08);border-color:rgba(109,40,217,.25);color:#5b21b6}
/* Forms in modal */
html.light .form-group input,html.light .form-group select,html.light .form-group textarea{background:#fff;border-color:var(--brd);color:var(--txt)}
html.light .btn-ghost{background:#edf0ff;border-color:var(--brd);color:var(--dim)}
html.light .btn-ghost:hover{background:var(--brd);color:var(--txt)}
html.light .mock-list-item{background:#f8f9ff;border-color:var(--brd)}
/* Modal */
html.light .modal{box-shadow:0 24px 80px rgba(0,0,0,.15)}
html.light .overlay{background:rgba(30,32,56,.4)}
/* Scrollbar */
html.light ::-webkit-scrollbar-thumb{background:var(--brd2)}
html,body{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--txt);font-family:var(--font);font-size:13px;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:10px}

/* Header */
header{height:52px;background:var(--s1);border-bottom:1px solid var(--brd);padding:0 14px;display:flex;align-items:center;gap:10px;flex-shrink:0}
.logo{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px}
.logo-icon{width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.live-badge{display:flex;align-items:center;gap:5px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:var(--g);padding:3px 9px;border-radius:100px;font-size:11px;font-weight:500}
.live-badge.off{background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.2);color:var(--r)}
.live-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.live-badge:not(.off) .live-dot{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.sep{width:1px;height:28px;background:var(--brd);flex-shrink:0}
.stat-grp{display:flex;gap:14px;align-items:center}
.stat{text-align:center}
.stat-val{font-size:13px;font-weight:600;font-family:var(--mono)}
.stat-lbl{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-top:1px}
.spacer{flex:1}
.hbtn{background:var(--s2);border:1px solid var(--brd);color:var(--dim);padding:5px 10px;border-radius:7px;cursor:pointer;font:12px var(--font);transition:all .15s;display:flex;align-items:center;gap:5px;white-space:nowrap}
.hbtn:hover{background:var(--brd);color:var(--txt);border-color:var(--brd2)}
.hbtn.active{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.4);color:var(--acc2)}
.hbtn.pause-on{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.3);color:var(--y)}
.badge-cnt{background:var(--acc);color:#fff;font-size:10px;padding:1px 5px;border-radius:10px;font-family:var(--mono)}
.kbd{display:inline-flex;align-items:center;justify-content:center;background:var(--s2);border:1px solid var(--brd2);border-bottom-width:2px;border-radius:4px;padding:1px 5px;font:10px var(--mono);color:var(--txt);min-width:18px}
.shortcut-popup{position:absolute;top:52px;right:0;background:var(--s1);border:1px solid var(--brd2);border-radius:10px;padding:12px 14px;min-width:220px;box-shadow:0 12px 40px rgba(0,0,0,.4);z-index:200;display:none}
.shortcut-popup.open{display:block}
.shortcut-popup table{border-collapse:collapse;width:100%}
.shortcut-popup td{padding:4px 0;font-size:11px;vertical-align:middle}
.shortcut-popup td:first-child{padding-right:12px;white-space:nowrap}
.shortcut-popup td:last-child{color:var(--dim);font-size:11px}
.shortcut-popup .sc-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--dim2);margin-bottom:8px}

/* Layout */
main{flex:1;display:flex;overflow:hidden;min-height:0}

/* Sidebar */
#sidebar{width:290px;flex-shrink:0;border-right:1px solid var(--brd);display:flex;flex-direction:column;background:var(--s1)}
.sb-top{padding:8px 10px 0;border-bottom:1px solid var(--brd)}
.search-wrap{position:relative;margin-bottom:8px}
.search-wrap svg{position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--dim2);pointer-events:none}
#search{width:100%;background:var(--bg);border:1px solid var(--brd);border-radius:7px;color:var(--txt);padding:5px 8px 5px 28px;font:12px var(--font);outline:none;transition:border-color .15s}
#search:focus{border-color:var(--acc)}
#search::placeholder{color:var(--dim2)}
.filter-bar{display:flex;gap:4px;padding-bottom:8px;flex-wrap:wrap}
.fbtn{background:transparent;border:1px solid var(--brd);color:var(--dim);padding:3px 8px;border-radius:5px;cursor:pointer;font:11px var(--font);transition:all .12s}
.fbtn:hover{background:var(--s2);color:var(--txt)}
.fbtn.on{color:#fff;border-color:transparent}
.fbtn.all.on{background:var(--acc)}
.fbtn.f2xx.on{background:#059669}
.fbtn.f3xx.on{background:#b45309}
.fbtn.f4xx.on{background:#c2410c}
.fbtn.f5xx.on{background:#be123c}
.fbtn.pin.on{background:#7c3aed}
#port-bar{padding-top:0;padding-bottom:6px;border-top:1px solid var(--brd);margin-top:2px}
#port-bar .fbtn.on{background:#0e7490;color:#fff;border-color:transparent}
.sb-cnt{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--brd)}
.cnt-lbl{font-size:11px;color:var(--dim)}
.cnt-num{font-size:11px;font-family:var(--mono);color:var(--dim2);font-weight:500}
#reqlist{flex:1;overflow-y:auto}

/* Request row */
.reqrow{padding:9px 10px;border-bottom:1px solid var(--brd);cursor:pointer;transition:background .1s;display:grid;grid-template-columns:auto 1fr auto auto;grid-template-rows:auto auto;gap:3px 6px;align-items:center;border-left:2px solid transparent;position:relative;overflow:hidden}
.reqrow:hover{background:rgba(99,102,241,.05)}
.reqrow.active{background:rgba(99,102,241,.08);border-left-color:var(--acc)}
.reqrow.new-in{animation:slideIn .22s ease}
@keyframes slideIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.method{font-size:10px;font-weight:600;padding:2px 5px;border-radius:4px;text-transform:uppercase;font-family:var(--mono);letter-spacing:.3px}
.mGET{background:rgba(96,165,250,.15);color:#93c5fd}
.mPOST{background:rgba(52,211,153,.15);color:#6ee7b7}
.mPUT{background:rgba(249,115,22,.15);color:#fdba74}
.mDELETE{background:rgba(244,63,94,.15);color:#fda4af}
.mPATCH{background:rgba(167,139,250,.15);color:#c4b5fd}
.mOTHER,.mHEAD,.mOPTIONS{background:rgba(107,112,153,.15);color:var(--dim)}
.rpath{font-size:12px;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;grid-column:2;grid-row:1;font-family:var(--mono)}
.rstatus{font-size:11px;font-weight:600;font-family:var(--mono);padding:1px 5px;border-radius:4px}
.pin-btn{background:none;border:none;cursor:pointer;color:var(--dim2);padding:0 2px;font-size:12px;transition:color .1s;grid-row:1;line-height:1}
.pin-btn:hover,.pin-btn.on{color:var(--y)}
.rmeta{grid-column:2/5;grid-row:2;display:flex;gap:8px;align-items:center}
.rtime{font-size:10px;color:var(--dim2)}
.rms{font-size:10px;font-family:var(--mono)}
.rsize{font-size:10px;color:var(--dim2);font-family:var(--mono)}
.wfall{position:absolute;bottom:0;left:0;height:2px;border-radius:0 1px 1px 0;transition:width .4s ease;pointer-events:none}
.mock-tag{font-size:9px;font-weight:600;background:rgba(167,139,250,.2);color:var(--p);border:1px solid rgba(167,139,250,.3);padding:1px 5px;border-radius:3px;text-transform:uppercase;letter-spacing:.5px}
.port-badge{font-size:9px;font-weight:600;background:rgba(96,165,250,.12);color:#7dd3fc;border:1px solid rgba(96,165,250,.2);padding:1px 5px;border-radius:3px;font-family:var(--mono)}
.empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;gap:12px;text-align:center}
.empty-icon{width:48px;height:48px;border-radius:12px;background:var(--s2);border:1px solid var(--brd);display:flex;align-items:center;justify-content:center;font-size:22px}
.empty-title{font-size:13px;font-weight:500;color:var(--dim)}
.empty-sub{font-size:11px;color:var(--dim2);line-height:1.6}

/* Resize handle */
#resize-handle{width:4px;cursor:col-resize;background:transparent;flex-shrink:0;transition:background .15s;position:relative;z-index:10}
#resize-handle:hover,#resize-handle.resizing{background:var(--acc)}
#resize-handle::after{content:'';position:absolute;inset:-4px 0;cursor:col-resize}

/* Detail pane */
#detail-pane{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.no-sel{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--dim)}
.no-sel-icon{font-size:32px;opacity:.25}
.no-sel-txt{font-size:12px;color:var(--dim2)}
#detail{flex:1;display:none;flex-direction:column;overflow:hidden}
.det-head{padding:12px 16px;border-bottom:1px solid var(--brd);background:var(--s1);display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
.det-method{font-size:12px;font-weight:600;padding:3px 8px;border-radius:5px;font-family:var(--mono);flex-shrink:0}
.det-url{flex:1;font-size:13px;font-family:var(--mono);color:var(--txt);word-break:break-all;line-height:1.4;padding-top:2px;min-width:0}
.det-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.chip{font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;font-family:var(--mono);flex-shrink:0}
.chip-ip{font-size:10px;color:var(--dim2);background:var(--s2);border:1px solid var(--brd);padding:2px 7px;border-radius:4px;font-family:var(--mono)}
.chip-ms{font-size:11px;font-family:var(--mono)}
.chip-size{font-size:10px;color:var(--dim2);background:var(--s2);border:1px solid var(--brd);padding:2px 7px;border-radius:4px;font-family:var(--mono)}
.chip-mock{font-size:10px;font-weight:600;background:rgba(167,139,250,.15);color:var(--p);border:1px solid rgba(167,139,250,.3);padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px}

/* Tabs */
.tabs{display:flex;align-items:center;border-bottom:1px solid var(--brd);padding:0 14px;background:var(--s1);gap:2px;flex-shrink:0}
.tab{padding:9px 10px;cursor:pointer;color:var(--dim);border-bottom:2px solid transparent;font-size:12px;font-weight:500;transition:color .15s;position:relative;top:1px;white-space:nowrap}
.tab:hover{color:var(--txt)}
.tab.on{color:var(--acc2);border-bottom-color:var(--acc)}
.tab-spacer{flex:1}
.action-btn{display:flex;align-items:center;gap:4px;background:var(--s2);border:1px solid var(--brd);color:var(--dim);padding:4px 9px;border-radius:6px;font:11px var(--font);font-weight:500;cursor:pointer;transition:all .12s;white-space:nowrap}
.action-btn:hover{background:var(--brd);color:var(--txt)}
.action-btn.replay-btn{background:rgba(99,102,241,.12);border-color:rgba(99,102,241,.3);color:var(--acc2);margin-left:6px}
.action-btn.replay-btn:hover{background:rgba(99,102,241,.22)}
.action-btn.edit-btn{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.25);color:var(--y)}
.action-btn.edit-btn:hover{background:rgba(251,191,36,.15)}
.action-btn.mock-btn{background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.25);color:var(--p)}
.action-btn.mock-btn:hover{background:rgba(167,139,250,.15)}
.action-btn.ok{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.3);color:var(--g)}
.action-btn.err{background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.25);color:var(--r)}
.action-btn.curl-btn{background:rgba(96,165,250,.08);border-color:rgba(96,165,250,.25);color:var(--b)}
.action-btn.curl-btn:hover{background:rgba(96,165,250,.16)}
.action-btn.curl-btn.copied{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.3);color:var(--g)}

/* Tab body */
.tab-body{flex:1;overflow-y:auto;padding:14px 16px}
.section{margin-bottom:18px}
.sec-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--dim2);margin-bottom:8px;display:flex;align-items:center;gap:6px}
.sec-title::after{content:'';flex:1;height:1px;background:var(--brd)}
.htable{width:100%;border-collapse:collapse;border:1px solid var(--brd);border-radius:8px;overflow:hidden}
.htable tr:last-child td{border-bottom:none}
.htable td{padding:5px 10px;border-bottom:1px solid var(--brd);vertical-align:top;font-size:11.5px}
.htable td:first-child{color:var(--b);font-family:var(--mono);white-space:nowrap;padding-right:14px;width:1%;background:rgba(96,165,250,.04);border-right:1px solid var(--brd)}
.htable td:last-child{color:var(--txt);word-break:break-all;font-family:var(--mono);position:relative;padding-right:56px}
.htable tr:hover td{background:rgba(99,102,241,.04)}
.copy-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:var(--s2);border:1px solid var(--brd);color:var(--dim);padding:2px 6px;border-radius:4px;font-size:10px;cursor:pointer;opacity:0;transition:opacity .12s;font-family:var(--font)}
.htable tr:hover .copy-btn{opacity:1}
.copy-btn:hover{background:var(--brd);color:var(--txt)}
.body-view{background:var(--s1);border:1px solid var(--brd);border-radius:8px;padding:12px;font-family:var(--mono);font-size:11.5px;line-height:1.7;white-space:pre-wrap;word-break:break-all;max-height:380px;overflow-y:auto;color:var(--txt);position:relative}
.body-view.json .jk{color:#93c5fd}
.body-view.json .js{color:#86efac}
.body-view.json .jn{color:#fdba74}
.body-view.json .jb{color:#c4b5fd}
.body-view.json .jl{color:#fda4af}
.body-copy{position:absolute;top:7px;right:7px;background:var(--s2);border:1px solid var(--brd);color:var(--dim);padding:2px 8px;border-radius:5px;font-size:10px;cursor:pointer;font-family:var(--font);transition:all .12s}
.body-copy:hover{background:var(--brd);color:var(--txt)}
.nobody{color:var(--dim2);font-style:italic;font-size:12px;padding:10px 0}
.s2xx{background:rgba(52,211,153,.15);color:#6ee7b7}
.s3xx{background:rgba(251,191,36,.15);color:#fde68a}
.s4xx{background:rgba(249,115,22,.15);color:#fdba74}
.s5xx{background:rgba(244,63,94,.15);color:#fda4af}
.sunk{background:rgba(107,112,153,.15);color:var(--dim)}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(2px)}
.overlay.open{display:flex}
.modal{background:var(--s1);border:1px solid var(--brd2);border-radius:12px;width:min(560px,94vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.6)}
.modal-head{padding:14px 18px;border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:8px;flex-shrink:0}
.modal-title{font-weight:600;font-size:14px;flex:1}
.modal-close{background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;line-height:1;padding:2px;transition:color .12s}
.modal-close:hover{color:var(--txt)}
.modal-body{padding:16px 18px;overflow-y:auto;flex:1}
.modal-footer{display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid var(--brd);margin-top:14px}
.form-row{display:flex;gap:10px;margin-bottom:12px}
.form-group{display:flex;flex-direction:column;gap:5px;flex:1}
.form-group label{font-size:11px;font-weight:500;color:var(--dim);text-transform:uppercase;letter-spacing:.5px}
.form-group input,.form-group select,.form-group textarea{background:var(--bg);border:1px solid var(--brd);border-radius:6px;color:var(--txt);padding:7px 10px;font:12px var(--mono);outline:none;transition:border-color .12s;resize:vertical}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:var(--acc)}
.form-group textarea{min-height:90px;line-height:1.6}
.form-group select option{background:var(--s2)}
.btn-ghost{background:var(--s2);border:1px solid var(--brd);color:var(--dim);padding:7px 16px;border-radius:7px;cursor:pointer;font:12px var(--font);transition:all .12s}
.btn-ghost:hover{background:var(--brd);color:var(--txt)}
.btn-primary{background:var(--acc);border:1px solid transparent;color:#fff;padding:7px 16px;border-radius:7px;cursor:pointer;font:12px var(--font);font-weight:500;transition:all .12s}
.btn-primary:hover{background:#4f52d4}
.mock-list-item{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border:1px solid var(--brd);border-radius:7px;margin-bottom:7px}
.mock-list-path{flex:1;font-family:var(--mono);font-size:11px;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mock-list-status{font-family:var(--mono);font-size:11px;font-weight:600;flex-shrink:0}
.mock-del{background:none;border:none;color:var(--dim2);cursor:pointer;font-size:13px;padding:2px;transition:color .12s;flex-shrink:0}
.mock-del:hover{color:var(--r)}
.form-hint{font-size:10px;color:var(--dim2);margin-top:2px}
.empty-mocks{text-align:center;padding:24px 0;color:var(--dim2);font-size:12px}

/* Wide modal variant */
.modal.wide{width:min(820px,96vw)}

/* Diff view */
.diff-same{color:var(--dim);padding:1px 0;font-size:11px;font-family:var(--mono)}
.diff-add{color:var(--g);background:rgba(52,211,153,.08);padding:1px 4px;font-size:11px;font-family:var(--mono)}
.diff-del{color:var(--r);background:rgba(244,63,94,.08);padding:1px 4px;font-size:11px;font-family:var(--mono);text-decoration:line-through;opacity:.8}

/* Rate chart */
.rate-wrap{display:flex;align-items:center;gap:5px;padding:0 2px}
.rate-lbl{font-size:9px;color:var(--dim2);text-align:center;line-height:1.2;white-space:nowrap}

/* Timeline view */
.tl-row{padding:5px 10px;border-bottom:1px solid var(--brd);cursor:pointer;transition:background .1s}
.tl-row:hover{background:rgba(99,102,241,.05)}
.tl-row.active{background:rgba(99,102,241,.08)}
.tl-hdr{padding:4px 10px 2px;border-bottom:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between}
.tl-hdr-txt{font-size:9px;color:var(--dim2);text-transform:uppercase;letter-spacing:.5px}
.tl-label{display:flex;align-items:center;gap:5px;margin-bottom:3px}
.tl-url{font-size:10px;font-family:var(--mono);color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tl-track{position:relative;height:10px;background:var(--brd);border-radius:6px;overflow:visible}
.tl-bar{position:absolute;top:0;height:100%;border-radius:6px;min-width:3px;display:flex;align-items:center;padding-left:3px;overflow:hidden}
.tl-ms{font-size:8px;font-family:var(--mono);color:rgba(255,255,255,.85);white-space:nowrap}
.tl-axis{display:flex;justify-content:space-between;padding:2px 10px 0;font-size:9px;color:var(--dim2)}

/* Inject rules list */
.inj-item{display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg);border:1px solid var(--brd);border-radius:7px;margin-bottom:7px;flex-wrap:wrap}
.inj-port{font-family:var(--mono);font-size:11px;font-weight:600;color:var(--b);flex-shrink:0}
.inj-headers{flex:1;font-family:var(--mono);font-size:10px;color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html.light .diff-add{background:rgba(5,150,105,.08)}
html.light .diff-del{background:rgba(190,18,60,.08)}
</style>
</head>
<body>

<header>
  <div class="logo"><div class="logo-icon">⚡</div>Absenku Net</div>
  <div class="live-badge off" id="badge"><div class="live-dot"></div><span id="badge-txt">connecting</span></div>
  <div class="sep"></div>
  <div class="stat-grp">
    <div class="stat"><div class="stat-val" id="s-total">0</div><div class="stat-lbl">Requests</div></div>
    <div class="stat"><div class="stat-val" id="s-avg">—</div><div class="stat-lbl">Avg ms</div></div>
    <div class="stat"><div class="stat-val" id="s-err">0</div><div class="stat-lbl">Errors</div></div>
  </div>
  <div class="sep"></div>
  <div class="rate-wrap" title="Requests per minute (last 10 min)">
    <svg id="rate-chart" width="80" height="28" style="display:block"></svg>
    <div class="rate-lbl">req<br>/min</div>
  </div>
  <div class="spacer"></div>
  <div style="position:relative">
    <button class="hbtn" id="shortcuts-btn" onclick="toggleShortcuts()" title="Keyboard shortcuts">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>
    </button>
    <div class="shortcut-popup" id="shortcut-popup">
      <div class="sc-title">Keyboard Shortcuts</div>
      <table>
        <tr><td><span class="kbd">↑</span> <span class="kbd">↓</span></td><td>Navigasi request</td></tr>
        <tr><td><span class="kbd">R</span></td><td>Replay request</td></tr>
        <tr><td><span class="kbd">U</span></td><td>Copy as cURL</td></tr>
        <tr><td><span class="kbd">C</span></td><td>Copy request body</td></tr>
        <tr><td><span class="kbd">Esc</span></td><td>Tutup modal</td></tr>
      </table>
    </div>
  </div>
  <button class="hbtn" id="pause-btn" onclick="togglePause()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    Pause
  </button>
  <button class="hbtn" id="notif-btn" onclick="toggleNotif()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
    Notify
  </button>
  <button class="hbtn" id="mocks-btn" onclick="openMocksList()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    Mocks <span class="badge-cnt" id="mocks-cnt" style="display:none">0</span>
  </button>
  <button class="hbtn" onclick="openDiff()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M9 11l3-3 3 3"/></svg>
    Diff
  </button>
  <button class="hbtn" id="tl-btn" onclick="toggleTimeline()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="12" height="4" rx="1"/><rect x="3" y="16" width="15" height="4" rx="1"/></svg>
    Timeline
  </button>
  <button class="hbtn" id="inject-btn" onclick="openInject()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 20l4-16M4 15l16-6M4 9l16 6"/></svg>
    Inject <span class="badge-cnt" id="inject-cnt" style="display:none">0</span>
  </button>
  <button class="hbtn" onclick="openStats()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
    Stats
  </button>
  <button class="hbtn" onclick="exportHAR()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
    HAR
  </button>
  <div class="sep"></div>
  <button class="hbtn" id="theme-btn" onclick="toggleTheme()" title="Toggle light/dark mode">
    <svg id="theme-icon-moon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
    <svg id="theme-icon-sun" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  </button>
  <div class="sep"></div>
  <button class="hbtn" onclick="clearAll()">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/></svg>
    Clear
  </button>
</header>

<main>
  <div id="sidebar">
    <div class="sb-top">
      <div class="search-wrap">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="search" placeholder="Filter path, method, or :port…" oninput="render()">
      </div>
      <div class="filter-bar">
        <button class="fbtn all on" onclick="setFilter('all',this)">All</button>
        <button class="fbtn f2xx" onclick="setFilter('2xx',this)">2xx</button>
        <button class="fbtn f3xx" onclick="setFilter('3xx',this)">3xx</button>
        <button class="fbtn f4xx" onclick="setFilter('4xx',this)">4xx</button>
        <button class="fbtn f5xx" onclick="setFilter('5xx',this)">5xx</button>
        <button class="fbtn pin" onclick="setFilter('pin',this)">📌 Pinned</button>
      </div>
      <div class="filter-bar" id="port-bar" style="display:none"></div>
    </div>
    <div class="sb-cnt">
      <span class="cnt-lbl">Requests</span>
      <span class="cnt-num" id="cnt">0</span>
    </div>
    <div id="reqlist">
      <div class="empty-state" id="empty">
        <div class="empty-icon">🌐</div>
        <div class="empty-title">No requests yet</div>
        <div class="empty-sub">Requests akan muncul<br>di sini secara real-time</div>
      </div>
    </div>
  </div>

  <div id="resize-handle"></div>
  <div id="detail-pane">
    <div class="no-sel" id="nosel">
      <div class="no-sel-icon">↖</div>
      <div class="no-sel-txt">Pilih request untuk melihat detail</div>
    </div>
    <div id="detail">
      <div class="det-head" id="det-head"></div>
      <div class="tabs">
        <div class="tab on" onclick="setTab('req',this)">Request</div>
        <div class="tab" onclick="setTab('res',this)">Response</div>
        <div class="tab" onclick="setTab('preview',this)">Preview</div>
        <div class="tab" onclick="setTab('raw',this)">Raw</div>
        <div class="tab-spacer"></div>
        <button class="action-btn curl-btn" id="curl-btn" onclick="copyAsCurl()" title="Copy as cURL">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          cURL
        </button>
        <button class="action-btn edit-btn" onclick="openEditReplay()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit &amp; Replay
        </button>
        <button class="action-btn mock-btn" onclick="openMockFromReq()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Mock
        </button>
        <button class="action-btn replay-btn" id="replay-btn" onclick="replayReq()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          Replay
        </button>
      </div>
      <div class="tab-body" id="tab-body"></div>
    </div>
  </div>
</main>

<div class="overlay" id="overlay" onclick="overlayClick(event)">
  <div class="modal">
    <div class="modal-head">
      <span class="modal-title" id="modal-title"></span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>

<script>
// ── State ─────────────────────────────────────────────────────────────────────
let reqs=[], sel=null, curtab='req';
let paused=false, pauseQueue=[];
let statusFilter='all', portFilter='all', notifEnabled=false;
const pinned=new Set();
let mockList=[], injectList=[];
let editLocalPort=null;
let timelineMode=false;

// ── EventSource ───────────────────────────────────────────────────────────────
const es=new EventSource('/stream');
es.addEventListener('msg',e=>{
  const m=JSON.parse(e.data);
  if(m.type==='init'){ reqs=m.data||[]; mockList=m.mocks||[]; injectList=m.inject||[]; render(); updateStats(); updateMocksBadge(); updateInjectBadge(); }
  if(m.type==='req'){
    if(paused){ pauseQueue.push(m.data); updatePauseBtn(); }
    else{ reqs.unshift(m.data); render(); updateStats(); if(!sel) pick(m.data.id); notify(m.data); }
  }
  if(m.type==='clear'){ reqs=[]; sel=null; pauseQueue=[]; render(); updateStats(); showNoSel(); updatePauseBtn(); }
  if(m.type==='mocks'){ mockList=m.data||[]; updateMocksBadge(); }
  if(m.type==='inject'){ injectList=m.data||[]; updateInjectBadge(); }
});
es.onopen=()=>setLive(true);
es.onerror=()=>setLive(false);

function setLive(on){
  const b=document.getElementById('badge');
  b.className='live-badge'+(on?'':' off');
  document.getElementById('badge-txt').textContent=on?'live':'connecting';
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats(){
  document.getElementById('s-total').textContent=reqs.length;
  const done=reqs.filter(r=>r.ms!=null);
  document.getElementById('s-avg').textContent=done.length?Math.round(done.reduce((a,r)=>a+r.ms,0)/done.length)+'ms':'—';
  document.getElementById('s-err').textContent=reqs.filter(r=>r.status>=400).length;
  updateRateChart();
}

// ── Request rate sparkline ────────────────────────────────────────────────────
function updateRateChart(){
  const svg=document.getElementById('rate-chart');
  if(!svg) return;
  const now=Date.now(), buckets=new Array(10).fill(0);
  for(const r of reqs){
    const age=(now-new Date(r.time).getTime())/60000;
    if(age>=0&&age<10) buckets[Math.floor(age)]++;
  }
  // buckets[0]=most recent, draw right→left
  const max=Math.max(...buckets,1);
  const BW=6,BG=2,H=24,PY=2;
  svg.innerHTML=buckets.slice().reverse().map((v,i)=>{
    const bh=Math.max(2,Math.round((v/max)*(H-PY)));
    const x=2+i*(BW+BG), y=H-bh;
    const fill=(v===max&&max>1)?'var(--r)':'var(--acc)';
    return\`<rect x="\${x}" y="\${y}" width="\${BW}" height="\${bh}" rx="1" fill="\${fill}" opacity=".75"><title>\${v} req (\${10-i}min ago)</title></rect>\`;
  }).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mc(m){return['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'].includes(m)?m:'OTHER';}
function statusClass(s){if(!s)return'sunk';if(s<300)return's2xx';if(s<400)return's3xx';if(s<500)return's4xx';return's5xx';}
function msColor(ms){if(ms==null)return'#555';if(ms<200)return'#34d399';if(ms<500)return'#fbbf24';return'#f97316';}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function isJSON(s){try{JSON.parse(s);return true;}catch{return false;}}
function formatSize(n){if(n==null)return'';if(n<1024)return n+'B';if(n<1048576)return(n/1024).toFixed(1)+'KB';return(n/1048576).toFixed(1)+'MB';}
function relTime(iso){const d=Date.now()-new Date(iso).getTime();if(d<60000)return Math.round(d/1000)+'s ago';if(d<3600000)return Math.round(d/60000)+'m ago';return new Date(iso).toLocaleTimeString();}
function highlightJSON(str){
  try{
    const p=JSON.stringify(JSON.parse(str),null,2);
    return p.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,m=>{
      let c='jn';
      if(/^"/.test(m)){if(/:$/.test(m))c='jk';else c='js';}
      else if(/true|false/.test(m))c='jb';
      else if(/null/.test(m))c='jl';
      return \`<span class="\${c}">\${esc(m)}</span>\`;
    });
  }catch{return esc(str);}
}

// ── Visible reqs helper (shared by render + keyboard nav) ─────────────────────
function getVisibleReqs(){
  const q=document.getElementById('search').value.toLowerCase();
  return reqs.filter(r=>matchFilter(r)&&(!q||
    r.url.toLowerCase().includes(q)||
    r.method.toLowerCase().includes(q)||
    (r.localPort&&(':'+r.localPort).includes(q))||
    (r.reqBody&&r.reqBody.toLowerCase().includes(q))||
    (r.resBody&&r.resBody.toLowerCase().includes(q))
  ));
}

// ── Filter ────────────────────────────────────────────────────────────────────
function setFilter(f,btn){
  statusFilter=f;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on'); render();
}
function matchFilter(r){
  if(portFilter!=='all'&&r.localPort!==portFilter) return false;
  if(statusFilter==='all') return true;
  if(statusFilter==='pin') return pinned.has(r.id);
  const s=r.status||0;
  if(statusFilter==='2xx') return s>=200&&s<300;
  if(statusFilter==='3xx') return s>=300&&s<400;
  if(statusFilter==='4xx') return s>=400&&s<500;
  if(statusFilter==='5xx') return s>=500;
  return true;
}
function setPortFilter(p){
  portFilter=p;
  render();
}
function updatePortBar(){
  const ports=[...new Set(reqs.map(r=>r.localPort).filter(Boolean))].sort((a,b)=>a-b);
  const bar=document.getElementById('port-bar');
  if(ports.length<=1){bar.style.display='none';return;}
  bar.style.display='flex';
  bar.innerHTML=
    \`<button class="fbtn\${portFilter==='all'?' on':''}" onclick="setPortFilter('all')">All Ports</button>\`+
    ports.map(p=>\`<button class="fbtn\${portFilter===p?' on':''}" onclick="setPortFilter(\${p})">:\${p}</button>\`).join('');
}

// ── Pause ─────────────────────────────────────────────────────────────────────
function togglePause(){
  paused=!paused;
  if(!paused&&pauseQueue.length>0){
    pauseQueue.reverse().forEach(r=>reqs.unshift(r));
    pauseQueue=[]; render(); updateStats();
  }
  updatePauseBtn();
}
function updatePauseBtn(){
  const btn=document.getElementById('pause-btn');
  if(paused){
    btn.className='hbtn pause-on';
    btn.innerHTML=\`<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Resume\${pauseQueue.length?\` <span class="badge-cnt">\${pauseQueue.length}</span>\`:''}\`;
  } else {
    btn.className='hbtn';
    btn.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
async function toggleNotif(){
  if(!('Notification' in window)){alert('Browser tidak mendukung notifikasi.');return;}
  if(Notification.permission==='denied'){alert('Notifikasi diblokir. Aktifkan di pengaturan browser.');return;}
  if(Notification.permission!=='granted'){ const p=await Notification.requestPermission(); if(p!=='granted') return; }
  notifEnabled=!notifEnabled;
  document.getElementById('notif-btn').className=notifEnabled?'hbtn active':'hbtn';
}
function notify(r){
  if(!notifEnabled||Notification.permission!=='granted') return;
  const n=new Notification('Absenku Net',{body:\`\${r.method} \${r.url} → \${r.status||'...'}\`});
  setTimeout(()=>n.close(),3000);
}

// ── Export HAR (exports visible/filtered requests) ────────────────────────────
function exportHAR(){
  const toExport=getVisibleReqs().filter(r=>r.status);
  const entries=toExport.map(r=>({
    startedDateTime:r.time,time:r.ms||0,
    request:{method:r.method,url:'http://tunnel'+r.url,httpVersion:'HTTP/1.1',
      headers:Object.entries(r.reqHeaders||{}).map(([name,value])=>({name,value:String(value)})),
      queryString:[],bodySize:r.reqBody?r.reqBody.length:-1,
      ...(r.reqBody?{postData:{mimeType:r.reqHeaders?.['content-type']||'text/plain',text:r.reqBody}}:{})},
    response:{status:r.status,statusText:'',httpVersion:'HTTP/1.1',
      headers:Object.entries(r.resHeaders||{}).map(([name,value])=>({name,value:String(value)})),
      content:{size:r.size||0,mimeType:r.resHeaders?.['content-type']||'text/plain',text:r.resBody||''},
      bodySize:r.size||-1,redirectURL:'',headersSize:-1},
    timings:{send:0,wait:r.ms||0,receive:0},cache:{},
  }));
  const blob=new Blob([JSON.stringify({log:{version:'1.2',creator:{name:'Absenku Net',version:'1.0'},entries}},null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=\`absenku-\${toExport.length}req-\${new Date().toISOString().slice(0,10)}.har\`;
  a.click(); URL.revokeObjectURL(a.href);
}

// ── Mocks badge ───────────────────────────────────────────────────────────────
function updateMocksBadge(){
  const cnt=document.getElementById('mocks-cnt');
  cnt.textContent=mockList.length;
  cnt.style.display=mockList.length?'inline':'none';
}

// ── Render list ───────────────────────────────────────────────────────────────
function render(){
  const q=document.getElementById('search').value.toLowerCase();
  const f=getVisibleReqs();
  updatePortBar();
  document.getElementById('cnt').textContent=f.length;
  if(timelineMode){ renderTimeline(f); if(sel){const r=reqs.find(x=>x.id===sel);if(r)drawDetail(r);} return; }
  document.getElementById('empty').style.display=f.length?'none':'flex';
  const list=document.getElementById('reqlist');
  [...list.querySelectorAll('.reqrow')].forEach(e=>e.remove());
  const maxMs=Math.max(...f.filter(r=>r.ms!=null).map(r=>r.ms),1);
  f.forEach(r=>{
    const d=document.createElement('div');
    d.className='reqrow'+(r.id===sel?' active':'');
    d.dataset.id=r.id; d.onclick=()=>pick(r.id);
    const sc=statusClass(r.status), msc=msColor(r.ms);
    const pct=r.ms?Math.max(2,Math.round((r.ms/maxMs)*100)):0;
    d.innerHTML=\`
      <span class="method m\${mc(r.method)}">\${r.method}</span>
      <span class="rpath">\${esc(r.url)}</span>
      <span class="rstatus \${sc}" style="\${r.status?'':'color:var(--dim2)'}">\${r.status||'…'}</span>
      <button class="pin-btn\${pinned.has(r.id)?' on':''}" onclick="togglePin(event,'\${r.id}')">📌</button>
      <div class="rmeta">
        <span class="rtime">\${relTime(r.time)}</span>
        \${r.localPort?'<span class="port-badge">:'+r.localPort+'</span>':''}
        \${r.mocked?'<span class="mock-tag">mock</span>':''}
        \${r.ms!=null
          ?\`<span class="rms" style="color:\${msc}">\${r.ms}ms</span>
            \${r.size!=null?\`<span class="rsize">\${formatSize(r.size)}</span>\`:''}\`
          :'<span style="color:var(--dim2);font-size:10px">pending…</span>'}
      </div>
      \${r.ms!=null?\`<div class="wfall" style="width:\${pct}%;background:\${msc}"></div>\`:''}\`;
    list.appendChild(d);
  });
  if(sel){const r=reqs.find(x=>x.id===sel);if(r)drawDetail(r);}
}

function togglePin(e,id){e.stopPropagation();if(pinned.has(id))pinned.delete(id);else pinned.add(id);render();}

// ── Pick / deselect ───────────────────────────────────────────────────────────
function pick(id){
  sel=id;
  document.querySelectorAll('.reqrow').forEach(e=>e.classList.toggle('active',e.dataset.id===id));
  document.getElementById('nosel').style.display='none';
  document.getElementById('detail').style.display='flex';
  const r=reqs.find(x=>x.id===id); if(r) drawDetail(r);
}
function showNoSel(){
  sel=null;
  document.getElementById('nosel').style.display='flex';
  document.getElementById('detail').style.display='none';
}

// ── Detail header ─────────────────────────────────────────────────────────────
function drawDetail(r){
  const sc=statusClass(r.status);
  const ip=r.reqHeaders?.['cf-connecting-ip']||r.reqHeaders?.['x-forwarded-for']||'';
  document.getElementById('det-head').innerHTML=\`
    <span class="method det-method m\${mc(r.method)}">\${r.method}</span>
    <span class="det-url">\${esc(r.url)}</span>
    <div class="det-meta">
      \${ip?\`<span class="chip-ip">\${esc(ip.split(',')[0].trim())}</span>\`:''}
      \${r.localPort?\`<span class="chip-ip">:\${r.localPort}</span>\`:''}
      \${r.mocked?'<span class="chip-mock">mocked</span>':''}
      <span class="chip \${sc}">\${r.status||'—'}</span>
      \${r.ms!=null?\`<span class="chip-ms" style="color:\${msColor(r.ms)}">\${r.ms}ms</span>\`:''}
      \${r.size!=null?\`<span class="chip-size">\${formatSize(r.size)}</span>\`:''}
    </div>\`;
  drawTab(r);
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function setTab(name,el){
  curtab=name;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  const r=reqs.find(x=>x.id===sel); if(r) drawTab(r);
}
function drawTab(r){
  const el=document.getElementById('tab-body');
  if(curtab==='req')         el.innerHTML=renderHeaders(r.reqHeaders)+renderBody(r.reqBody);
  else if(curtab==='res')    el.innerHTML=renderHeaders(r.resHeaders)+renderBody(r.resBody);
  else if(curtab==='preview') el.innerHTML=renderPreview(r);
  else el.innerHTML=\`<div class="section"><div class="sec-title">Raw Request</div>
    <pre class="body-view">\${esc(r.method+' '+r.url+' HTTP/1.1\\n'+
      Object.entries(r.reqHeaders||{}).map(([k,v])=>k+': '+v).join('\\n')+
      (r.reqBody?'\\n\\n'+r.reqBody:''))}</pre></div>\`;
}
function renderHeaders(h){
  if(!h||!Object.keys(h).length) return'<div class="section"><div class="sec-title">Headers</div><p class="nobody">No headers</p></div>';
  const rows=Object.entries(h).map(([k,v])=>
    \`<tr><td>\${esc(k)}</td><td>\${esc(String(v))}<button class="copy-btn" data-val="\${escAttr(String(v))}" onclick="copyAttr(event)">copy</button></td></tr>\`
  ).join('');
  return\`<div class="section"><div class="sec-title">Headers</div><table class="htable">\${rows}</table></div>\`;
}
function renderBody(b){
  if(!b||!b.trim()) return'<div class="section"><div class="sec-title">Body</div><p class="nobody">Empty body</p></div>';
  const json=isJSON(b);
  const code=json
    ?\`<div class="body-view json">\${highlightJSON(b)}<button class="body-copy" data-val="\${escAttr(b)}" onclick="copyAttr(event)">copy</button></div>\`
    :\`<pre class="body-view">\${esc(b)}<button class="body-copy" data-val="\${escAttr(b)}" onclick="copyAttr(event)">copy</button></pre>\`;
  return\`<div class="section"><div class="sec-title">Body \${json?'<span style="color:var(--acc2);font-size:10px;font-weight:500;text-transform:none;letter-spacing:0">JSON</span>':''}</div>\${code}</div>\`;
}
function copyAttr(e){
  e.stopPropagation();
  const btn=e.currentTarget, val=btn.dataset.val, orig=btn.textContent;
  navigator.clipboard.writeText(val).then(()=>{btn.textContent='✓';setTimeout(()=>btn.textContent=orig,1200);});
}

// ── Replay ────────────────────────────────────────────────────────────────────
async function replayReq(){
  if(!sel) return;
  const btn=document.getElementById('replay-btn');
  btn.disabled=true; btn.className='action-btn replay-btn';
  btn.innerHTML='… Sending';
  try{
    const d=await(await fetch('/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:sel})})).json();
    btn.className='action-btn replay-btn '+(d.ok?'ok':'err');
    btn.innerHTML=d.ok?\`✓ \${d.status}\`:'✗ Failed';
  }catch{ btn.className='action-btn replay-btn err'; btn.innerHTML='✗ Error'; }
  setTimeout(()=>{btn.disabled=false;btn.className='action-btn replay-btn';btn.innerHTML='<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Replay';},2500);
}

// ── Edit & Replay modal ───────────────────────────────────────────────────────
function openEditReplay(){
  if(!sel) return;
  const r=reqs.find(x=>x.id===sel); if(!r) return;
  editLocalPort=r.localPort||null;
  openModal('Edit & Replay',\`
    <div class="form-row">
      <div class="form-group" style="flex:0 0 110px"><label>Method</label>
        <select id="ed-method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>HEAD</option></select></div>
      <div class="form-group"><label>URL / Path</label><input type="text" id="ed-url"></div>
    </div>
    <div class="form-group" style="margin-bottom:12px"><label>Headers <span class="form-hint">(JSON object)</span></label>
      <textarea id="ed-headers" rows="6" spellcheck="false"></textarea></div>
    <div class="form-group"><label>Body</label><textarea id="ed-body" rows="5" spellcheck="false"></textarea></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="ed-send-btn" onclick="sendEditReplay()">▶ Send</button>
    </div>\`);
  document.getElementById('ed-method').value=r.method;
  document.getElementById('ed-url').value=r.url;
  const h={...r.reqHeaders}; delete h['host']; delete h['connection']; delete h['content-length'];
  document.getElementById('ed-headers').value=JSON.stringify(h,null,2);
  document.getElementById('ed-body').value=r.reqBody||'';
}
async function sendEditReplay(){
  const method=document.getElementById('ed-method').value;
  const url=document.getElementById('ed-url').value.trim();
  if(!url){alert('URL tidak boleh kosong');return;}
  let headers={};
  try{ headers=JSON.parse(document.getElementById('ed-headers').value||'{}'); }
  catch{ alert('Headers bukan JSON valid'); return; }
  const bodyStr=document.getElementById('ed-body').value;
  const bodyB64=bodyStr?btoa(unescape(encodeURIComponent(bodyStr))):'';
  const btn=document.getElementById('ed-send-btn');
  btn.disabled=true; btn.textContent='Sending…';
  try{
    const d=await(await fetch('/replay-custom',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({method,url,headers,bodyB64,localPort:editLocalPort})})).json();
    btn.textContent=d.ok?\`✓ \${d.status}\`:'✗ Failed';
    if(d.ok) setTimeout(closeModal,1000);
  }catch{ btn.textContent='✗ Error'; }
  btn.disabled=false;
}

// ── Mock modal ────────────────────────────────────────────────────────────────
function openMockFromReq(){
  if(!sel) return;
  const r=reqs.find(x=>x.id===sel); if(!r) return;
  openMockEditor({method:r.method,path:r.url.split('?')[0],status:r.status||200,
    headers:JSON.stringify(r.resHeaders||{'content-type':'application/json'},null,2),body:r.resBody||''});
}
function openMockEditor(p){
  openModal('Create / Edit Mock',\`
    <div class="form-row">
      <div class="form-group" style="flex:0 0 110px"><label>Method</label>
        <select id="mk-method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option></select></div>
      <div class="form-group"><label>Path pattern</label><input type="text" id="mk-path" placeholder="/api/endpoint">
        <span class="form-hint">Exact match atau tanpa query string</span></div>
    </div>
    <div class="form-group" style="margin-bottom:12px"><label>Status code</label>
      <input type="number" id="mk-status" min="100" max="599" style="width:100px"></div>
    <div class="form-group" style="margin-bottom:12px"><label>Response Headers <span class="form-hint">(JSON)</span></label>
      <textarea id="mk-headers" rows="4" spellcheck="false"></textarea></div>
    <div class="form-group"><label>Response Body</label>
      <textarea id="mk-body" rows="5" spellcheck="false"></textarea></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="mk-save-btn" onclick="saveMock()">💾 Save Mock</button>
    </div>\`);
  if(p){
    document.getElementById('mk-method').value=p.method;
    document.getElementById('mk-path').value=p.path||'';
    document.getElementById('mk-status').value=p.status||200;
    document.getElementById('mk-headers').value=p.headers||'{"content-type":"application/json"}';
    document.getElementById('mk-body').value=p.body||'';
  }
}
async function saveMock(){
  const method=document.getElementById('mk-method').value;
  const path=document.getElementById('mk-path').value.trim();
  if(!path){alert('Path tidak boleh kosong');return;}
  const status=parseInt(document.getElementById('mk-status').value)||200;
  let headers={};
  try{ headers=JSON.parse(document.getElementById('mk-headers').value||'{}'); }
  catch{ alert('Headers bukan JSON valid'); return; }
  const body=document.getElementById('mk-body').value;
  const btn=document.getElementById('mk-save-btn');
  btn.disabled=true; btn.textContent='Saving…';
  try{
    const d=await(await fetch('/mocks',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({method,path,status,headers,body})})).json();
    if(d.ok){ closeModal(); }
    else{ btn.textContent='✗ Error'; btn.disabled=false; }
  }catch{ btn.textContent='✗ Error'; btn.disabled=false; }
}

// ── Mocks list ────────────────────────────────────────────────────────────────
function openMocksList(){ renderMocksList(); }
function renderMocksList(){
  const items=mockList.length
    ?mockList.map(m=>{
      const[method,path]=m.key.split(':');
      return\`<div class="mock-list-item">
        <span class="method m\${mc(method)}">\${method}</span>
        <span class="mock-list-path">\${esc(path)}</span>
        <span class="mock-list-status \${statusClass(m.status)}">\${m.status}</span>
        <button class="mock-del" data-key="\${escAttr(m.key)}" onclick="deleteMock(this)">✕</button>
      </div>\`;}).join('')
    :'<div class="empty-mocks">Belum ada mock. Pilih request lalu klik <b>Mock</b>.</div>';
  openModal(\`Mocks (\${mockList.length})\`,\`
    <div id="mocks-items">\${items}</div>
    <div class="modal-footer" style="margin-top:8px">
      <button class="btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn-primary" onclick="closeModal();openMockEditor(null)">+ New Mock</button>
    </div>\`);
}
async function deleteMock(btn){
  const key=btn.dataset.key; btn.textContent='…'; btn.disabled=true;
  try{
    await fetch('/mocks',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
    mockList=mockList.filter(m=>m.key!==key);
    updateMocksBadge(); renderMocksList();
  }catch{ btn.textContent='✕'; btn.disabled=false; }
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(title,html,wide=false){
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=html;
  const m=document.querySelector('#overlay .modal');
  if(wide) m.classList.add('wide'); else m.classList.remove('wide');
  document.getElementById('overlay').classList.add('open');
}
function closeModal(){ document.getElementById('overlay').classList.remove('open'); }
function overlayClick(e){ if(e.target===document.getElementById('overlay')) closeModal(); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

function clearAll(){ sel=null; showNoSel(); fetch('/clear',{method:'POST'}); }

// ── Shortcuts popup ───────────────────────────────────────────────────────────
function toggleShortcuts(){
  document.getElementById('shortcut-popup').classList.toggle('open');
}
document.addEventListener('click',e=>{
  const popup=document.getElementById('shortcut-popup');
  if(!popup.classList.contains('open')) return;
  if(!popup.contains(e.target)&&!document.getElementById('shortcuts-btn').contains(e.target))
    popup.classList.remove('open');
});

// ── Copy as cURL ──────────────────────────────────────────────────────────────
function copyAsCurl(){
  if(!sel) return;
  const r=reqs.find(x=>x.id===sel); if(!r) return;

  // Headers to skip: infra noise, browser-only hints, proxy-injected
  const skipExact=new Set([
    'host','connection','content-length','transfer-encoding',
    'accept-encoding',           // replaced by --compressed flag
    'cdn-loop',
    'x-forwarded-for','x-forwarded-proto','x-forwarded-host',
    'upgrade-insecure-requests','priority',
  ]);
  // Prefixes to skip entirely
  const skipPrefix=['cf-','sec-ch-ua','sec-fetch'];

  const host=r.reqHeaders?.host||'<tunnel-url>';
  const hasEncoding=(r.reqHeaders?.['accept-encoding']||'').match(/gzip|br|deflate/);

  let cmd='curl';
  if(r.method!=='GET') cmd+=\` -X \${r.method}\`;
  if(hasEncoding) cmd+=' --compressed';
  cmd+=\` 'https://\${host}\${r.url}'\`;

  for(const[k,v] of Object.entries(r.reqHeaders||{})){
    const kl=k.toLowerCase();
    if(skipExact.has(kl)) continue;
    if(skipPrefix.some(p=>kl.startsWith(p))) continue;
    cmd+=\` \\\\\n  -H '\${k}: \${String(v).replace(/'/g,"'\\\\''")}\`+\`'\`;
  }
  if(r.reqBody&&r.reqBody.trim()) cmd+=\` \\\\\n  -d '\${r.reqBody.replace(/'/g,"'\\\\''")}\`+\`'\`;

  navigator.clipboard.writeText(cmd).then(()=>{
    const btn=document.getElementById('curl-btn');
    const orig=btn.innerHTML; btn.className='action-btn curl-btn copied'; btn.textContent='✓ Copied';
    setTimeout(()=>{btn.className='action-btn curl-btn';btn.innerHTML=orig;},2000);
  });
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  const tag=e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
  if(document.getElementById('overlay').classList.contains('open')) return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();
    const visible=getVisibleReqs(); if(!visible.length) return;
    const idx=sel?visible.findIndex(r=>r.id===sel):-1;
    const next=e.key==='ArrowDown'?Math.min(idx+1,visible.length-1):Math.max(idx-1,0);
    if(visible[next]){
      pick(visible[next].id);
      const el=document.querySelector(\`.reqrow[data-id="\${visible[next].id}"]\`);
      if(el) el.scrollIntoView({block:'nearest'});
    }
  }
  if((e.key==='r'||e.key==='R')&&!e.metaKey&&!e.ctrlKey) replayReq();
  if((e.key==='u'||e.key==='U')&&!e.metaKey&&!e.ctrlKey) copyAsCurl();
  if((e.key==='c'||e.key==='C')&&!e.metaKey&&!e.ctrlKey&&sel){
    const r=reqs.find(x=>x.id===sel);
    if(r?.reqBody) navigator.clipboard.writeText(r.reqBody);
  }
});

// ── Resize sidebar ────────────────────────────────────────────────────────────
(function initResize(){
  const handle=document.getElementById('resize-handle');
  const sidebar=document.getElementById('sidebar');
  let dragging=false,startX=0,startW=0;
  handle.addEventListener('mousedown',e=>{
    dragging=true; startX=e.clientX; startW=sidebar.offsetWidth;
    handle.classList.add('resizing');
    document.body.style.cssText+='cursor:col-resize!important;user-select:none!important';
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging) return;
    const w=Math.max(180,Math.min(560,startW+(e.clientX-startX)));
    sidebar.style.width=w+'px';
  });
  document.addEventListener('mouseup',()=>{
    if(!dragging) return;
    dragging=false; handle.classList.remove('resizing');
    document.body.style.cursor=''; document.body.style.userSelect='';
    localStorage.setItem('absenku-sidebar-w',sidebar.style.width);
  });
  const saved=localStorage.getItem('absenku-sidebar-w');
  if(saved) sidebar.style.width=saved;
})();

// ── Theme toggle ──────────────────────────────────────────────────────────────
function _applyTheme(isLight){
  document.documentElement.classList.toggle('light',isLight);
  document.getElementById('theme-icon-moon').style.display=isLight?'none':'block';
  document.getElementById('theme-icon-sun').style.display=isLight?'block':'none';
}
function toggleTheme(){
  const isLight=document.documentElement.classList.toggle('light');
  const theme=isLight?'light':'dark';
  localStorage.setItem('absenku-theme',theme);
  document.getElementById('theme-icon-moon').style.display=isLight?'none':'block';
  document.getElementById('theme-icon-sun').style.display=isLight?'block':'none';
  // Sync up to Electron launcher (if running inside iframe)
  try{window.parent.postMessage({type:'absenku-theme',theme},'*');}catch{}
}
(function initTheme(){
  const saved=localStorage.getItem('absenku-theme');
  const preferLight=saved?saved==='light':window.matchMedia('(prefers-color-scheme: light)').matches;
  if(preferLight){
    document.documentElement.classList.add('light');
    document.getElementById('theme-icon-moon').style.display='none';
    document.getElementById('theme-icon-sun').style.display='block';
  }
})();
// Receive theme push from Electron launcher
window.addEventListener('message',e=>{
  if(!e.data)return;
  if(e.data.type==='absenku-theme'){_applyTheme(e.data.theme==='light');return;}
  if(e.data.type==='absenku-port-filter'){
    const p=e.data.port;
    portFilter=p||'all';
    render();
    // Scroll sidebar to top so user sees filtered results
    const sb=document.getElementById('req-list');
    if(sb)sb.scrollTop=0;
  }
});

// ── Request Diff ──────────────────────────────────────────────────────────────
function openDiff(){
  if(reqs.length<2){alert('Perlu minimal 2 request untuk diff.');return;}
  const opts=reqs.map((r,i)=>
    \`<option value="\${escAttr(r.id)}">\${esc(r.method+' '+r.url.slice(0,55))} (\${r.status||'…'})</option>\`
  ).join('');
  const opts2=reqs.slice(1).map(r=>
    \`<option value="\${escAttr(r.id)}">\${esc(r.method+' '+r.url.slice(0,55))} (\${r.status||'…'})</option>\`
  ).join('');
  openModal('Request Diff',\`
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <div style="flex:1">
        <div class="sec-title" style="margin-bottom:5px">Request A</div>
        <select id="diff-a" style="width:100%;background:var(--bg);border:1px solid var(--brd);border-radius:6px;color:var(--txt);padding:7px 10px;font:11px var(--mono);outline:none">\${opts}</select>
      </div>
      <div style="flex:1">
        <div class="sec-title" style="margin-bottom:5px">Request B</div>
        <select id="diff-b" style="width:100%;background:var(--bg);border:1px solid var(--brd);border-radius:6px;color:var(--txt);padding:7px 10px;font:11px var(--mono);outline:none">\${opts2}</select>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:14px">
      <button class="btn-primary" onclick="runDiff()">↔ Compare</button>
    </div>
    <div id="diff-result"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid var(--brd)">
      <button class="btn-ghost" onclick="closeModal()">Close</button>
    </div>\`,true);
  if(sel) document.getElementById('diff-a').value=sel;
}
function runDiff(){
  const idA=document.getElementById('diff-a').value;
  const idB=document.getElementById('diff-b').value;
  if(idA===idB){document.getElementById('diff-result').innerHTML='<p class="nobody" style="text-align:center">Pilih request yang berbeda</p>';return;}
  const a=reqs.find(r=>r.id===idA), b=reqs.find(r=>r.id===idB);
  if(!a||!b) return;
  function lineDiff(ta,tb){
    const la=(ta||'').split('\\n'), lb=(tb||'').split('\\n');
    let h=''; const max=Math.max(la.length,lb.length);
    for(let i=0;i<max;i++){
      const la_=la[i]??null, lb_=lb[i]??null;
      if(la_===lb_) h+=\`<div class="diff-same">\${esc(la_||'')}</div>\`;
      else{
        if(la_!==null) h+=\`<div class="diff-del">- \${esc(la_)}</div>\`;
        if(lb_!==null) h+=\`<div class="diff-add">+ \${esc(lb_)}</div>\`;
      }
    }
    return h||'<span class="nobody">Empty</span>';
  }
  const hdrStr=r=>(Object.entries(r||{}).map(([k,v])=>k+': '+v).join('\\n'));
  document.getElementById('diff-result').innerHTML=\`
    <div class="section"><div class="sec-title">URL & Method</div>
      <div class="body-view" style="max-height:80px">\${lineDiff(a.method+' '+a.url,b.method+' '+b.url)}</div></div>
    <div class="section"><div class="sec-title">Request Headers</div>
      <div class="body-view" style="max-height:160px">\${lineDiff(hdrStr(a.reqHeaders),hdrStr(b.reqHeaders))}</div></div>
    <div class="section"><div class="sec-title">Request Body</div>
      <div class="body-view" style="max-height:130px">\${lineDiff(a.reqBody,b.reqBody)}</div></div>
    <div class="section"><div class="sec-title">Response (\${a.status||'—'} vs \${b.status||'—'})</div>
      <div class="body-view" style="max-height:130px">\${lineDiff(a.resBody,b.resBody)}</div></div>\`;
}

// ── Timeline view ─────────────────────────────────────────────────────────────
function toggleTimeline(){
  timelineMode=!timelineMode;
  const btn=document.getElementById('tl-btn');
  btn.className=timelineMode?'hbtn active':'hbtn';
  render();
}
function renderTimeline(f){
  const list=document.getElementById('reqlist');
  [...list.children].forEach(e=>e.remove());
  if(!f.length){
    document.getElementById('empty').style.display='flex'; return;
  }
  document.getElementById('empty').style.display='none';
  const times=f.map(r=>new Date(r.time).getTime());
  const t0=Math.min(...times);
  const t1=Math.max(...times,t0+500);
  const span=t1-t0||1000;
  // Header axis
  const hdr=document.createElement('div');
  hdr.className='tl-hdr';
  hdr.innerHTML=\`<span class="tl-hdr-txt">0ms</span><span class="tl-hdr-txt">\${f.length} requests · span: \${span<1000?span+'ms':(span/1000).toFixed(1)+'s'}</span><span class="tl-hdr-txt">\${span<1000?span+'ms':(span/1000).toFixed(1)+'s'}</span>\`;
  list.appendChild(hdr);
  const maxMs=Math.max(...f.filter(r=>r.ms!=null).map(r=>r.ms),50);
  f.forEach(r=>{
    const d=document.createElement('div');
    d.className='tl-row'+(r.id===sel?' active':'');
    d.dataset.id=r.id; d.onclick=()=>pick(r.id);
    const tStart=new Date(r.time).getTime()-t0;
    const leftPct=Math.max(0,(tStart/span)*100);
    const widPct=r.ms?Math.max(.5,(r.ms/span)*100):0.5;
    const msc=msColor(r.ms);
    d.innerHTML=\`
      <div class="tl-label">
        <span class="method m\${mc(r.method)}" style="font-size:9px;padding:1px 4px">\${r.method}</span>
        <span class="tl-url">\${esc(r.url.split('?')[0])}</span>
        \${r.ms!=null?\`<span style="font-size:9px;font-family:var(--mono);color:\${msc};margin-left:auto;flex-shrink:0">\${r.ms}ms</span>\`:''}
      </div>
      <div class="tl-track">
        <div class="tl-bar" style="left:\${leftPct.toFixed(1)}%;width:\${Math.min(widPct,100-leftPct).toFixed(1)}%;background:\${msc}">
          \${r.ms&&r.ms>80?\`<span class="tl-ms">\${r.ms}ms</span>\`:''}
        </div>
      </div>\`;
    list.appendChild(d);
  });
}

// ── Header injection UI ───────────────────────────────────────────────────────
function updateInjectBadge(){
  const cnt=document.getElementById('inject-cnt');
  if(!cnt) return;
  cnt.textContent=injectList.length;
  cnt.style.display=injectList.length?'inline':'none';
}
function openInject(){
  renderInjectList();
}
function renderInjectList(){
  const ports=[...new Set(reqs.map(r=>r.localPort).filter(Boolean))].sort((a,b)=>a-b);
  const portOpts=\`<option value="*">* (Global — semua port)</option>\`+
    ports.map(p=>\`<option value="\${p}">:\${p}</option>\`).join('');
  const items=injectList.length
    ?injectList.map(rule=>{
      const portLbl=rule.port==='*'?'* global':':'+rule.port;
      const hdrs=Object.entries(rule.headers||{}).map(([k,v])=>k+': '+v).join(', ');
      return\`<div class="inj-item">
        <span class="inj-port">\${esc(String(portLbl))}</span>
        <span class="inj-headers">\${esc(hdrs)}</span>
        <button class="mock-del" data-port="\${escAttr(String(rule.port))}" onclick="deleteInject(this)" title="Hapus">✕</button>
      </div>\`;
    }).join('')
    :'<div class="empty-mocks">Belum ada injection rule.</div>';
  openModal('Header Injection',\`
    <div id="inj-items">\${items}</div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--brd)">
      <div style="font-size:11px;font-weight:600;color:var(--dim);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Tambah Rule Baru</div>
      <div class="form-row">
        <div class="form-group" style="flex:0 0 160px"><label>Berlaku untuk</label>
          <select id="inj-port" style="background:var(--bg);border:1px solid var(--brd);border-radius:6px;color:var(--txt);padding:7px 10px;font:12px var(--mono);outline:none;width:100%">\${portOpts}</select></div>
        <div class="form-group"><label>Headers <span class="form-hint">(JSON object)</span></label>
          <textarea id="inj-headers" rows="3" placeholder='{"Authorization":"Bearer token","X-Custom":"value"}' spellcheck="false"></textarea></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn-ghost" onclick="closeModal()">Close</button>
        <button class="btn-primary" onclick="saveInject()">+ Add Rule</button>
      </div>
    </div>\`);
}
async function saveInject(){
  const port=document.getElementById('inj-port').value;
  let headers={};
  try{ headers=JSON.parse(document.getElementById('inj-headers').value||'{}'); }
  catch{ alert('Headers harus JSON valid. Contoh: {"Authorization":"Bearer token"}'); return; }
  if(!Object.keys(headers).length){alert('Headers tidak boleh kosong');return;}
  const key=port==='*'?'*':Number(port);
  // Merge with existing rule for this port
  const existing=(injectList.find(r=>String(r.port)===String(key))||{}).headers||{};
  const merged={...existing,...headers};
  try{
    await fetch('/inject',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({port,headers:merged})});
    document.getElementById('inj-headers').value='';
    renderInjectList();
  }catch(e){alert('Error: '+e.message);}
}
async function deleteInject(btn){
  const port=btn.dataset.port; btn.textContent='…'; btn.disabled=true;
  try{
    await fetch('/inject',{method:'DELETE',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({port:port==='*'?'*':Number(port)})});
  }catch(e){btn.textContent='✕';btn.disabled=false;}
}

// ── Response Preview ──────────────────────────────────────────────────────────
function renderPreview(r){
  const ct=(r.resHeaders?.['content-type']||'').split(';')[0].trim().toLowerCase();
  if(!ct&&!r.resBody&&!r.resBodyB64)
    return'<div class="section"><p class="nobody">No response body</p></div>';

  // Binary images — served via /body/:id endpoint
  if(ct.startsWith('image/')){
    return\`<div class="section">
      <div class="sec-title">Image Preview <span style="color:var(--dim2);font-size:9px;text-transform:none;letter-spacing:0;font-weight:400">\${ct}</span></div>
      <div style="background:repeating-conic-gradient(rgba(128,128,128,.15) 0% 25%,transparent 0% 50%) 0 0/16px 16px;border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center">
        <img src="/body/\${r.id}" alt="response" style="max-width:100%;max-height:420px;border-radius:4px;display:block;margin:0 auto">
      </div>
    </div>\`;
  }

  // HTML — render in sandboxed iframe via srcdoc
  if(ct==='text/html'||ct==='application/xhtml+xml'){
    if(!r.resBody) return'<div class="section"><p class="nobody">Empty HTML response</p></div>';
    const safe=escAttr(r.resBody);
    return\`<div class="section">
      <div class="sec-title">HTML Preview <span style="color:var(--dim2);font-size:9px;text-transform:none;letter-spacing:0;font-weight:400">sandboxed · scripts disabled</span></div>
      <iframe srcdoc="\${safe}" sandbox="allow-same-origin allow-forms" style="width:100%;height:420px;border:1px solid var(--brd);border-radius:8px;background:#fff;display:block"></iframe>
    </div>\`;
  }

  // SVG — render inline in a white box
  if(ct==='image/svg+xml'&&r.resBody){
    return\`<div class="section">
      <div class="sec-title">SVG Preview</div>
      <div style="background:#fff;border:1px solid var(--brd);border-radius:8px;padding:16px;text-align:center;overflow:auto">
        \${r.resBody}
      </div>
    </div>\`;
  }

  return\`<div class="section"><p class="nobody">No preview available for <code style="background:var(--s2);padding:2px 6px;border-radius:4px">\${esc(ct||'unknown content-type')}</code><br><span style="font-size:11px;color:var(--dim2)">HTML, SVG dan image (PNG/JPG/GIF/WebP) yang bisa di-preview</span></p></div>\`;
}

// ── Stats per endpoint ────────────────────────────────────────────────────────
function computeStats(){
  const map=new Map();
  for(const r of reqs){
    const key=(r.method||'?')+' '+(r.url||'').split('?')[0];
    if(!map.has(key)) map.set(key,{count:0,msTotal:0,msCnt:0,errors:0});
    const s=map.get(key);
    s.count++;
    if(r.ms!=null){s.msTotal+=r.ms;s.msCnt++;}
    if(r.status>=400) s.errors++;
  }
  return[...map.entries()]
    .map(([key,s])=>{const[m,...pp]=key.split(' ');return{method:m,path:pp.join(' '),
      count:s.count,avgMs:s.msCnt?Math.round(s.msTotal/s.msCnt):null,
      errPct:Math.round((s.errors/s.count)*100)};})
    .sort((a,b)=>b.count-a.count);
}
function openStats(){
  if(!reqs.length){alert('Belum ada request.');return;}
  const stats=computeStats();
  const rows=stats.map(s=>{
    const avgStr=s.avgMs!=null?\`<span style="color:\${msColor(s.avgMs)};font-family:var(--mono)">\${s.avgMs}ms</span>\`:'<span style="color:var(--dim2)">—</span>';
    const errStr=s.errPct>0?\`<span style="color:var(--r);font-family:var(--mono)">\${s.errPct}%</span>\`:'<span style="color:var(--g);font-family:var(--mono)">0%</span>';
    const barW=Math.max(2,Math.round((s.count/stats[0].count)*100));
    const barC=msColor(s.avgMs);
    return\`<tr style="border-bottom:1px solid var(--brd)">
      <td style="padding:7px 10px 7px 0"><span class="method m\${mc(s.method)}">\${s.method}</span></td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:11px;max-width:0;width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${escAttr(s.path)}">\${esc(s.path)}</td>
      <td style="padding:7px 10px;vertical-align:middle;min-width:80px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-family:var(--mono);font-size:12px;font-weight:600;min-width:24px">\${s.count}</span>
          <div style="flex:1;height:4px;background:var(--brd);border-radius:2px;min-width:40px">
            <div style="width:\${barW}%;height:100%;background:\${barC};border-radius:2px;opacity:.7"></div>
          </div>
        </div>
      </td>
      <td style="padding:7px 10px;text-align:center">\${avgStr}</td>
      <td style="padding:7px 0;text-align:center">\${errStr}</td>
    </tr>\`;
  }).join('');
  openModal(\`Stats — \${stats.length} endpoint\${stats.length!==1?'s':''}\`,\`
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="color:var(--dim2);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--brd)">
        <th style="text-align:left;padding:0 10px 8px 0;font-weight:600">Method</th>
        <th style="text-align:left;padding:0 10px 8px;font-weight:600">Endpoint</th>
        <th style="text-align:left;padding:0 10px 8px;font-weight:600">Calls</th>
        <th style="text-align:center;padding:0 10px 8px;font-weight:600">Avg ms</th>
        <th style="text-align:center;padding:0 0 8px;font-weight:600">Errors</th>
      </tr></thead>
      <tbody>\${rows}</tbody>
    </table>
    </div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--brd);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:11px;color:var(--dim2)">Total: \${reqs.length} request dari \${stats.length} endpoint</span>
      <button class="btn-ghost" onclick="closeModal()">Close</button>
    </div>\`);
}

setInterval(()=>{ if(reqs.length) render(); },30000);
</script>
</body>
</html>`;

module.exports = INSPECTOR_HTML;
