--- a/src/pages/index.tsx
+++ b/src/pages/index.tsx
@@ -1,6 +1,6 @@
 import { useEffect, useMemo, useState } from 'react';
 import { addDays, format, parseISO } from 'date-fns';
-import { APPS_SCRIPT_URL } from '@/lib/config';
+import { APPS_SCRIPT_URL } from '../lib/config';


type Registro = {
  id?: string;
  madre: string;
  padre: string;
  raza: string;
  fechaMonta: string;
  diasGestacion: number;
  fechaPartoEstimada: string;
  camadaEstimada?: number | null;
  notas?: string;
  estado?: 'pendiente' | 'parió' | 'perdida' | 'cancelado';
};

const defaultForm: Registro = {
  madre: '',
  padre: '',
  raza: '',
  fechaMonta: '',
  diasGestacion: 65,
  fechaPartoEstimada: '',
  camadaEstimada: null,
  notas: '',
  estado: 'pendiente'
};

async function api(method: 'GET'|'POST', payload?: any) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Falta configurar NEXT_PUBLIC_APPS_SCRIPT_URL');
  }
  const res = await fetch(APPS_SCRIPT_URL, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) throw new Error('Error de comunicación con el backend');
  return res.json();
}

export default function Home() {
  const [form, setForm] = useState<Registro>(defaultForm);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string| null>(null);

  const fechaParto = useMemo(() => {
    if (!form.fechaMonta || !form.diasGestacion) return '';
    try {
      const d = addDays(parseISO(form.fechaMonta), form.diasGestacion || 65);
      return format(d, 'yyyy-MM-dd');
    } catch { return ''; }
  }, [form.fechaMonta, form.diasGestacion]);

  useEffect(() => { setForm(prev => ({ ...prev, fechaPartoEstimada: fechaParto })); }, [fechaParto]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await api('GET');
      setRegistros(data?.rows || []);
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { ...form, fechaPartoEstimada: fechaParto };
      await api('POST', { action: 'add', registro: payload });
      setForm(defaultForm);
      await load();
      alert('✅ Registro guardado');
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Montas Stoacat · Predicción de Parto</h1>
      <p><small>Base de datos en Google Sheets + Alarmas por Google Calendar</small></p>

      <div className="card" style={{marginBottom:16}}>
        <h2>Nuevo registro</h2>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div><label>Madre</label><input value={form.madre} onChange={e=>setForm({...form, madre:e.target.value})} required/></div>
            <div><label>Padre</label><input value={form.padre} onChange={e=>setForm({...form, padre:e.target.value})}/></div>
          </div>
          <div className="row">
            <div><label>Raza</label><input value={form.raza} onChange={e=>setForm({...form, raza:e.target.value})}/></div>
            <div><label>Fecha de monta</label><input type="date" value={form.fechaMonta} onChange={e=>setForm({...form, fechaMonta:e.target.value})} required/></div>
          </div>
          <div className="row3">
            <div><label>Días de gestación (63–66)</label><input type="number" min={60} max={70} value={form.diasGestacion} onChange={e=>setForm({...form, diasGestacion: Number(e.target.value)})}/></div>
            <div><label>Parto estimado</label><input type="date" value={fechaParto} readOnly/></div>
            <div><label>Tamaño cam. estimado</label><input type="number" min={1} max={10} value={form.camadaEstimada || ''} onChange={e=>setForm({...form, camadaEstimada: e.target.value ? Number(e.target.value) : null})}/></div>
          </div>
          <div className="row">
            <div><label>Notas</label><input value={form.notas} onChange={e=>setForm({...form, notas:e.target.value})}/></div>
            <div><label>Estado</label><select value={form.estado} onChange={e=>setForm({...form, estado: e.target.value as any})}>
              <option value="pendiente">Pendiente</option>
              <option value="parió">Parió</option>
              <option value="perdida">Pérdida</option>
              <option value="cancelado">Cancelado</option>
            </select></div>
          </div>
          <div style={{marginTop:12, display:'flex', gap:8}}>
            <button className="btn primary" type="submit" disabled={loading}>Guardar</button>
            <button className="btn ghost" type="button" onClick={load} disabled={loading}>Actualizar</button>
          </div>
          {error && <p style={{color:'crimson'}}>{error}</p>}
        </form>
      </div>

      <div className="card">
        <h2>Registros</h2>
        {loading ? <p>Cargando…</p> : (
          <table className="table">
            <thead><tr><th>Madre</th><th>Padre</th><th>Raza</th><th>Monta</th><th>Parto est.</th><th>Estado</th><th>Notas</th></tr></thead>
            <tbody>
              {registros.map((r,i)=>(
                <tr key={i}>
                  <td>{r.madre}</td>
                  <td>{r.padre}</td>
                  <td>{r.raza}</td>
                  <td>{r.fechaMonta}</td>
                  <td><span className="badge">{r.fechaPartoEstimada}</span></td>
                  <td>{r.estado}</td>
                  <td>{r.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
