// ══════════ COMPARE PANEL ══════════
function ComparePanel({compareList,data,onClose,onRemove}){
  if(!compareList||compareList.length===0)return null;
  const models=compareList.map(({bid,cid,mid})=>{
    const b=data.brands.find(x=>x.id===bid);
    const c=b&&b.categories.find(x=>x.id===cid);
    const m=c&&c.models.find(x=>x.id===mid);
    return m?{b,c,m}:null;
  }).filter(Boolean);

  // Collect all unique column ids across all models
  const allColIds=[];const colNameMap={};
  models.forEach(({m})=>m.columns.forEach(col=>{
    if(!allColIds.includes(col.id)){allColIds.push(col.id);colNameMap[col.id]=col.name;}
  }));

  const hStyle={padding:'10px 12px',fontWeight:'bold',fontSize:12,background:'var(--row2)',borderBottom:'2px solid var(--border)',textAlign:'center',minWidth:160,position:'sticky',top:0};
  const cStyle={padding:'8px 10px',fontSize:12,borderBottom:'1px solid var(--border)',verticalAlign:'top'};
  const rStyle={padding:'8px 10px',fontSize:12,fontWeight:'bold',color:'var(--sub)',borderBottom:'1px solid var(--border)',background:'var(--row2)',whiteSpace:'nowrap',position:'sticky',right:0};

  return(
    <Modal onClose={onClose} wide title="⚖️ השוואת דגמים">
      {/* Selected models pills */}
      <div style={{marginBottom:12,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        {models.map(({b,m})=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:20,background:b.color+'22',border:'1px solid '+b.color+'55',fontSize:12}}>
            <span style={{background:b.color,color:'#fff',padding:'1px 7px',borderRadius:10,fontSize:11,fontWeight:'bold'}}>{b.name}</span>
            <span style={{fontWeight:'bold',color:'var(--text)'}}>{m.name}</span>
            <button onClick={()=>onRemove(m.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:14,padding:0,lineHeight:1}}>✕</button>
          </div>
        ))}
        {compareList.length<3&&(
          <span style={{fontSize:11,color:'var(--sub)',background:'var(--row2)',padding:'3px 8px',borderRadius:8}}>
            ניתן להוסיף עוד {3-compareList.length} דגמים — לחץ ⊕ בסרגל
          </span>
        )}
      </div>

      {models.length<2?(
        <div style={{textAlign:'center',padding:40,color:'var(--sub)',fontSize:14}}>
          <div style={{fontSize:40,marginBottom:10}}>⚖️</div>
          <div style={{fontWeight:'bold',marginBottom:6}}>בחר לפחות 2 דגמים להשוואה</div>
          <div style={{fontSize:12}}>לחץ על ⊕ בסרגל לצד שם הדגם</div>
        </div>
      ):(
        <div style={{overflowX:'auto',maxHeight:'65vh',overflowY:'auto',borderRadius:8,border:'1px solid var(--border)'}}>
          <table style={{borderCollapse:'collapse',width:'100%',direction:'rtl'}}>
            <thead>
              <tr>
                <th style={{...hStyle,textAlign:'right',background:'var(--card)',minWidth:110}}>שם חלק</th>
                {models.map(({b,m})=>(
                  <th key={m.id} style={{...hStyle,borderRight:'3px solid '+b.color,background:b.color+'18'}}>
                    <div style={{color:b.color,fontSize:10,marginBottom:2}}>{b.name}</div>
                    <div style={{color:'var(--text)',fontSize:13,fontWeight:'bold'}}>{m.name}</div>
                    <div style={{color:'var(--sub)',fontSize:10}}>{m.parts.length} חלקים</div>
                  </th>
                ))}
              </tr>
              {/* Category row */}
              <tr>
                <td style={rStyle}>קטגוריה</td>
                {models.map(({c,m})=><td key={m.id} style={{...cStyle,fontSize:11,color:'var(--sub)'}}>{c.name}</td>)}
              </tr>
            </thead>
            <tbody>
              {/* One row per column type, showing ALL part values */}
              {allColIds.map((colId,ri)=>{
                const vals=models.map(({m})=>{
                  const col=m.columns.find(c=>c.id===colId);
                  if(!col)return[];
                  return m.parts.map(p=>(p.values[colId]||'').trim()).filter(Boolean);
                });
                if(!vals.some(v=>v.length>0))return null;
                return(
                  <tr key={colId} style={{background:ri%2===0?'var(--row1)':'var(--row2)'}}>
                    <td style={rStyle}>{colNameMap[colId]}</td>
                    {models.map(({m},mi)=>{
                      const col=m.columns.find(c=>c.id===colId);
                      const pv=col?m.parts.map(p=>(p.values[colId]||'').trim()).filter(Boolean):[];
                      return(
                        <td key={m.id} style={cStyle}>
                          {pv.length===0
                            ?<span style={{color:'var(--sub)',fontSize:11}}>—</span>
                            :pv.map((v,i)=>(
                              <div key={i} style={{fontSize:12,color:'var(--text)',padding:'2px 0',borderBottom:i<pv.length-1?'1px dashed var(--border)':'none'}}>
                                {v}
                              </div>
                            ))
                          }
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
    </Modal>
  );
}
