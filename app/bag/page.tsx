'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useBagStore, type BagSection } from '@/stores/bag';
import { AppShell } from '@/components/layout/AppShell';
import { StandBag } from '@/components/bag/StandBag';
import { SectionDetail } from '@/components/bag/SectionDetail';
import { CLUBS, type ClubModel } from '@/data/clubs';

const SECTION_COUNTS = (clubs: ReturnType<typeof useBagStore.getState>['clubs']) => ({
  woods: clubs.filter((c) => ['driver','3w','5w','7w','3h','4h','5h'].includes(c.slot)).length,
  irons: clubs.filter((c) => ['2i','3i','4i','5i','6i','7i','8i','9i','PW'].includes(c.slot)).length,
  wedges: clubs.filter((c) => ['GW','AW','SW','LW','46w','48w','50w','52w','54w','56w','58w','60w'].includes(c.slot)).length,
  putter: clubs.filter((c) => c.slot === 'putter').length,
});

export default function BagPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { clubs, loaded, load, addClub, updateClub, removeClub, bySection } = useBagStore();
  const [activeSection, setActiveSection] = useState<BagSection | null>(null);
  const [showAddClub, setShowAddClub] = useState(false);
  const [addSlot, setAddSlot] = useState('');
  const [addCatalogId, setAddCatalogId] = useState('');
  const [addCarry, setAddCarry] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  if (!user) return null;

  const counts = SECTION_COUNTS(clubs);
  const sectionClubs = activeSection ? bySection(activeSection) : [];

  async function handleAddClub() {
    if (!addSlot) { setAddError('Select a slot'); return; }
    setSaving(true); setAddError('');
    try {
      const cat = CLUBS.find((c) => c.id === addCatalogId);
      await addClub({
        catalogId: addCatalogId || undefined,
        slot: addSlot,
        brand: cat?.brand,
        model: cat?.model,
        carry: addCarry ? parseInt(addCarry, 10) : undefined,
        carryIsEstimate: !addCarry,
      });
      setShowAddClub(false);
      setAddSlot(''); setAddCatalogId(''); setAddCarry('');
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add club');
    } finally {
      setSaving(false);
    }
  }

  const allSlots = ['driver','3w','5w','7w','3h','4h','5h','2i','3i','4i','5i','6i','7i','8i','9i','PW','GW','AW','SW','LW','50w','52w','54w','56w','58w','60w','putter'];
  const filteredCatalog = addSlot ? CLUBS.filter((c) => {
    if (['driver'].includes(addSlot)) return c.type === 'driver';
    if (['3w','5w','7w'].includes(addSlot)) return c.type === 'fw';
    if (['3h','4h','5h'].includes(addSlot)) return c.type === 'hybrid';
    if (/^\d+i$/.test(addSlot) || addSlot === 'PW') return c.type === 'iron';
    if (['GW','AW','SW','LW','50w','52w','54w','56w','58w','60w'].includes(addSlot)) return c.type === 'wedge';
    if (addSlot === 'putter') return c.type === 'putter';
    return true;
  }).slice(0, 40) : [];

  return (
    <AppShell>
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-soft">{clubs.length} clubs in bag</div>
          </div>
          <button
            onClick={() => setShowAddClub(true)}
            className="bg-turf text-white font-display tracking-wider text-[10px] px-3 py-1.5 rounded-lg hover:bg-turf-light transition-colors"
          >
            + ADD CLUB
          </button>
        </div>

        {/* SVG Stand Bag */}
        <div className="flex justify-center py-2">
          <StandBag
            counts={counts}
            active={activeSection}
            onSelect={(s) => setActiveSection(s === activeSection ? null : s)}
          />
        </div>

        {/* Section detail */}
        {activeSection && (
          <SectionDetail
            section={activeSection}
            clubs={sectionClubs}
            onClose={() => setActiveSection(null)}
            onUpdateCarry={(id, carry) => updateClub(id, { carry, carryIsEstimate: false })}
            onRemove={(id) => removeClub(id)}
          />
        )}

        {/* Section summary chips */}
        {!activeSection && (
          <div className="grid grid-cols-2 gap-2.5">
            {(['woods','irons','wedges','putter'] as BagSection[]).map((s) => (
              <button key={s}
                onClick={() => setActiveSection(s)}
                className="bg-card border border-border hover:border-turf/50 rounded-xl px-4 py-3 text-left transition-colors">
                <div className="text-sm font-semibold text-ink capitalize">{s === 'woods' ? 'Woods & Hybrids' : s.charAt(0).toUpperCase() + s.slice(1)}</div>
                <div className="text-[10px] text-ink-muted mt-0.5">{counts[s]} clubs</div>
              </button>
            ))}
          </div>
        )}

        {/* Add club modal */}
        {showAddClub && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm p-5 space-y-4">
              <div className="eyebrow text-turf">Add Club</div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Slot</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  value={addSlot}
                  onChange={(e) => { setAddSlot(e.target.value); setAddCatalogId(''); }}
                >
                  <option value="">Select slot…</option>
                  {allSlots.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {addSlot && filteredCatalog.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Model <span className="text-ink-muted font-normal">(opt)</span></label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                    value={addCatalogId}
                    onChange={(e) => setAddCatalogId(e.target.value)}
                  >
                    <option value="">Generic / custom</option>
                    {filteredCatalog.map((c: ClubModel) => (
                      <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Carry distance <span className="text-ink-muted font-normal">(yd, opt)</span></label>
                <input type="number" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-paper outline-none focus:border-turf"
                  placeholder="Leave blank to use estimate" value={addCarry}
                  onChange={(e) => setAddCarry(e.target.value)} />
              </div>

              {addError && <p className="text-xs text-flag">{addError}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowAddClub(false); setAddSlot(''); setAddCatalogId(''); setAddCarry(''); setAddError(''); }}
                  className="flex-1 border border-border text-ink-soft text-sm font-semibold py-2.5 rounded-xl hover:border-turf/50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddClub} disabled={!addSlot || saving}
                  className="flex-1 bg-turf text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors">
                  {saving ? 'Adding…' : 'Add Club'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
