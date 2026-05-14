// ══════════ COMPARE PANEL ══════════
function ComparePanel({compareList,data,onClose,onRemove}){
  if(!compareList||compareList.length===0)return null;
  const models=compareList.map(({bid,cid,mid})=>{
    const b=data.brands.find(x=>x.id===bid);
    const c=b&&b.categories.find(x=>x.id===cid);
    const m=c&&c.models.find(x=>x.id===mid);
    return m?{b,c,m}:null;
  }).filter(Boolean);

  const allColIds=[];const colNameMap={};
  models.forEach(({m})=>m.columns.forEach(col=>{if(!allColIds.includes(col.id)){allColIds.push(col.id);colNameMap[col.id]=col.name;}}));

  const hStyle={padding:'10px 12px',fontWeight:'bold',fontSize:12,background:'var(--row2)',borderBottom:'2px solid var(--border)',textAlign:'center',minWidth:150};
  const cStyle={padding:'7px 10px',fontSize:12,borderBottom:'1px solid var(--border)',verticalAlign:'top'};
  const rStyle={padding:'7px 10px',fontSize:12,fontWeight:'bold',color:'var(--sub)',borderBottom:'1px solid var(--border)',background:'var(--row2)',whiteSpace:'nowrap'};

  return(
    <Modal onClose={onClose} wide title="⚖️ השוואת דגמים">
      <div style={{marginBottom:12,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,color:'var(--sub)'}}>דגמים נבחרים:</span>
        {models.map(({b,m})=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:20,background:b.color+'22',border:'1px solid '+b.color+'55',fontSize:12}}>
            <span style={{background:b.color,color:'#fff',padding:'1px 7px',borderRadius:10,fontSize:11,fontWeight:'bold'}}>{b.name}</span>
            <span style={{fontWeight:'bold',color:'var(--text)'}}>{m.name}</span>
            <button onClick={()=>onRemove(m.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:14,padding:0,lineHeight:1}}>✕</button>
          </div>
        ))}
        {compareList.length<3&&<span style={{fontSize:11,color:'var(--sub)',background:'var(--row2)',padding:'3px 8px',borderRadius:8}}>ניתן להוסיף עוד {3-compareList.length} דגמים (לחץ ⊕ בסרגל)</span>}
      </div>
      {models.length<2?(
        <div style={{textAlign:'center',padding:40,color:'var(--sub)',fontSize:14}}>
          <div style={{fontSize:40,marginBottom:10}}>⚖️</div>
          <div style={{fontWeight:'bold',marginBottom:6}}>בחר לפחות 2 דגמים להשוואה</div>
          <div style={{fontSize:12}}>לחץ על ⊕ בסרגל לצד שם הדגם כדי להוסיפו להשוואה</div>
        </div>
      ):(
        <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto',borderRadius:8,border:'1px solid var(--border)'}}>
          <table style={{borderCollapse:'collapse',width:'100%',direction:'rtl'}}>
            <thead style={{position:'sticky',top:0,zIndex:2}}>
              <tr>
                <th style={{...hStyle,textAlign:'right',background:'var(--card)',minWidth:100}}>שדה</th>
                {models.map(({b,m})=>(
                  <th key={m.id} style={{...hStyle,borderRight:'3px solid '+b.color,background:b.color+'18'}}>
                    <div style={{color:b.color,fontSize:10,marginBottom:2}}>{b.name}</div>
                    <div style={{color:'var(--text)',fontSize:13}}>{m.name}</div>
                    <div style={{color:'var(--sub)',fontSize:10}}>{m.parts.length} חלקים</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={rStyle}>קטגוריה</td>
                {models.map(({c,m})=><td key={m.id} style={cStyle}>{c.name}</td>)}
              </tr>
              <tr style={{background:'var(--row2)'}}>
                <td style={rStyle}>מספר חלקים</td>
                {models.map(({b,m})=><td key={m.id} style={{...cStyle,color:b.color,fontWeight:'bold'}}>{m.parts.length}</td>)}
              </tr>
              {allColIds.map((colId,ri)=>{
                const vals=models.map(({m})=>{
                  const col=m.columns.find(c=>c.id===colId);
                  if(!col)return[];
                  return m.parts.map(p=>(p.values[colId]||'').trim()).filter(Boolean);
                });
                if(!vals.some(v=>v.length>0))return null;
                const allFlat=[].concat(...vals);
                const unique=allFlat.filter((v,i,a)=>a.indexOf(v)===i);
                const isDiff=unique.length>1;
                return(
                  <tr key={colId} style={{background:ri%2===0?'var(--row1)':'var(--row2)'}}>
                    <td style={{...rStyle,color:isDiff?'#e65100':'var(--sub)'}}>
                      {colNameMap[colId]}
                      {isDiff&&<span style={{marginRight:6,fontSize:9,background:'#e65100',color:'#fff',borderRadius:4,padding:'1px 5px'}}>שונה</span>}
                    </td>
                    {models.map(({m})=>{
                      const col=m.columns.find(c=>c.id===colId);
                      const pv=col?m.parts.map(p=>(p.values[colId]||'').trim()).filter(Boolean):[];
                      return(
                        <td key={m.id} style={{...cStyle,background:isDiff?'#fff8e133':''}}>
                          {pv.length===0
                            ?<span style={{color:'var(--sub)',fontSize:11}}>—</span>
                            :pv.slice(0,5).map((v,i)=><div key={i} style={{fontSize:12,color:'var(--text)',padding:'1px 0'}}>{v}</div>)
                          }
                          {pv.length>5&&<div style={{fontSize:10,color:'var(--sub)'}}>ועוד {pv.length-5}...</div>}
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
