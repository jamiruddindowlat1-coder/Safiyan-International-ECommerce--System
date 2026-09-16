import { useEffect, useState } from 'react';

const defaults={storeName:'Safiyan International ECommerce System',shortName:'SIES',currency:'BDT',taxRate:'5',supportEmail:'support@sies.com',theme:'Blue / Teal'};
export default function Settings(){
 const [form,setForm]=useState(defaults),[saved,setSaved]=useState(false);
 useEffect(()=>{try{const s=localStorage.getItem('sies-settings');if(s)setForm({...defaults,...JSON.parse(s)})}catch{}},[]);
 const save=e=>{e.preventDefault();localStorage.setItem('sies-settings',JSON.stringify(form));setSaved(true);setTimeout(()=>setSaved(false),2500)};
 const reset=()=>{setForm(defaults);localStorage.removeItem('sies-settings')};
 return <div><div style={headerStyle}><div><h1 style={titleStyle}>System Settings</h1><p style={mutedStyle}>Edit and save platform branding and default settings.</p></div></div>
 {saved&&<div style={successStyle}>Settings saved successfully.</div>}
 <form onSubmit={save} style={panelStyle}><div style={gridStyle}>
 {Object.entries({storeName:'Store Name',shortName:'Short Name',currency:'Currency',taxRate:'Tax Rate (%)',supportEmail:'Support Email',theme:'Theme'}).map(([key,label])=><label key={key} style={labelStyle}>{label}<input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={inputStyle}/></label>)}
 </div><div style={{display:'flex',gap:10,marginTop:18}}><button style={buttonStyle}>Save Settings</button><button type="button" onClick={reset} style={secondaryButton}>Reset Defaults</button></div></form></div>;
}
const headerStyle={marginBottom:18},titleStyle={fontSize:28,fontWeight:800,color:'#62b7f5',margin:0},mutedStyle={color:'#9fb6cc',fontSize:14},panelStyle={background:'#0d1b2e',borderRadius:18,padding:22},gridStyle={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16},labelStyle={color:'#9fb6cc',fontSize:13},inputStyle={display:'block',width:'100%',boxSizing:'border-box',marginTop:7,padding:11,border:'1px solid #345',borderRadius:8,background:'#132840',color:'#e5eef8'},buttonStyle={border:'none',background:'linear-gradient(90deg,#0f4c81,#14919b)',color:'#fff',borderRadius:8,padding:'10px 16px',fontWeight:700,cursor:'pointer'},secondaryButton={...buttonStyle,background:'#334155'},successStyle={background:'#dcfce7',color:'#166534',padding:12,borderRadius:8,marginBottom:18};
