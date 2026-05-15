// ══════════ MAKAT REVIEW PANEL (Admin only) ══════════
function MakatReviewPanel({data, onClose, onApprove, onReject, approvals}){
  // Build flat list of all parts with makat
  const allParts = [];
  data.brands.forEach(b => {
    b.categories.forEach(c => {
      const scanModels = (models, subCatName) => {
        models.forEach(m => {
          m.parts.forEach(p => {
            const tadPn = (p.values.tadPn || '').trim();
            const nameHe = (p.values.nameHe || '').trim();
            if(!tadPn && !nameHe) return; // skip empty rows
            const key = b.id + '__' + m.id + '__' + p.id;
            allParts.push({key, b, c, m, p, tadPn, nameHe, subCatName});
          });
        });
      };
      scanModels(c.models, null);
      (c.subCategories||[]).forEach(sc => scanModels(sc.models, sc.name));
    });
  });

  const approved = approvals || {};
  const total = allParts.length;
  const approvedCount = allParts.filter(x => approved[x.key] === 'ok').length;
  const rejectedCount = allParts.filter(x => approved[x.key] === 'fix').length;
  const pendingCount = total - approvedCount - rejectedCount;
  const progress = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const [filter, setFilter] = useState('all'); // all | pending | ok | fix
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');

  const filtered = allParts.filter(x => {
    if(filter === 'pending' && approved[x.key]) return false;
    if(filter === 'ok' && approved[x.key] !== 'ok') return false;
    if(filter === 'fix' && approved[x.key] !== 'fix') return false;
    if(brandFilter !== 'all' && x.b.id !== brandFilter) return false;
    if(search) {
      const q = search.toLowerCase();
      if(!x.tadPn.toLowerCase().includes(q) && !x.nameHe.toLowerCase().includes(q) && !x.m.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const barColor = progress >= 80 ? '#4caf50' : progress >= 40 ? '#ff9800' : '#e53935';

  return(
    <Modal onClose={onClose} wide title="✅ בדיקת מק&quot;טים — מנהל">
      {/* Progress bar */}
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>התקדמות אישור מק"טים</span>
          <span style={{fontSize:13,fontWeight:'bold',color:barColor}}>{approvedCount} / {total} ({progress}%)</span>
        </div>
        <div style={{height:14,background:'var(--border)',borderRadius:8,overflow:'hidden'}}>
          <div style={{height:'100%',width:progress+'%',background:barColor,borderRadius:8,transition:'width .4s'}}/>
        </div>
        <div style={{display:'flex',gap:16,marginTop:8,fontSize:12}}>
          <span style={{color:'#4caf50'}}>✓ אושרו: {approvedCount}</span>
          <span style={{color:'#e53935'}}>✗ לתיקון: {rejectedCount}</span>
          <span style={{color:'var(--sub)'}}>⏳ ממתינים: {pendingCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
        {[['all','הכל'],['pending','ממתינים'],['ok','אושרו ✓'],['fix','לתיקון ✗']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{padding:'5px 12px',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:'bold',
              background:filter===v?(v==='ok'?'#4caf50':v==='fix'?'#e53935':v==='pending'?'#ff9800':'#1565c0'):'var(--row2)',
              color:filter===v?'#fff':'var(--text)'}}>
            {l}
          </button>
        ))}
        <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}
          style={{padding:'5px 10px',border:'1px solid var(--border)',borderRadius:8,fontSize:12,color:'var(--text)',background:'var(--ibg)'}}>
          <option value="all">כל המותגים</option>
          {data.brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש מק&quot;ט / שם..."
          style={{flex:1,minWidth:120,padding:'5px 10px',border:'1px solid var(--border)',borderRadius:8,fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
      </div>

      {/* Bulk actions */}
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <button onClick={()=>filtered.forEach(x=>onApprove(x.key))}
          style={{flex:1,padding:'7px',background:'#e8f5e9',border:'1px solid #4caf50',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:'bold',color:'#2e7d32'}}>
          ✓ אשר את כולם ({filtered.length})
        </button>
        <button onClick={()=>filtered.forEach(x=>onReject(x.key))}
          style={{flex:1,padding:'7px',background:'#ffebee',border:'1px solid #e53935',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:'bold',color:'#c62828'}}>
          ✗ סמן לתיקון ({filtered.length})
        </button>
      </div>

      {/* Parts list */}
      <div style={{maxHeight:'50vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8}}>
        {filtered.length===0&&(
          <div style={{textAlign:'center',padding:30,color:'var(--sub)',fontSize:14}}>אין פריטים להצגה</div>
        )}
        {filtered.map((x,i)=>{
          const status = approved[x.key];
          return(
            <div key={x.key} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',
              borderBottom:'1px solid var(--border)',
              background:status==='ok'?'#e8f5e9':status==='fix'?'#ffebee':i%2===0?'var(--row1)':'var(--row2)'}}>
              {/* Brand badge */}
              <span style={{background:x.b.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{x.b.name}</span>
              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:'var(--sub)',marginBottom:2}}>
                  {x.m.name} {x.subCatName?'· '+x.subCatName:''} · {x.c.name}
                </div>
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontSize:13,fontWeight:'bold',color:'var(--text)'}}>{x.nameHe||'—'}</span>
                  <span style={{fontSize:12,color:'#1565c0',fontFamily:'monospace',background:'#e3f2fd',padding:'1px 6px',borderRadius:4}}>{x.tadPn||'חסר מק"ט'}</span>
                </div>
              </div>
              {/* Action buttons */}
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                <button onClick={()=>onApprove(x.key)}
                  style={{padding:'5px 10px',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:'bold',
                    background:status==='ok'?'#4caf50':'var(--row2)',color:status==='ok'?'#fff':'#4caf50',
                    border:'1px solid #4caf50'}}>✓</button>
                <button onClick={()=>onReject(x.key)}
                  style={{padding:'5px 10px',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:'bold',
                    background:status==='fix'?'#e53935':'var(--row2)',color:status==='fix'?'#fff':'#e53935',
                    border:'1px solid #e53935'}}>✗</button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
    </Modal>
  );
}
