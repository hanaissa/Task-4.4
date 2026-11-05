import React,{useEffect,useMemo,useRef,useState} from 'react';

const STORE='acl-foundboard-v3';
// Fictional campus locations for this standalone teaching demo.
// A found report can exist before the item has been received by staff.
const seed=[
 {id:'f1',title:'Black backpack',category:'accessories',status:'lost',location:'Library - second floor',description:'Black backpack with a small red keychain. Left near the study desks.',owner:'you',created:'Oct 23',emoji:'🎒'},
 {id:'f2',title:'Dark backpack',category:'accessories',status:'found',location:'Library - main stairwell',description:'Found a dark backpack with a small red keychain near the library stairs.',owner:'other',created:'Oct 24',emoji:'🎒',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f3',title:'Student ID card',category:'documents',status:'found',location:'Near Gate 3',description:'A student card was turned in. No personal details are published.',owner:'other',created:'Oct 24',emoji:'🪪',collectionPoint:'Student Services Office',handoverStatus:'received'},
 {id:'f4',title:'Wireless earbuds',category:'electronics',status:'lost',location:'Main cafeteria',description:'White earbuds in a distinctive blue case. Lost on Monday.',owner:'other',created:'Oct 24',emoji:'🎧'},
 {id:'f5',title:'Earbuds in blue case',category:'electronics',status:'found',location:'Cafeteria entrance',description:'White earbuds in a blue charging case found near the coffee counter.',owner:'other',created:'Oct 25',emoji:'🎧',collectionPoint:'',handoverStatus:'reported'},
 {id:'f6',title:'Blue sports bottle',category:'other',status:'lost',location:'Sports Hall - lockers',description:'Tall blue metal water bottle, possibly left after practice.',owner:'other',created:'Oct 25',emoji:'🥤'},
 {id:'f7',title:'Metal water bottle',category:'other',status:'found',location:'Sports Hall - benches',description:'Blue reusable metal bottle found after a basketball session.',owner:'other',created:'Oct 25',emoji:'🥤',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f8',title:'Engineering lab coat',category:'clothing',status:'claimed',location:'Building C',description:'Owner verified the item and collected it from the reception desk.',owner:'you',created:'Oct 22',emoji:'🥼',collectionPoint:'Library Reception',handoverStatus:'released'},
 {id:'f9',title:'Small notebook',category:'other',status:'lost',location:'C7 lecture room',description:'Brown cover with handwritten engineering notes.',owner:'other',created:'Oct 25',emoji:'📒'},
 {id:'f10',title:'Scientific calculator',category:'electronics',status:'lost',location:'B2 lecture hall',description:'Black scientific calculator with a protective cover.',owner:'other',created:'Oct 26',emoji:'🧮'},
 {id:'f11',title:'Calculator',category:'electronics',status:'found',location:'B2 study area',description:'Scientific calculator with a black cover, found on a desk.',owner:'you',created:'Oct 26',emoji:'🧮',collectionPoint:'Library Reception',handoverStatus:'received'},
 {id:'f12',title:'Canvas tote bag',category:'accessories',status:'lost',location:'Main campus bus stop',description:'Beige tote with green writing on one side.',owner:'other',created:'Oct 26',emoji:'👜'},
 {id:'f13',title:'USB flash drive',category:'electronics',status:'found',location:'Building A computer lab',description:'A small black flash drive was found beside a workstation.',owner:'other',created:'Oct 27',emoji:'💾',collectionPoint:'',handoverStatus:'reported'},
];
const categories=['all','electronics','clothing','documents','accessories','other'];
const statuses=['lost','found','claimed'];
const clean={title:'',category:'',status:'',location:'',description:'',photo:''};
function getSaved(){try{const s=JSON.parse(localStorage.getItem(STORE));return Array.isArray(s)?s:seed;}catch{return seed;}}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function validate(f,arr,id){
 if(!f.title.trim()||f.title.trim().length<2)return 'Title must be at least 2 characters.';
 if(!categories.slice(1).includes(f.category))return 'Choose a category.';
 if(!statuses.includes(f.status))return 'Choose lost, found or claimed.';
 if(arr.some(r=>r.id!==id&&r.title.toLowerCase()===f.title.trim().toLowerCase()&&(r.location||'').toLowerCase()===(f.location||'').trim().toLowerCase()))return 'An item with the same title has already been reported at this location.';
 return '';
}
// Generated example photos for the fictional demo reports (row, column in the atlas).
const photoCells={f1:[0,0],f2:[0,0],f3:[0,1],f4:[0,2],f5:[0,2],f6:[1,0],f7:[1,0],f8:[1,1],f9:[1,2],f10:[2,0],f11:[2,0],f12:[2,1],f13:[2,2]};
function ItemPhoto({item}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[item.id,item.photo]);
 const cell=item.photo===null?null:photoCells[item.id];
 return <div className="item-photo">{item.photo&&!failed?<img className="uploaded-photo" src={item.photo} alt={item.title||'Uploaded item photo'} onError={()=>setFailed(true)}/>:cell&&!failed?<><img src="/images/item-atlas.png" alt={`Example photo of ${item.title}`} loading="lazy" onError={()=>setFailed(true)} style={{left:`-${cell[1]*100}%`,top:`-${cell[0]*100}%`}}/><span className="photo-caption">Example photo</span></>:<div className="photo-fallback"><span aria-hidden="true">{item.emoji}</span><small>No photo available</small></div>}</div>;
}
export default function App(){
 const [items,setItems]=useState(getSaved);
 const [page,setPage]=useState('board');
 const [selectedId,setSelectedId]=useState(null);
 const selectedItem=items.find(item=>item.id===selectedId);
 const [q,setQ]=useState('');
 const [cat,setCat]=useState('all');
 const [filterStatus,setFilterStatus]=useState('all');
 const [pendingCat,setPendingCat]=useState('all');
 const [pendingStatus,setPendingStatus]=useState('all');
 const [current,setCurrent]=useState(null);
 const [form,setForm]=useState(clean);
 const [error,setError]=useState('');
 const [photoError,setPhotoError]=useState('');
 const [uploading,setUploading]=useState(false);
 const photoRequest=useRef(0);
 const [message,setMessage]=useState('');
 const [openMenu,setOpenMenu]=useState(null);
 useEffect(()=>{try{localStorage.setItem(STORE,JSON.stringify(items));}catch{setMessage('Browser storage is full or unavailable. Changes may not be saved.');}},[items]);
 const filtered=useMemo(()=>{
  const terms=q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(x=>{
   const details=[x.title,x.location,x.description,x.category,x.status,x.collectionPoint].filter(Boolean).join(' ').toLowerCase();
   return (cat==='all'||x.category===cat)&&(filterStatus==='all'||x.status===filterStatus)&&terms.every(term=>details.includes(term));
  });
 },[items,q,cat,filterStatus]);
 function create(){photoRequest.current++;setUploading(false);setPhotoError('');setCurrent(null);setForm({...clean});setError('');setPage('form');}
 function edit(row){if(row.owner!=='you')return;photoRequest.current++;setUploading(false);setPhotoError('');setCurrent(row.id);setForm({title:row.title,category:row.category,status:row.status,location:row.location,description:row.description,photo:row.photo===undefined?'':row.photo});setOpenMenu(null);setError('');setPage('form');}
 async function uploadPhoto(e){
  const file=e.target.files?.[0];
  e.target.value='';
  if(!file)return;
  const request=++photoRequest.current;
  setPhotoError('');setUploading(false);
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setPhotoError('Choose a JPG, PNG or WebP photo.');return;}
  if(file.size>5*1024*1024){setPhotoError('Choose a photo smaller than 5 MB.');return;}
  setUploading(true);
  const url=URL.createObjectURL(file);
  try{
   const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Unreadable photo'));image.src=url;});
   const scale=Math.min(1,900/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const context=canvas.getContext('2d');
   context.fillStyle='#fff9df';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);
   const photo=canvas.toDataURL('image/jpeg',0.8);
   if(photo.length>600000)throw new Error('Photo too large');
   if(request===photoRequest.current)setForm(previous=>({...previous,photo}));
  }catch{if(request===photoRequest.current)setPhotoError('This photo could not be processed. Try a smaller JPG, PNG or WebP image.');}
  finally{URL.revokeObjectURL(url);if(request===photoRequest.current)setUploading(false);}
 }
 function submit(e){e.preventDefault();if(uploading)return;const v=validate(form,items,current);if(v){setError(v);return;}const d={...form,title:form.title.trim(),location:form.location.trim(),description:form.description.trim(),owner:'you',created:'Today',emoji:current?items.find(x=>x.id===current)?.emoji:'📌',...(current?{}:{collectionPoint:'',handoverStatus:'reported'})};
 const updated=current?items.map(x=>x.id===current?{...x,...d}:x):[{id:`f-${Date.now()}`,...d},...items];
 try{localStorage.setItem(STORE,JSON.stringify(updated));}catch{setError('Unable to save: browser storage is full or unavailable. Try removing the photo or using a smaller image.');return;}
 setItems(updated);setMessage(current?'Report updated.':'Your report has been posted.');setPage('board');setCurrent(null);}

 function clearFilters(){setQ('');setCat('all');setFilterStatus('all');setPendingCat('all');setPendingStatus('all');}
 function reset(){setItems(seed);setPage('board');clearFilters();setMessage('Example reports restored.');}
 return <div className="notice-app"><header className="header"><div className="headline"><span className="sun">✺</span><button onClick={()=>setPage('board')} className="wordmark">FOUND<span>on campus</span></button><p>Community noticeboard</p></div><div className="header-links"><button onClick={()=>setPage('board')}>Noticeboard</button><button onClick={()=>{setFilterStatus('lost');setPendingStatus('lost');setPage('board')}}>Missing items</button><button onClick={()=>{setFilterStatus('found');setPendingStatus('found');setPage('board')}}>Recently found</button></div></header>
  <div className="ruleline"><span>SEARCH • DISCOVER • REUNITE</span><span>Helping lost things find their way back.</span></div>
  {page==='board'?<main className="workspace"><aside className="filters"><p className="kicker">YOUR NOTICEBOARD</p><h1>Lost something?<br/><em>You're in the right place.</em></h1><p className="intro">Browse what the campus community has shared or post what you've lost or found.</p><div className="side-message"><span>📍</span><strong>Lost or found something?</strong><p>Every report gets us a little closer.</p><button className="report-button" onClick={create}>+ Post a report</button></div><button className="reset" onClick={reset}>Reset demo data</button></aside>
   <section className="board"><div className="board-top"><div><p className="kicker">CAMPUS COMMUNITY</p><h2>Latest notices <span>({filtered.length})</span></h2></div><span className="time-note">Updated today</span></div>{message&&<div className="message" role="status">{message}<button onClick={()=>setMessage('')}>✕</button></div>}
    <div className="item-search" role="search" aria-label="Search item reports">
     <label htmlFor="item-search">Find an item</label>
     <div className="search-input-row"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="item-search" type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search items, descriptions, categories or locations" aria-describedby="search-help search-results"/>{q&&<button type="button" onClick={()=>setQ('')}>Clear search</button>}</div>
     <p id="search-help">Try "backpack", "blue case" or "library". Results update as you type.</p>
     <form className="filterbox report-filters" aria-label="Filter reports" onSubmit={e=>{e.preventDefault();setCat(pendingCat);setFilterStatus(pendingStatus);setMessage('Filters applied.');}}>
      <label>Item category<select value={pendingCat} onChange={e=>setPendingCat(e.target.value)}><option value="all">All categories</option>{categories.slice(1).map(c=><option key={c} value={c}>{cap(c)}</option>)}</select></label>
      <label>Report status<select value={pendingStatus} onChange={e=>setPendingStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select></label>
      <div className="filterbuttons"><button type="submit">Apply</button><button type="button" onClick={()=>{clearFilters();setMessage('Search and filters cleared.');}}>Clear</button></div>
     </form>
     <p id="search-results" role="status" aria-live="polite" aria-atomic="true">{filtered.length} {filtered.length===1?'report':'reports'}{q.trim()?` matching "${q.trim()}"`:''}{cat!=='all'||filterStatus!=='all'?' with your selected filters':''}</p>
    </div>
    {filtered.length===0&&<div className="search-empty"><h3>No matching reports</h3><p>Try a different item name, fewer words or broader filters.</p><button type="button" onClick={clearFilters}>Show all reports</button></div>}
    <div className="board-grid">{filtered.map(item=><article className={`sticky status-${item.status}`} key={item.id}><div className="sticky-top"><span>{item.category}</span><div className="menu-holder"><button className="menu" onClick={()=>setOpenMenu(openMenu===item.id?null:item.id)} aria-label={`Actions for ${item.title}`}>···</button>{openMenu===item.id&&<div className="menu-popup">{item.owner==='you'?<button onClick={()=>edit(item)}>Edit your report</button>:<span>Reported by another student</span>}</div>}</div></div><ItemPhoto item={item}/><div className="card-summary"><h3>{item.title}</h3><span className={`status-badge ${item.status}`}>{cap(item.status)}</span></div><button className="view-details" onClick={()=>{setSelectedId(item.id);setOpenMenu(null);setPage('details');}}>View details<span className="sr-only"> for {item.title}</span></button><div className="sticky-bottom"><span>⌖ {item.location||'Location not provided'}</span><small>{item.created}</small></div></article>)}</div>
   </section></main>:page==='details'&&selectedItem?<main className="item-detail-page"><button className="back-to-board" onClick={()=>setPage('board')}>Back to noticeboard</button><article className="item-detail"><ItemPhoto item={selectedItem}/><div className="item-detail-content"><p className="kicker">{cap(selectedItem.category)} / {selectedItem.created}</p><span className={`status-badge ${selectedItem.status}`}>{cap(selectedItem.status)}</span><h1>{selectedItem.title}</h1><h2>Description</h2><p className="full-description">{selectedItem.description||'No additional description.'}</p><h2>Location</h2><p>{selectedItem.location||'Location not provided'}</p>{selectedItem.status!=='lost'&&<><h2>Collection information</h2><p>{selectedItem.handoverStatus==='received'&&selectedItem.collectionPoint?`Received at ${selectedItem.collectionPoint}`:selectedItem.handoverStatus==='released'?'Collected by owner':'Reported found - not confirmed at a collection point'}</p></>}{selectedItem.owner==='you'&&<button className="report-button" onClick={()=>edit(selectedItem)}>Edit your report</button>}</div></article></main>:<main className="report-page"><div className="crumbs"><button onClick={()=>setPage('board')}>← Noticeboard</button><span>/</span><span>Report an item</span></div><div className="report-layout"><div className="report-intro"><span className="seal">✺</span><p className="kicker">HELP THE COMMUNITY</p><h1>{current?'Update your report':'Tell us what happened.'}</h1><p>Small details can help someone recognize their belongings.</p><div className="paper-note">Your report will appear on the public campus noticeboard with the details you provide.</div></div><section className="form-paper"><header><p>NEW NOTICE / FORM 01</p><h2>{current?'Edit report':'Report an item'}</h2></header><form onSubmit={submit}><label>Item title <b>*</b><input value={form.title} onChange={e=>setForm(s=>({...s,title:e.target.value}))} placeholder="e.g., Black backpack"/></label><label>Status <b>*</b><select value={form.status} onChange={e=>setForm(s=>({...s,status:e.target.value}))}><option value="">Choose one</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select></label><label>Category <b>*</b><select value={form.category} onChange={e=>setForm(s=>({...s,category:e.target.value}))}><option value="">Select item category</option>{categories.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>Last known location<input value={form.location} onChange={e=>setForm(s=>({...s,location:e.target.value}))} placeholder="Location (optional)"/></label><div className="photo-upload"><label htmlFor="report-photo">Upload an item photo <span>(optional)</span></label><input id="report-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} disabled={uploading} aria-describedby="photo-help"/><p id="photo-help">JPG, PNG or WebP, up to 5 MB. Saved with your report in this browser.</p>{uploading&&<p role="status">Preparing photo...</p>}{photoError&&<p className="upload-error" role="alert">{photoError}</p>}{(form.photo||(current&&photoCells[current]&&form.photo!==null))&&<div className="photo-preview"><ItemPhoto item={{id:current,title:form.title,photo:form.photo}}/><button type="button" onClick={()=>{photoRequest.current++;setUploading(false);setPhotoError('');setForm(previous=>({...previous,photo:null}));}}>Remove photo</button></div>}</div><label>More details<textarea rows="6" value={form.description} onChange={e=>setForm(s=>({...s,description:e.target.value}))} placeholder="Describe your item"/></label>{error&&<div className="form-error" role="alert">{error}</div>}<div className="form-actions"><button type="button" onClick={()=>setPage('board')}>Go back</button><button className="report-button" type="submit" disabled={uploading}>{current?'Save report':'Publish notice'}</button></div></form></section></div></main>}
  <footer className="pagefooter"><span>FOUND / Campus noticeboard</span><span>Community project • Demo only</span></footer>
 </div>;
}
