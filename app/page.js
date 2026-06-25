'use client';
import { useState } from 'react';

export default function Home() {
  const [token, setToken] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [campaignResult, setCampaignResult] = useState(null);
  const [userName, setUserName] = useState('');

  async function metaCall(path, method = 'GET', body = null) {
    const res = await fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, method, body, token })
    });
    return res.json();
  }

  async function connectMeta() {
    if (!token) return setError('Fut Access Token!');
    setLoading(true); setError(''); setSuccess('');
    try {
      const me = await metaCall('/me?fields=id,name');
      if (me.error) throw new Error(me.error.message);
      const accs = await metaCall('/me/adaccounts?fields=name,account_id,account_status,currency');
      if (accs.error) throw new Error(accs.error.message);
      setUserName(me.name);
      setAccounts(accs.data || []);
      setStep(2);
      setSuccess(`✓ Mirë se erdhe, ${me.name}! U gjetën ${accs.data?.length} llogari.`);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  async function generateWithAI() {
    if (!aiPrompt) return setError('Shkruaj përshkrimin!');
    setLoading(true); setError(''); setAiResult(null);
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Ti je ekspert i Meta Ads për klinika dentare. Kthen VETËM JSON të pastër:
{"campaign":{"name":"...","objective":"OUTCOME_LEADS","status":"PAUSED","daily_budget_eur":20,"special_ad_categories":[]},"ad_set":{"name":"...","age_min":35,"age_max":65,"countries":["IT"],"optimization_goal":"LEAD_GENERATION"},"ad_creative":{"headline":"...","primary_text":"...","cta_type":"GET_QUOTE"},"ai_notes":"..."}
Klinika: Azure Dental Atelier, Tiranë. Çmime: €350/implant, €3600 full arch zirconi.`,
          messages: [{ role: 'user', content: aiPrompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      setAiResult(JSON.parse(clean));
    } catch(e) { setError('Gabim AI: ' + e.message); }
    setLoading(false);
  }

  async function createCampaign(campaignData) {
    setLoading(true); setError('');
    try {
      const budget = Math.round((campaignData.daily_budget_eur || 20) * 100);
      const data = await metaCall(`/${selectedAccount}/campaigns`, 'POST', {
        name: campaignData.name,
        objective: campaignData.objective || 'OUTCOME_LEADS',
        status: 'PAUSED',
        daily_budget: budget,
        special_ad_categories: campaignData.special_ad_categories || []
      });
      if (data.error) throw new Error(data.error.message);
      setCampaignResult(data);
      setStep(4);
      setSuccess(`✓ Fushata "${campaignData.name}" u krijua! ID: ${data.id}`);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{fontFamily:'system-ui',background:'#F9F5F1',minHeight:'100vh'}}>
      <header style={{background:'#06173a',padding:'18px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{color:'#F9F5F1',fontSize:'20px',fontWeight:'600',letterSpacing:'0.04em'}}>
          Azure <span style={{color:'#8FACCB'}}>·</span> Meta Ads AI
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#8FACCB'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:step>=2?'#2ecc71':'#aaa',boxShadow:step>=2?'0 0 6px #2ecc71':'none'}}></div>
          {step>=2 ? `I lidhur · ${userName}` : 'Jo i lidhur'}
        </div>
      </header>

      <div style={{maxWidth:'860px',margin:'0 auto',padding:'32px 24px'}}>

        {/* STEP 1 */}
        <div style={{background:'white',borderRadius:'12px',padding:'28px 32px',marginBottom:'20px',border:'1px solid #ede8e2',opacity:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:step>1?'#2d7a4f':'#0F2567',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'600',flexShrink:0}}>
              {step>1?'✓':'1'}
            </div>
            <div>
              <div style={{fontSize:'18px',fontWeight:'600',color:'#06173a'}}>Lidhu me Meta Ads</div>
              <div style={{fontSize:'13px',color:'#666'}}>Fut Access Token nga Meta Graph API Explorer</div>
            </div>
          </div>
          <div style={{fontSize:'13px',color:'#0F2567',background:'#eef3fb',padding:'12px 16px',borderRadius:'8px',borderLeft:'3px solid #8FACCB',marginBottom:'16px'}}>
            🔑 Token fillon me <strong>EAA...</strong> · Permissions: ads_management, ads_read, business_management
          </div>
          <label style={{fontSize:'12px',fontWeight:'600',letterSpacing:'0.06em',textTransform:'uppercase',color:'#0F2567',display:'block',marginBottom:'6px'}}>Meta Access Token</label>
          <input type="password" value={token} onChange={e=>setToken(e.target.value)}
            placeholder="EAAxxxxx..."
            style={{width:'100%',padding:'11px 14px',border:'1.5px solid #ede8e2',borderRadius:'8px',fontSize:'14px',background:'#F9F5F1',outline:'none',boxSizing:'border-box'}} />
          <button onClick={connectMeta} disabled={loading}
            style={{width:'100%',marginTop:'16px',padding:'12px',background:'#0F2567',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
            {loading && step===1 ? 'Po lidhem...' : 'Lidhu me Meta Ads'}
          </button>
          {error && step===1 && <div style={{marginTop:'10px',padding:'10px 14px',background:'#fdf0ef',color:'#c0392b',borderRadius:'8px',borderLeft:'3px solid #c0392b',fontSize:'13px'}}>{error}</div>}
          {success && step===2 && <div style={{marginTop:'10px',padding:'10px 14px',background:'#e8f5ee',color:'#2d7a4f',borderRadius:'8px',borderLeft:'3px solid #2d7a4f',fontSize:'13px'}}>{success}</div>}
        </div>

        {/* STEP 2 */}
        <div style={{background:'white',borderRadius:'12px',padding:'28px 32px',marginBottom:'20px',border:'1px solid #ede8e2',opacity:step>=2?1:0.4,pointerEvents:step>=2?'all':'none'}}>
          <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:step>2?'#2d7a4f':'#0F2567',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'600',flexShrink:0}}>
              {step>2?'✓':'2'}
            </div>
            <div>
              <div style={{fontSize:'18px',fontWeight:'600',color:'#06173a'}}>Zgjidh Ad Account</div>
              <div style={{fontSize:'13px',color:'#666'}}>Llogaritë reklamuese të disponueshme</div>
            </div>
          </div>
          {accounts.map(acc => (
            <div key={acc.account_id} onClick={()=>{setSelectedAccount('act_'+acc.account_id);setSelectedAccountName(acc.name);setStep(3);}}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',border:`1.5px solid ${selectedAccount==='act_'+acc.account_id?'#0F2567':'#ede8e2'}`,borderRadius:'8px',marginBottom:'8px',cursor:'pointer',background:selectedAccount==='act_'+acc.account_id?'#F9F5F1':'white'}}>
              <div>
                <div style={{fontWeight:'500',fontSize:'14px'}}>{acc.name}</div>
                <div style={{fontSize:'12px',color:'#888'}}>ID: {acc.account_id} · {acc.currency}</div>
              </div>
              <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:acc.account_status===1?'#e8f5ee':'#f0f0f0',color:acc.account_status===1?'#2d7a4f':'#666'}}>
                {acc.account_status===1?'Aktive':'Joaktive'}
              </span>
            </div>
          ))}
          {selectedAccount && <div style={{padding:'10px 14px',background:'#e8f5ee',color:'#2d7a4f',borderRadius:'8px',borderLeft:'3px solid #2d7a4f',fontSize:'13px',marginTop:'8px'}}>✓ Zgjedhur: {selectedAccountName}</div>}
        </div>

        {/* STEP 3 */}
        <div style={{background:'white',borderRadius:'12px',padding:'28px 32px',marginBottom:'20px',border:'1px solid #ede8e2',opacity:step>=3?1:0.4,pointerEvents:step>=3?'all':'none'}}>
          <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:step>3?'#2d7a4f':'#0F2567',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'600',flexShrink:0}}>
              {step>3?'✓':'3'}
            </div>
            <div>
              <div style={{fontSize:'18px',fontWeight:'600',color:'#06173a'}}>Krijo Fushatë me AI</div>
              <div style={{fontSize:'13px',color:'#666'}}>Claude gjeneron strukturën e plotë</div>
            </div>
          </div>

          <label style={{fontSize:'12px',fontWeight:'600',letterSpacing:'0.06em',textTransform:'uppercase',color:'#0F2567',display:'block',marginBottom:'6px'}}>Përshkruaj fushatën</label>
          <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
            placeholder="Shembull: Dua të tërheq pacientë italianë për implante dentare në Tiranë. Budget 20€/ditë. Target: 35-65 vjeç nga Italia Veriore. Oferta: implant €350, e gjithë goja zirconi €3,600..."
            style={{width:'100%',padding:'11px 14px',border:'1.5px solid #ede8e2',borderRadius:'8px',fontSize:'14px',background:'#F9F5F1',minHeight:'100px',resize:'vertical',outline:'none',boxSizing:'border-box',lineHeight:'1.6'}} />

          <button onClick={generateWithAI} disabled={loading}
            style={{width:'100%',marginTop:'16px',padding:'12px',background:'#0F2567',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
            {loading ? 'Claude po gjeneron...' : '✦ Gjenero me Claude AI'}
          </button>

          {error && <div style={{marginTop:'10px',padding:'10px 14px',background:'#fdf0ef',color:'#c0392b',borderRadius:'8px',borderLeft:'3px solid #c0392b',fontSize:'13px'}}>{error}</div>}

          {aiResult && (
            <div style={{marginTop:'16px'}}>
              <div style={{background:'#06173a',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
                <div style={{fontSize:'11px',letterSpacing:'0.08em',textTransform:'uppercase',color:'rgba(143,172,203,0.6)',marginBottom:'10px'}}>Claude · Struktura e fushatës</div>
                <pre style={{color:'#8FACCB',fontSize:'12px',whiteSpace:'pre-wrap',lineHeight:'1.7',margin:0}}>{JSON.stringify(aiResult, null, 2)}</pre>
              </div>
              <button onClick={()=>createCampaign(aiResult.campaign)} disabled={loading}
                style={{width:'100%',padding:'12px',background:'#2d7a4f',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
                {loading ? 'Po krijohet...' : '🚀 Krijo Fushatën në Meta Ads'}
              </button>
            </div>
          )}
        </div>

        {/* STEP 4 - Result */}
        {campaignResult && (
          <div style={{background:'white',borderRadius:'12px',padding:'28px 32px',border:'1.5px solid #2d7a4f'}}>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#2d7a4f',marginBottom:'16px',fontFamily:'serif'}}>✓ Fushata u krijua me sukses!</div>
            {[['Campaign ID', campaignResult.id],['Llogaria', selectedAccountName],['Status','PAUSED — kontrollo në Ads Manager']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ede8e2',fontSize:'13px'}}>
                <span style={{color:'#666'}}>{k}</span>
                <span style={{fontWeight:'500',color:'#06173a'}}>{v}</span>
              </div>
            ))}
            <a href="https://adsmanager.facebook.com" target="_blank"
              style={{display:'block',textAlign:'center',marginTop:'16px',padding:'12px',background:'#0F2567',color:'white',borderRadius:'8px',fontSize:'14px',fontWeight:'600',textDecoration:'none'}}>
              Hap Ads Manager →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
